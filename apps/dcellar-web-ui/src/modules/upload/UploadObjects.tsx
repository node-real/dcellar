import React, { useEffect, useMemo, useState } from 'react';
import {
  Text,
  Flex,
  Image,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerFooter,
  QDrawerHeader,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box,
  QListItem,
} from '@totejs/uikit';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  FILE_TITLE_UPLOAD_FAILED,
} from '@/modules/file/constant';
import Fee from './SimulateFee';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { WarningInfo } from '@/components/common/WarningInfo';
import AccessItem from './AccessItem';
import {
  E_FILE_IS_EMPTY,
  E_OBJECT_NAME_CONTAINS_SLASH,
  E_OBJECT_NAME_EMPTY,
  E_OBJECT_NAME_EXISTS,
  E_OBJECT_NAME_NOT_UTF8,
  E_OBJECT_NAME_TOO_LONG,
  E_FILE_TOO_LARGE,
  broadcastFault,
  simulateFault,
  E_UNKNOWN,
  E_ACCOUNT_BALANCE_NOT_ENOUGH,
} from '@/facade/error';
import { isUTF8 } from '../file/utils/file';

import { genCreateObjectTx } from '../file/utils/genCreateObjectTx';
import { signTypedDataCallback } from '@/facade/wallet';
import { useAccount } from 'wagmi';
import { resolve } from '@/facade/common';
import { getDomain } from '@/utils/getDomain';
import { useAppDispatch, useAppSelector } from '@/store';
import { contentIconTypeToExtension, formatBytes } from '../file/utils';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useChecksumApi } from '../checksum';
import { SINGLE_FILE_MAX_SIZE, TFileItem, setEditUpload, setStatusDetail, setUploading } from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { Long, TCreateObject, getUtcZeroTimestamp } from '@bnb-chain/greenfield-chain-sdk';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../object/ObjectError';
import { duplicateName, formatLockFee } from '@/utils/object';
import { reverseVisibilityType } from '@/utils/constant';
import { queryLockFee } from '@/facade/object';

