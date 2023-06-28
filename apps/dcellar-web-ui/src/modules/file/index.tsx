import { Flex, Text, Image, useDisclosure, toast, Link, Tooltip } from '@totejs/uikit';
import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';
import { FileStatusModal } from '@/modules/file/components/FileStatusModal';
import { FileDetailModal } from '@/modules/file/components/FileDetailModal';
import { useLogin } from '@/hooks/useLogin';

import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  FILE_TITLE_FILE_EMPTY,
  FILE_TITLE_FILE_NAME_ERROR,
  FILE_TITLE_FILE_TOO_LARGE,
  FILE_TITLE_SP_REJECTED,
  FILE_TOO_LARGE_URL,
  GET_GAS_FEE_DEFAULT_ERROR,
  GET_GAS_FEE_LACK_BALANCE_ERROR,
  GET_LOCK_FEE_ERROR,
  UPLOAD_IMAGE_URL,
} from '@/modules/file/constant';
import { getBucketInfo, getSpInfo } from '@/utils/sp';
import { DuplicateNameModal } from '@/modules/file/components/DuplicateNameModal';
import { getLockFee } from '@/utils/wallet';
import { FileTable } from '@/modules/file/components/FileTable';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { useRouter } from 'next/router';
import { getDomain } from '@/utils/getDomain';
import { checkSpOffChainDataAvailable, getSpOffChainData } from '../off-chain-auth/utils';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { FileListEmpty } from './components/FileListEmpty';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { DISCONTINUED_BANNER_HEIGHT, DISCONTINUED_BANNER_MARGIN_BOTTOM } from '@/constants/common';
import UploadIcon from '@/public/images/files/upload_transparency.svg';
import { getClient } from '@/base/client';
import { useSPs } from '@/hooks/useSPs';
import { ISpInfo, TCreateObject } from '@bnb-chain/greenfield-chain-sdk';
import { isEmpty } from 'lodash-es';
import { validateObjectName } from './utils/validateObjectName';
import { genCreateObjectTx } from './utils/genCreateObjectTx';
import { ChainVisibilityEnum, TCreateObjectData } from './type';
import dayjs from 'dayjs';
import { CreateFolderModal } from '@/modules/file/components/CreateFolderModal';
import { IRawSPInfo } from '../buckets/type';
import { convertObjectInfo } from './utils/convertObjectInfo';
import { ChecksumWorkerContext } from '@/context/GlobalContext/ChecksumWorkerContext';

interface pageProps {
  bucketName: string;
  folderName: string;
  bucketInfo: any;
}

const MAX_FOLDER_LEVEL = 10;
const FILE_NAME_RULES_DOC = `https://docs.nodereal.io/docs/faq-1#question-what-is-the-naming-rules-for-files`;

// max file upload size is 256MB, which is 1024*1024*256=MAX_SIZE byte
const MAX_SIZE = 268435456;
const renderUploadButton = (
  isCurrentUser: boolean,
  isDiscontinued: boolean,
  gaClickName?: string,
) => {
  if (!isCurrentUser) return <></>;
  if (isDiscontinued) {
    return (
      <Tooltip
        placement="bottom-end"
        content="Bucket in the discontinue status cannot upload files."
      >
        <Flex
          bgColor="#AEB4BC"
          _hover={{ bg: '#AEB4BC' }}
          position="relative"
          paddingX="16px"
          paddingY="8px"
          alignItems="center"
          borderRadius={'8px'}
          cursor="pointer"
          color="#76808F"
        >
          <UploadIcon w="24px" h="24px" alt="" />
          <Text fontWeight={500} fontSize="16px" lineHeight="20px">
            Upload
          </Text>
        </Flex>
      </Tooltip>
    );
  }

  return (
    <GAClick name={gaClickName}>
      <label htmlFor="file-upload" className="custom-file-upload">
        <Flex
          bgColor="readable.brand6"
          _hover={{ bg: '#2EC659' }}
          position="relative"
          paddingX="16px"
          paddingY="8px"
          alignItems="center"
          borderRadius={'8px'}
          cursor="pointer"
        >
          <Image src={UPLOAD_IMAGE_URL} w="24px" h="24px" alt="" />
          <Text color="readable.white" fontWeight={500} fontSize="16px" lineHeight="20px">
            Upload
          </Text>
        </Flex>
      </label>
    </GAClick>
  );
};

