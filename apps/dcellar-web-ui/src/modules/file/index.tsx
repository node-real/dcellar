import { Flex, Text, Image, useDisclosure, toast, Link } from '@totejs/uikit';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  decodeObjectFromHexString,
  getCreateObjectApproval,
  listObjectsByBucketName,
  validateObjectName,
  VisibilityType,
} from '@bnb-chain/greenfield-storage-js-sdk';
import { CreateObjectTx, getAccount, ZERO_PUBKEY } from '@bnb-chain/gnfd-js-sdk';
import { useNetwork } from 'wagmi';
import moment from 'moment';
import * as Comlink from 'comlink';

import { makeCosmsPubKey } from '@/modules/wallet/utils/pk/makeCosmsPk';
import { FileStatusModal } from '@/modules/file/components/FileStatusModal';
import { FileDetailModal } from '@/modules/file/components/FileDetailModal';
import { useLogin } from '@/hooks/useLogin';
import { getGasFeeBySimulate } from '@/modules/wallet/utils/simulate';
import { GRPC_URL } from '@/base/env';
import FileEmptyIcon from '@/public/images/files/file_empty.svg';
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
import { getBucketInfo, getSpInfo, getStorageProviders } from '@/utils/sp';
import { DuplicateNameModal } from '@/modules/file/components/DuplicateNameModal';
import { getLockFee } from '@/utils/wallet';
import { FileTable } from '@/modules/file/components/FileTable';
import { WorkerApi } from '../checksum/checksumWorkerV2';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { useRouter } from 'next/router';

interface pageProps {
  bucketName: string;
}