export const UploadObjects = () => {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();
  const {
    editUpload: { isOpen, visibility, fileInfos},
    bucketName,
    primarySp,
    files,
    folders,
    objects,
    path,
  } = useAppSelector((root) => root.object);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { sps: globalSps } = useAppSelector((root) => root.sp);
  const [status, setStatus] = useState<'CHECKING' | 'CHECKED' | null>(null);
  const [lockFee, setLockFee] = useState<string>('');
  const checkSumApi = useChecksumApi();
  const file = files[0];
  const objectList = objects[path].filter((item) => !item.objectName.endsWith('/'));
  const onClose = () => {
    dispatch(setEditUpload({ isOpen: false }));
  };
  const getErrorMsg = (type: string) => {
    return OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];
  };

  const buttonDisabled = useMemo(() => {
    const hasError = fileInfos.some((item) => !!item.errorMsg);
    return status !== 'CHECKED' || hasError;
  }, [fileInfos, status]);
  const fileType = contentIconTypeToExtension(file.name);
  const icon = (
    <Image
      src={`/images/files/icons/${fileType.toLocaleLowerCase()}.svg`}
      alt={fileType}
      width={24}
      height={24}
    />
  );

  const basicValidate = (file: File) => {
    if (!file) {
      return [null, E_FILE_IS_EMPTY];
    }
    if (file.size > SINGLE_FILE_MAX_SIZE) {
      return [null, E_FILE_TOO_LARGE];
    }
    if (file.size <= 0) {
      return [null, E_FILE_IS_EMPTY];
    }
    if (!file.name) {
      return [null, E_OBJECT_NAME_EMPTY];
    }
    if (file.name.length > 1024) {
      return [null, E_OBJECT_NAME_TOO_LONG];
    }
    if (!isUTF8(file.name)) {
      return [null, E_OBJECT_NAME_NOT_UTF8];
    }
    if (file.name.includes('//')) {
      return [null, E_OBJECT_NAME_CONTAINS_SLASH];
    }
    if (duplicateName(file.name, objectList)) {
      return [null, E_OBJECT_NAME_EXISTS];
    }
    return [null, null];
  };

  useEffect(() => {
    const validateFile = async () => {
      setStatus('CHECKING');
      const [basRes, basError] = basicValidate(file);
      if (basError) {
        setStatus('CHECKED');
        return dispatch(
          setEditUpload({
            fileInfos: [{ ...fileInfos[0], errorMsg: getErrorMsg(basError).title }],
          }),
        );
      }
      const hashResult = await checkSumApi?.generateCheckSumV2(file);
      const params = {
        createAt: Long.fromInt(Math.ceil(getUtcZeroTimestamp()/1000)),
        primarySpAddress: primarySp.operatorAddress,
        payloadSize: Long.fromInt(file.size),
      }
      const [data, error] = await queryLockFee(params);
      if (error) {

        return;
      }
      setLockFee(formatLockFee(data?.amount))
      dispatch(
        setEditUpload({
          fileInfos: [{ ...fileInfos[0], errorMsg: '', calHash: hashResult }],
        }),
      );
      setStatus('CHECKED');
    };
    validateFile();

    return () => {
      dispatch(setEditUpload({ isOpen: false, fileInfos: [] }));
    };
  }, [isOpen]);

  const onUploadClick = async () => {
    const domain = getDomain();
    const secondarySpAddresses = globalSps
      .filter((item: any) => item.operator !== primarySp.operatorAddress)
      .map((item: any) => item.operatorAddress);
    const spInfo = {
      endpoint: primarySp.endpoint,
      primarySp: primarySp.operatorAddress,
      sealAddress: primarySp.sealAddress,
      secondarySpAddresses,
    };

    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const finalName = [...folders, file.name].join('/');
    const createObjectPayload: TCreateObject = {
      bucketName,
      objectName: finalName,
      creator: loginAccount,
      visibility: reverseVisibilityType[visibility],
      fileType: file.type || 'application/octet-stream',
      // TODO refactor to use calHash
      contentLength: fileInfos[0]?.calHash?.contentLength,
      expectCheckSums: fileInfos[0]?.calHash?.expectCheckSums,
      spInfo,
      signType: 'offChainAuth',
      domain,
      seedString,
    };
    console.log('createObjectPayload', createObjectPayload);
    const createObjectTx = await genCreateObjectTx(createObjectPayload);
    const [simulateInfo, simulateError] = await createObjectTx
      .simulate({
        denom: 'BNB',
      })
      .then(resolve, simulateFault);
    if (simulateError) {
      if (simulateError?.includes('lack of') || simulateError?.includes('static balance is not enough')) {
        dispatch(setStatusDetail(getErrorMsg(E_ACCOUNT_BALANCE_NOT_ENOUGH)));
      } else if (simulateError?.includes('Object already exists')) {
        dispatch(setStatusDetail(getErrorMsg(E_OBJECT_NAME_EXISTS)));
      } else {
        dispatch(setStatusDetail(getErrorMsg(E_UNKNOWN)));
      }
      return;
    }
    const broadcastPayload = {
      denom: 'BNB',
      gasLimit: Number(simulateInfo?.gasLimit),
      gasPrice: simulateInfo?.gasPrice || '5000000000',
      payer: loginAccount,
      signTypedDataCallback: signTypedDataCallback(connector),
      granter: '',
    };
    const [res, error] = await createObjectTx
      .broadcast(broadcastPayload)
      .then(resolve, broadcastFault);
    if (error || res?.code !== 0) {
      dispatch(
        setStatusDetail({
          title: FILE_TITLE_UPLOAD_FAILED,
          icon: FILE_FAILED_URL,
          description: 'Sorry, there’s something wrong when uploading the file.',
          buttonText: BUTTON_GOT_IT,
          errorText: 'Error message: ' + (error || res?.rawLog) ?? '',
        }),
      );
    }
    dispatch(setEditUpload({ isOpen: false, fileInfos: [] }));
    dispatch(
      setUploading({
        isOpen: true,
        fileInfos: [{ ...fileInfos[0], errorMsg: error || '', txnHash: res?.transactionHash }],
      }),
    );
    console.log('data-------', error, res);
    // 成功之后，则弹出上传任务drawer
    return [res, null];
  };


  return (
    <DCDrawer isOpen={isOpen} onClose={onClose}>
      <QDrawerCloseButton />
      <QDrawerHeader>Upload Objects</QDrawerHeader>
      <QDrawerBody marginTop={'24px'}>
        <Tabs>
          <TabList>
            <Tab h="auto" paddingBottom={'8px'}>
              All Objects
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Flex
                alignItems={'center'}
                justifyContent={'space-between'}
                borderBottom={'1px solid readable.border'}
                marginTop={'20px'}
              >
                <AccessItem freeze={status === 'CHECKING'} />
                <Box>
                  Total Upload: <strong>{formatBytes(file.size)}</strong> / <strong>1 Files</strong>
                </Box>
              </Flex>
            </TabPanel>
          </TabPanels>
        </Tabs>
        <Flex flexDirection={'column'} alignItems={'center'} display={'flex'}>
          {fileInfos &&
            fileInfos.map((item: TFileItem, index: number) => (
              <QListItem
                key={index}
                paddingX={'6px'}
                left={icon}
                // right={<CloseIcon color={'readable.tertiary'} />}
                right={null}
              >
                <Flex marginLeft={'12px'}>
                  <Box fontSize={'12px'}>
                    <Text fontWeight={500}>{item.name}</Text>
                    {item.errorMsg ? (
                      <Box color={'red'}>{item.errorMsg}</Box>
                    ) : (
                      <Box color="readable.tertiary">{formatBytes(item.size)}</Box>
                    )}
                  </Box>
                  <Flex
                    fontSize={'12px'}
                    color="readable.tertiary"
                    justifyContent={'flex-end'}
                    alignItems={'center'}
                    flex={1}
                  >
                    {`${path}/`}
                  </Flex>
                </Flex>
              </QListItem>
            ))}
        </Flex>
      </QDrawerBody>
      <QDrawerFooter flexDirection={'column'} marginTop={'12px'}>
        <Fee lockFee={lockFee} />
        <Flex width={'100%'} flexDirection={'column'}>
          <DCButton
            w="100%"
            variant={'dcPrimary'}
            onClick={() => {
              console.log('upload file');
              onUploadClick();
            }}
            isDisabled={buttonDisabled}
            justifyContent={'center'}
            gaClickName="dc.file.upload_modal.confirm.click"
          >
            {status === 'CHECKING' ? (
              <>
                Loading
                <DotLoading />
              </>
            ) : (
              'Upload'
            )}
          </DCButton>
          <WarningInfo content="Please be aware that data loss might occur during testnet phase." />
        </Flex>
      </QDrawerFooter>
    </DCDrawer>
  );
};