let preSelectTime = Date.now();

export const File = ({ bucketName, folderName, bucketInfo }: pageProps) => {
  const [file, setFile] = useState<File>();
  const [fileName, setFileName] = useState<string>();
  const loginData = useLogin();
  const { loginState } = loginData;
  const { address } = loginState;
  const [freeze, setFreeze] = useState(false);
  const [gasFeeLoading, setGasFeeLoading] = useState(true);
  const [lockFeeLoading, setLockFeeLoading] = useState(true);
  const [gasFee, setGasFee] = useState('-1');
  const [lockFee, setLockFee] = useState('-1');
  const [statusModalButtonText, setStatusModalButtonText] = useState(BUTTON_GOT_IT);
  const [createObjectData, setCreateObjectData] = useState<TCreateObjectData>(
    {} as TCreateObjectData,
  );
  const [listObjects, setListObjects] = useState<Array<any>>([]);
  const [primarySpAddress, setPrimarySpAddress] = useState<string>('');
  // 去除，目前没有用到
  const [primarySpSealAddress, setPrimarySpSealAddress] = useState<string>('');
  const [secondarySpAddresses, setSecondarySpAddresses] = useState<Array<string>>();
  const [primarySp, setPrimarySp] = useState<IRawSPInfo>({} as IRawSPInfo);
  const [isEmptyData, setIsEmptyData] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [isInitReady, setIsInitReady] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const greenfieldRef = useRef<Worker>();
  const checksumWorkerApiRef = useContext(ChecksumWorkerContext);
  const router = useRouter();
  const { sps } = useSPs();
  const { setOpenAuthModal } = useOffChainAuth();
  const isDiscontinued = bucketInfo.bucketStatus === 1;

  // 采用facade重构掉
  const getObjectList = async (currentEndpoint: string) => {
    try {
      const domain = getDomain();
      const { seedString } = await getSpOffChainData({ address, spAddress: primarySpAddress });
      const query = new URLSearchParams();
      query.append('delimiter', '/');
      query.append('max-keys', '1000');
      if (folderName) {
        query.append('prefix', folderName);
      }
      const client = await getClient();
      const listResult = await client.object.listObjects({
        address,
        bucketName,
        endpoint: currentEndpoint,
        domain,
        seedString,
        query,
      });
      const { objects = [], common_prefixes = [] } = listResult.body ?? ({} as any);
      const files = objects
        .filter((v: any) => !(v.removed || v.object_info.object_name === folderName))
        .map((v: any) => v.object_info)
        .sort(function (a: any, b: any) {
          return Number(b.create_at) - Number(a.create_at);
        });
      const folders = common_prefixes
        .sort((a: string, b: string) => a.localeCompare(b))
        .map((folder: string) => ({
          object_name: folder,
          object_status: 1,
        }));
      const items = folders.concat(files);
      setListObjects(items);
      setIsEmptyData(!items.length);
      setListLoading(false);
      setIsInitReady(true);
    } catch (error) {
      setIsInitReady(true);
      setIsEmptyData(true);
      setListLoading(false);
      toast.error({
        description: 'Error occurred when fetching file list.',
      });
      // eslint-disable-next-line no-console
      console.error('list result error', error);
    }
  };
  const getGatewayParams = async () => {
    try {
      if (isEmpty(sps)) return;
      setIsInitReady(false);
      // refactor: bucketInfo从redux中获取
      const bucketInfo = await getBucketInfo(bucketName);
      // 判断当前bucket是否属于当前用户
      setIsCurrentUser(bucketInfo?.owner === address);
      // 判断当前bucket的 primary sp是否存在，并存储到status中
      const currentPrimarySpAddress = bucketInfo?.primarySpAddress;
      if (!currentPrimarySpAddress) {
        toast.error({
          description: `Current bucket is lacking of sp address, please check.`,
        });
        return;
      }
      setPrimarySpAddress(currentPrimarySpAddress);
      // getSpInfo 统一从全局获取，优化到从全局获取
      const primarySpInfo = await getSpInfo(currentPrimarySpAddress);
      setPrimarySpSealAddress(primarySpInfo.sealAddress);
      const spIndex = sps.findIndex(function (item: any) {
        return item.operatorAddress === bucketInfo?.primarySpAddress;
      });
      if (spIndex < 0) {
        toast.error({
          description: `Sp address info is mismatched, please retry.`,
        });
        return;
      }
      const currentEndpoint = sps[spIndex]?.endpoint;
      setPrimarySp(sps[spIndex]);
      const currentSecondaryAddresses = sps
        .filter((v: any, i: number) => i !== spIndex)
        .map((item: any) => item.operatorAddress);
      setSecondarySpAddresses(currentSecondaryAddresses);
      getObjectList(currentEndpoint);
    } catch (error: any) {
      toast.error({ description: error.message });
      setIsCurrentUser(false);
    }
  };
  // only get list when init
  useEffect(() => {
    if (bucketName && !isEmpty(sps)) {
      // 梳理数据并发起请求
      getGatewayParams();
    }
  }, [sps, folderName]);

  useEffect(() => {
    if (!isInitReady) return;
    // 这么处理是为了让新增的时候可以前端手动设置，然后刷新列表，这种方式将会被废弃掉
    const realListObjects = listObjects
      .filter((v: any) => !v.removed)
      //convertObjectInfo 是为了转换visibility而坐的
      .map((v: any) => (v.object_info ? convertObjectInfo(v.object_info) : convertObjectInfo(v)));
    if (realListObjects.length === 0) {
      setIsEmptyData(true);
    } else {
      setIsEmptyData(false);
    }
  }, [listObjects.length]);

  const renderCreteFolderButton = (
    isCurrentUser: boolean,
    isDiscontinued: boolean,
    gaClickName?: string,
  ) => {
    if (!isCurrentUser) return <></>;
    const maxFolderDepth = folderName && folderName.split('/').length - 1 >= MAX_FOLDER_LEVEL;
    const disabled = maxFolderDepth || isDiscontinued;
    return (
      <Tooltip
        content={`You have reached the maximum supported folder depth (${MAX_FOLDER_LEVEL}).`}
        placement={'bottom-start'}
        visibility={maxFolderDepth ? 'visible' : 'hidden'}
      >
        <GAClick name={gaClickName}>
          <Flex
            bgColor={disabled ? 'readable.tertiary' : 'readable.normal'}
            _hover={{ bg: 'readable.tertiary' }}
            position="relative"
            paddingX="16px"
            paddingY="8px"
            alignItems="center"
            borderRadius={'8px'}
            cursor={disabled ? 'default' : 'pointer'}
            onClick={() => {
              if (disabled) return;
              if (!primarySp.endpoint) {
                toast.error({
                  description: 'SP Endpoint is not ready',
                });
              } else {
                onCreateFolderModalOpen();
              }
            }}
          >
            <Text color="readable.white" fontWeight={500} fontSize="16px" lineHeight="20px">
              Create Folder
            </Text>
          </Flex>
        </GAClick>
      </Tooltip>
    );
  };

  // facade化
  const fetchCreateObjectApproval = async (
    uploadFile: File,
    newFileName?: string,
    visibility = ChainVisibilityEnum.VISIBILITY_TYPE_PRIVATE,
  ) => {
    const objectName = newFileName ? newFileName : uploadFile.name;
    let hashResult;
    setFreeze(true);
    const start = performance.now();
    let selectTime = (preSelectTime = Date.now());
    hashResult = await checksumWorkerApiRef.current?.generateCheckSumV2(uploadFile).finally(() => {
      console.info('HASH: ', performance.now() - start);
    });
    if (preSelectTime > selectTime) return;
    setFreeze(false);

    const spOffChainData = await getSpOffChainData({
      address,
      spAddress: primarySpAddress,
    });
    if (!checkSpOffChainDataAvailable(spOffChainData)) {
      onStatusModalClose();
      onDetailModalClose();
      setOpenAuthModal();
      return Promise.reject();
    }
    const domain = getDomain();
    try {
      const spInfo = {
        endpoint: primarySp.endpoint,
        primarySpAddress: primarySp.operatorAddress,
        sealAddress: primarySp.sealAddress,
        secondarySpAddresses,
      } as ISpInfo;
      if (!hashResult?.expectCheckSums?.length) {
        throw new Error('Error occurred when calculating file hash.');
      }
      const { contentLength, expectCheckSums } = hashResult;
      const configParam: TCreateObject = {
        bucketName,
        objectName,
        creator: address,
        visibility,
        fileType: uploadFile.type || 'application/octet-stream',
        contentLength,
        expectCheckSums,
        spInfo,
        signType: 'offChainAuth',
        domain,
        seedString: spOffChainData.seedString,
      };
      const CreateObjectTx = await genCreateObjectTx(configParam);

      const createObjectData = {
        configParam,
        CreateObjectTx,
      };
      setCreateObjectData(createObjectData);

      return CreateObjectTx;
    } catch (error: any) {
      if (error.statusCode === 500) {
        onStatusModalClose();
        onDetailModalClose();
        setOpenAuthModal();
        return Promise.reject();
      }
      onDetailModalClose();
      setGasFeeLoading(false);
      setLockFeeLoading(false);
      setStatusModalIcon(FILE_FAILED_URL);
      setStatusModalTitle(FILE_TITLE_SP_REJECTED);
      setStatusModalErrorText('Error message: ' + error?.message ?? '');
      setStatusModalDescription('');
      onStatusModalOpen();
      // eslint-disable-next-line no-console
      console.error('Sp error', error);
      return Promise.reject();
    }
  };

  // 应该是没有这个了，直接从simulate中获取
  const getLockFeeAndSet = async (size = 0) => {
    try {
      setLockFeeLoading(true);
      const lockFeeInBNB = await getLockFee(size, primarySpAddress);
      setLockFee(lockFeeInBNB.toString());
      setLockFeeLoading(false);
    } catch (error) {
      toast.error({
        description: GET_LOCK_FEE_ERROR,
      });
      onDetailModalClose();
      setLockFeeLoading(false);
      setLockFee('-1');
      setGasFeeLoading(false);
      setGasFee('-1');
      // eslint-disable-next-line no-console
      console.error('Get lock fee error', error);
      return;
    }
  };

  // 在simulate的时候获取
  const getGasFeeAndSet = async (uploadFile: File, createObjectTx: any) => {
    try {
      setGasFeeLoading(true);
      const simulateInfo = await createObjectTx.simulate({
        denom: 'BNB',
      });
      setGasFee(simulateInfo.gasFee);
      setGasFeeLoading(false);
    } catch (error: any) {
      onDetailModalClose();
      setGasFeeLoading(false);
      setLockFeeLoading(false);
      setLockFee('-1');
      setGasFee('-1');
      if (error.message.includes('Object already exists')) {
        setDuplicateNameModalDescription(
          `${uploadFile.name} is already existed in current bucket. Do you want to automatically rename it to keep both files?`,
        );
        onDuplicateNameModalOpen();
      } else {
        setStatusModalIcon(FILE_FAILED_URL);
        setStatusModalTitle('Chain Rejected');
        if (
          error.message.includes('lack of') ||
          error.message.includes('static balance is not enough')
        ) {
          // todo get the number of lacking money
          setStatusModalDescription(GET_GAS_FEE_LACK_BALANCE_ERROR);
        } else {
          setStatusModalDescription(GET_GAS_FEE_DEFAULT_ERROR);
          setStatusModalErrorText('Error message: ' + error?.message ?? '');
        }
        onStatusModalOpen();
      }
      // eslint-disable-next-line no-console
      console.error('Get gas fee error', error);
      return;
    }
  };
  // 上传文件功能最好是抽离到一个组件中，不要写在这里面，方便复用
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGasFee('-1');
      const uploadFile = e.target.files[0];
      // clear input value to prevent onChange hook doesn't apply when select same file from explorer again
      e.target.value = '';
      setStatusModalErrorText('');
      if (uploadFile.size > MAX_SIZE) {
        setStatusModalIcon(FILE_TOO_LARGE_URL);
        setStatusModalTitle(FILE_TITLE_FILE_TOO_LARGE);
        setStatusModalDescription('File size exceeded the maximum allowed size (256MB).');
        onStatusModalOpen();
        return;
      }
      if (uploadFile.size <= 0) {
        setStatusModalIcon(FILE_TOO_LARGE_URL);
        setStatusModalTitle(FILE_TITLE_FILE_EMPTY);
        setStatusModalDescription('File size is zero, please check.');
        onStatusModalOpen();
        return;
      }
      try {
        validateObjectName(uploadFile.name);
      } catch (error) {
        setStatusModalIcon(FILE_FAILED_URL);
        setStatusModalTitle(FILE_TITLE_FILE_NAME_ERROR);
        setStatusModalDescription(
          <Text>
            Oops, your file’s name is not supported. Please check the naming rules in the{' '}
            <Link
              href={FILE_NAME_RULES_DOC}
              color="readable.normal"
              isExternal={true}
              _hover={{ color: '#1184EE' }}
              textDecoration={'underline'}
            >
              docs
            </Link>{' '}
            and change your file name accordingly.
          </Text>,
        );
        onStatusModalOpen();
        return;
      }
      setFile(uploadFile);
      const fileName = `${folderName}${uploadFile.name}`;
      setFileName(fileName);
      setLockFee('-1');
      setGasFeeLoading(true);
      setLockFeeLoading(true);

      if (!uploadFile) {
        // eslint-disable-next-line no-console
        console.error('Must select file first.');
        return;
      }
      onDetailModalOpen();
      const createObjectTx = await fetchCreateObjectApproval(uploadFile, fileName);
      if (!createObjectTx) return;
      await getGasFeeAndSet(uploadFile, createObjectTx);
      await getLockFeeAndSet(uploadFile.size);
    }
  };
  // 统一收敛一下modal，
  const {
    isOpen: isStatusModalOpen,
    onOpen: onStatusModalOpen,
    onClose: onStatusModalClose,
  } = useDisclosure();
  const {
    isOpen: isDuplicateNameModalOpen,
    onOpen: onDuplicateNameModalOpen,
    onClose: onDuplicateNameModalClose,
  } = useDisclosure();
  const [detailModalTitle, setDetailModalTitle] = useState('Upload File');
  const [statusModalIcon, setStatusModalIcon] = useState<string>('');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalErrorText, setStatusModalErrorText] = useState('');

  const [statusModalDescription, setStatusModalDescription] = useState<string | JSX.Element>('');
  const [duplicateNameModalDescription, setDuplicateNameModalDescription] = useState('');

  const {
    isOpen: isDetailModalOpen,
    onOpen: onDetailModalOpen,
    onClose: onDetailModalClose,
  } = useDisclosure();
  const {
    isOpen: isCreateFolderModalOpen,
    onOpen: onCreateFolderModalOpen,
    onClose: onCreateFolderModalClose,
  } = useDisclosure();
  if (!bucketName) return <></>;
  const showUploadButtonOnHeader = !isEmptyData && !listLoading;

  const renderTitle = () => {
    if (folderName) {
      const folderNameArray = folderName.split('/');
      return folderNameArray[folderNameArray.length - 2];
    }
    return bucketName;
  };
  const title = renderTitle();
  return (
    <Flex p={'24px'} flexDirection="column" flex="1" height={'100%'}>
      <Flex alignItems="center" w="100%" justifyContent="space-between" mb={'12px'}>
        <Tooltip
          content={title}
          placement={'bottom-end'}
          visibility={title.length > 40 ? 'visible' : 'hidden'}
        >
          <Text
            wordBreak="break-all"
            as={'h1'}
            flex={1}
            fontWeight="700"
            fontSize={'24px'}
            lineHeight="36px"
            maxWidth="700px"
            overflow="hidden"
            noOfLines={1}
            textOverflow="ellipsis"
          >
            {title}
          </Text>
        </Tooltip>
        <Flex gap={12}>
          {showUploadButtonOnHeader &&
            renderCreteFolderButton(
              isCurrentUser,
              isDiscontinued,
              'dc.file.list.create_folder.click',
            )}
          {showUploadButtonOnHeader &&
            renderUploadButton(isCurrentUser, isDiscontinued, 'dc.file.list.upload.click')}
        </Flex>
        <input
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          style={{
            visibility: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      </Flex>
      {isDiscontinued && (
        <DiscontinueBanner
          content="All the items in this bucket were marked as discontinued and will be deleted by SP soon. Please backup your data in time. "
          height={DISCONTINUED_BANNER_HEIGHT}
          marginBottom={DISCONTINUED_BANNER_MARGIN_BOTTOM}
        />
      )}
      {isEmptyData && isCurrentUser ? (
        <Flex
          flex={1}
          alignItems="center"
          flexDirection={'column'}
          justifyContent={'center'}
          marginBottom={'104px'}
        >
          <FileListEmpty bucketStatus={bucketInfo.bucketStatus} folderName={folderName} />
          <GAShow name="dc.file.empty.upload.show" />
          {bucketInfo.bucketStatus === 0 && (
            <Flex gap={12}>
              {renderCreteFolderButton(
                isCurrentUser,
                isDiscontinued,
                'dc.file.empty.create_folder.click',
              )}
              {renderUploadButton(isCurrentUser, isDiscontinued, 'dc.file.empty.upload.click')}
            </Flex>
          )}
        </Flex>
      ) : (
        <FileTable
          bucketName={bucketName}
          folderName={folderName}
          listObjects={listObjects}
          primarySp={primarySp}
          bucketIsDiscontinued={isDiscontinued}
          isLoading={listLoading}
          setListObjects={setListObjects}
          setStatusModalIcon={setStatusModalIcon}
          setStatusModalTitle={setStatusModalTitle}
          setStatusModalErrorText={setStatusModalErrorText}
          setStatusModalDescription={setStatusModalDescription}
          onStatusModalOpen={onStatusModalOpen}
          onStatusModalClose={onStatusModalClose}
          setStatusModalButtonText={setStatusModalButtonText}
        />
      )}
      <FileStatusModal
        isOpen={isStatusModalOpen}
        onClose={onStatusModalClose}
        buttonOnClick={onStatusModalClose}
        title={statusModalTitle}
        description={statusModalDescription}
        buttonText={statusModalButtonText}
        icon={statusModalIcon}
        errorText={statusModalErrorText}
      />
      <FileDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          onDetailModalClose();
          greenfieldRef.current?.terminate();
        }}
        freeze={freeze}
        file={file}
        fileName={fileName}
        folderName={folderName}
        title={detailModalTitle}
        bucketName={bucketName}
        simulateGasFee={gasFee}
        lockFee={lockFee}
        outsideLoading={gasFeeLoading || lockFeeLoading}
        createObjectData={createObjectData}
        setStatusModalIcon={setStatusModalIcon}
        setStatusModalTitle={setStatusModalTitle}
        setStatusModalDescription={setStatusModalDescription}
        onStatusModalOpen={onStatusModalOpen}
        onStatusModalClose={onStatusModalClose}
        setListObjects={setListObjects}
        setStatusModalErrorText={setStatusModalErrorText}
        primarySp={primarySp}
        listObjects={listObjects}
        setStatusModalButtonText={setStatusModalButtonText}
        fetchCreateObjectApproval={fetchCreateObjectApproval}
      />
      <DuplicateNameModal
        isOpen={isDuplicateNameModalOpen}
        onClose={() => {
          onDuplicateNameModalClose();
          greenfieldRef.current?.terminate();
        }}
        description={duplicateNameModalDescription}
        buttonOnClick={async () => {
          if (!file) return;
          const insertedString = `-${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
          // The typical format of a file name. The file name part cannot contain angle brackets, colons, quotes, forward slashes, backslashes, vertical bars, question marks, asterisks, or newline characters. The file name can have an optional extension, which starts with a period and is followed by one or more non-special characters.
          // TODO abstract this regex to one place
          const fileWithExtensionNameRegex = /^[^<>:"/\\|?*\n]+(\.[^<>:"/\\|?*\n]+)*$/;
          const newFilename = fileWithExtensionNameRegex.test(fileName as string)
            ? (fileName as string).replace(/(\.[\w\d]+)$/, insertedString + '$1')
            : fileName + insertedString;
          setFileName(newFilename);
          onDuplicateNameModalClose();
          setLockFee('-1');
          setGasFeeLoading(true);
          setLockFeeLoading(true);
          onDetailModalOpen();
          const currentObjectSignedMessage = await fetchCreateObjectApproval(file, newFilename);
          await getGasFeeAndSet(file, currentObjectSignedMessage);
          await getLockFeeAndSet(file.size);
        }}
      />
      {primarySp.endpoint && (
        <CreateFolderModal
          endpoint={primarySp.endpoint}
          onClose={onCreateFolderModalClose}
          isOpen={isCreateFolderModalOpen}
          bucketName={bucketName}
          folderName={folderName}
          setStatusModalIcon={setStatusModalIcon}
          setStatusModalTitle={setStatusModalTitle}
          setStatusModalDescription={setStatusModalDescription}
          onStatusModalOpen={onStatusModalOpen}
          onStatusModalClose={onStatusModalClose}
          setStatusModalButtonText={setStatusModalButtonText}
          setListObjects={setListObjects}
          listObjects={listObjects}
          setStatusModalErrorText={setStatusModalErrorText}
          fetchCreateObjectApproval={fetchCreateObjectApproval}
          createObjectData={createObjectData}
        />
      )}
    </Flex>
  );
};