const FILE_NAME_REGEX = /^[\s\S0-9\s!@$^&*()_+\-={}[\]|\\<\>\/;:'",./`~()]+(\.[a-zA-Z]+)?$/;
const FILE_NAME_RULES_DOC = `https://docs.nodereal.io/docs/faq-1#question-what-is-the-naming-rules-for-files`;

// max file upload size is 256MB, which is 1024*1024*256=MAX_SIZE byte
const MAX_SIZE = 268435456;
const renderUploadButton = (isCurrentUser: boolean, gaClickName?: string) => {
  if (!isCurrentUser) return <></>;
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

export const File = (props: pageProps) => {
  const { bucketName } = props;
  const [file, setFile] = useState<File>();
  const [fileName, setFileName] = useState<string>();
  const loginData = useLogin();
  const { chain } = useNetwork();
  const createObjectTx = new CreateObjectTx(GRPC_URL!, String(chain?.id)!);
  const { loginState } = loginData;
  const { address } = loginState;
  const [gasFeeLoading, setGasFeeLoading] = useState(true);
  const [lockFeeLoading, setLockFeeLoading] = useState(true);
  const [gasFee, setGasFee] = useState('-1');
  const [lockFee, setLockFee] = useState('-1');
  const [gasLimit, setGasLimit] = useState(0);
  const [gasPrice, setGasPrice] = useState('0');
  const [statusModalButtonText, setStatusModalButtonText] = useState(BUTTON_GOT_IT);
  const [objectSignedMsg, setObjectSignedMsg] = useState<any>();
  const [listObjects, setListObjects] = useState<Array<any>>([]);
  const [primarySpAddress, setPrimarySpAddress] = useState<string>('');
  const [primarySpSealAddress, setPrimarySpSealAddress] = useState<string>('');
  const [secondarySpAddresses, setSecondarySpAddresses] = useState<Array<string>>();
  const [endpoint, setEndpoint] = useState('');
  const [isEmptyData, setIsEmptyData] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [isInitReady, setIsInitReady] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const greenfieldRef = useRef<Worker>();
  const comlinkWorkerRef = useRef<Worker>();
  const comlinkWorkerApiRef = useRef<Comlink.Remote<WorkerApi>>();
  const router = useRouter();
  const getObjectList = async (currentEndpoint: string) => {
    try {
      const listResult = await listObjectsByBucketName({
        bucketName,
        endpoint: currentEndpoint,
      });
      if (listResult) {
        const tempListObjects = listResult.body ?? [];
        setListObjects(listResult.body ?? []);
        const realListObjects = tempListObjects
          .filter((v: any) => !v.removed)
          .map((v: any) => v.object_info);
        if (realListObjects.length === 0) {
          setIsEmptyData(true);
        } else {
          setIsEmptyData(false);
        }
      } else {
        setIsEmptyData(true);
      }
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
      setIsInitReady(false);
      const bucketInfo = await getBucketInfo(bucketName);
      const { sps } = await getStorageProviders();
      setIsCurrentUser(bucketInfo?.owner === address);

      const currentPrimarySpAddress = bucketInfo?.primarySpAddress;
      if (!currentPrimarySpAddress) {
        toast.error({
          description: `Current bucket is lacking of sp address, please check.`,
        });
        return;
      }
      setPrimarySpAddress(currentPrimarySpAddress);
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
      setEndpoint(currentEndpoint);
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
    if (bucketName) {
      getGatewayParams();
    }
  }, []);
  useEffect(() => {
    if (!isInitReady) return;
    const realListObjects = listObjects
      .filter((v: any) => !v.removed)
      .map((v: any) => v.object_info);
    if (realListObjects.length === 0) {
      setIsEmptyData(true);
    } else {
      setIsEmptyData(false);
    }
  }, [listObjects.length]);

  useEffect(() => {
    // Comlink worker
    comlinkWorkerRef.current = new Worker(
      new URL('../checksum/checksumWorkerV2.ts', import.meta.url),
      { type: 'module' },
    );
    comlinkWorkerApiRef.current = Comlink.wrap<WorkerApi>(comlinkWorkerRef.current);

    return () => {
      comlinkWorkerRef.current?.terminate();
    };
  }, []);
  // monitor route change to get new list info
  useEffect(() => {
    function handleRouteChange() {
      router.events.on('routeChangeComplete', () => {
        if (bucketName) {
          getGatewayParams();
        }
      });
    }
    handleRouteChange();
    return () => {
      router.events.off('routeChangeComplete', () => {});
    };
  }, [router.events]);

  const generateWorker = () => {
    greenfieldRef.current = new Worker(new URL('./greenfield.ts', import.meta.url));
  };

  const runCalcHashTask = (bytes: Uint8Array) => {
    return new Promise((resolve, reject) => {
      greenfieldRef.current?.terminate();
      generateWorker();
      setTimeout(() => {
        greenfieldRef.current?.postMessage(bytes);
      }, 100);
      // @ts-ignore
      greenfieldRef.current.onmessage = (event) => {
        if (event.data) {
          resolve(event.data);
          greenfieldRef.current?.terminate();
        }
      };
      // @ts-ignore
      greenfieldRef.current.onerror = (error) => {
        reject(error);
        greenfieldRef.current?.terminate();
      };
    });
  };

  const fetchCreateObjectApproval = async (
    uploadFile: File,
    newFileName?: string,
    visibility = VisibilityType.VISIBILITY_TYPE_PRIVATE,
  ) => {
    const objectName = newFileName ? newFileName : uploadFile.name;
    const hashResult = await comlinkWorkerApiRef.current?.generateCheckSumV2(uploadFile);

    try {
      const result = await getCreateObjectApproval({
        bucketName,
        objectName,
        creator: address,
        file: uploadFile,
        endpoint,
        expectSecondarySpAddresses: secondarySpAddresses,
        hashResult,
        visibility,
      });
      if (result.statusCode !== 200) {
        throw new Error(`Error code: ${result.statusCode}, message: ${result.message}`);
      }
      let currentObjectSignedMessage = decodeObjectFromHexString(result.body);
      setObjectSignedMsg(currentObjectSignedMessage);
      return currentObjectSignedMessage;
    } catch (error: any) {
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

  const getGasFeeAndSet = async (uploadFile: File, currentObjectSignedMessage: any) => {
    try {
      setGasFeeLoading(true);
      const { sequence } = await getAccount(GRPC_URL!, address!);
      const simulateBytes = createObjectTx.getSimulateBytes({
        objectName: currentObjectSignedMessage.object_name,
        contentType: currentObjectSignedMessage.content_type,
        from: currentObjectSignedMessage.creator,
        bucketName: currentObjectSignedMessage.bucket_name,
        expiredHeight: currentObjectSignedMessage.primary_sp_approval.expired_height,
        sig: currentObjectSignedMessage.primary_sp_approval.sig,
        visibility: currentObjectSignedMessage.visibility,
        payloadSize: currentObjectSignedMessage.payload_size,
        expectChecksums: currentObjectSignedMessage.expect_checksums,
        redundancyType: currentObjectSignedMessage.redundancy_type,
        expectSecondarySpAddresses: currentObjectSignedMessage.expect_secondary_sp_addresses,
      });
      const authInfoBytes = createObjectTx.getAuthInfoBytes({
        sequence: sequence.toString(),
        denom: 'BNB',
        gasLimit: 0,
        gasPrice: '0',
        pubKey: makeCosmsPubKey(ZERO_PUBKEY),
      });
      const simulateGas = await createObjectTx.simulateTx(simulateBytes, authInfoBytes);
      setGasFee(getGasFeeBySimulate(simulateGas));
      setGasLimit(simulateGas.gasInfo?.gasUsed.toNumber() || 0);
      setGasPrice(simulateGas.gasInfo?.minGasPrice.replaceAll('BNB', '') || '0');
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
      setFileName(uploadFile.name);
      setLockFee('-1');
      setGasFeeLoading(true);
      setLockFeeLoading(true);

      if (!uploadFile) {
        // eslint-disable-next-line no-console
        console.error('Must select file first.');
        return;
      }
      onDetailModalOpen();
      const currentObjectSignedMessage = await fetchCreateObjectApproval(uploadFile);
      await getGasFeeAndSet(uploadFile, currentObjectSignedMessage);
      await getLockFeeAndSet(uploadFile.size);
    }
  };
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
  if (!bucketName) return <></>;

  return (
    <Flex p={'24px'} flexDirection="column" flex="1" height={'100%'}>
      <Flex alignItems="center" w="100%" justifyContent="space-between" mb={'12px'}>
        <Text
          as={'h1'}
          fontWeight="700"
          fontSize={'24px'}
          lineHeight="36px"
          maxWidth="400px"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {bucketName}
        </Text>
        {renderUploadButton(isCurrentUser, 'dc.file.list.upload.click')}
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
      {isEmptyData && isCurrentUser ? (
        <Flex
          flex={1}
          alignItems="center"
          flexDirection={'column'}
          justifyContent={'center'}
          marginBottom={'104px'}
        >
          <FileEmptyIcon w="120px" h="120px" />
          <Text
            fontSize="18px"
            lineHeight="22px"
            fontWeight={500}
            mt={'16px'}
            color={'readable.secondary'}
          >
            Upload your files to this bucket right now!👏
          </Text>
          <Text
            fontSize="12px"
            lineHeight="16px"
            fontWeight={400}
            mt={'4px'}
            mb={'24px'}
            color={'readable.tertiary'}
            textAlign={'center'}
          >
            (Please make sure your file is smaller than 256MB during testnet phase. <br />
            Please be aware that data loss might occur during testnet phase.)
          </Text>
          <GAShow name="dc.file.empty.upload.show" />
          {renderUploadButton(isCurrentUser, 'dc.file.empty.upload.click')}
        </Flex>
      ) : (
        <FileTable
          bucketName={bucketName}
          listObjects={listObjects}
          endpoint={endpoint}
          spAddress={primarySpAddress}
          primarySpSealAddress={primarySpSealAddress}
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
        file={file}
        fileName={fileName}
        title={detailModalTitle}
        bucketName={bucketName}
        simulateGasFee={gasFee}
        lockFee={lockFee}
        outsideLoading={gasFeeLoading || lockFeeLoading}
        objectSignedMsg={objectSignedMsg}
        gasLimit={gasLimit}
        gasPrice={gasPrice}
        setStatusModalIcon={setStatusModalIcon}
        setStatusModalTitle={setStatusModalTitle}
        setStatusModalDescription={setStatusModalDescription}
        onStatusModalOpen={onStatusModalOpen}
        onStatusModalClose={onStatusModalClose}
        setListObjects={setListObjects}
        setStatusModalErrorText={setStatusModalErrorText}
        endpoint={endpoint}
        listObjects={listObjects}
        setStatusModalButtonText={setStatusModalButtonText}
        fetchCreateObjectApproval={fetchCreateObjectApproval}
        getGasFeeAndSet={getGasFeeAndSet}
        getLockFeeAndSet={getLockFeeAndSet}
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
          const insertedString = `-${moment().format('YYYY-MM-DD HH:mm:ss')}`;
          const fileWithExtensionNameRegex = /^[^.\n]+\.[a-zA-Z]+$/;
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
    </Flex>
  );
};
