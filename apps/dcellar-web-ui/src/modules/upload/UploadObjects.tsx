import React, { useState } from 'react';
import {
  Box,
  Flex,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerFooter,
  QDrawerHeader,
  QListItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  toast,
} from '@totejs/uikit';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  FILE_STATUS_UPLOADING,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_UPLOAD_URL,
  OBJECT_TITLE_CREATING,
} from '@/modules/file/constant';
import Fee from './SimulateFee';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { WarningInfo } from '@/components/common/WarningInfo';
import AccessItem from './AccessItem';
import {
  broadcastFault,
  createTxFault,
  E_ACCOUNT_BALANCE_NOT_ENOUGH,
  E_FILE_IS_EMPTY,
  E_FILE_TOO_LARGE,
  E_OBJECT_NAME_CONTAINS_SLASH,
  E_OBJECT_NAME_EMPTY,
  E_OBJECT_NAME_EXISTS,
  E_OBJECT_NAME_NOT_UTF8,
  E_OBJECT_NAME_TOO_LONG,
  E_OFF_CHAIN_AUTH,
  E_UNKNOWN,
  simulateFault,
} from '@/facade/error';
import { isUTF8 } from '../file/utils/file';

import { genCreateObjectTx } from '../file/utils/genCreateObjectTx';
import { signTypedDataCallback } from '@/facade/wallet';
import { useAccount } from 'wagmi';
import { resolve } from '@/facade/common';
import { getDomain } from '@/utils/getDomain';
import { useAppDispatch, useAppSelector } from '@/store';
import { formatBytes } from '../file/utils';
import { DCDrawer } from '@/components/common/DCDrawer';
import { TStatusDetail, setEditUpload, setStatusDetail } from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { TCreateObject } from '@bnb-chain/greenfield-chain-sdk';
import {
  addTaskToUploadQueue,
  selectHashFile,
  setTaskManagement,
  updateHashQueue,
  updateHashStatus,
  updateHashTaskMsg,
} from '@/store/slices/global';
import { useAsyncEffect } from 'ahooks';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { reverseVisibilityType } from '@/utils/constant';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../object/ObjectError';
import { duplicateName } from '@/utils/object';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { EllipsisText } from '@/components/common/EllipsisText';

const MAX_SIZE = 256;

export const UploadObjects = () => {
  const dispatch = useAppDispatch();
  const { setOpenAuthModal } = useOffChainAuth();
  const { editUpload, path, objects } = useAppSelector((root) => root.object);
  const { connector } = useAccount();
  const { bucketName, primarySp, folders } = useAppSelector((root) => root.object);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { sps: globalSps } = useAppSelector((root) => root.sp);
  const selectedFile = useAppSelector(selectHashFile(editUpload));
  const { hashQueue } = useAppSelector((root) => root.global);
  const [visibility, setVisibility] = useState<VisibilityType>(
    VisibilityType.VISIBILITY_TYPE_PRIVATE,
  );
  const objectList = objects[path]?.filter((item) => !item.objectName.endsWith('/'));
  const [creating, setCreating] = useState(false);

  const onClose = () => {
    dispatch(setEditUpload(0));
  };
  const getErrorMsg = (type: string) => {
    return OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];
  };

  const basicValidate = (file: File) => {
    if (!file) {
      return E_FILE_IS_EMPTY;
    }
    if (file.size > MAX_SIZE * 1024 * 1024) {
      return E_FILE_TOO_LARGE;
    }
    if (file.size <= 0) {
      return E_FILE_IS_EMPTY;
    }
    if (!file.name) {
      return E_OBJECT_NAME_EMPTY;
    }
    if (file.name.length > 1024) {
      return E_OBJECT_NAME_TOO_LONG;
    }
    if (!isUTF8(file.name)) {
      return E_OBJECT_NAME_NOT_UTF8;
    }
    if (file.name.includes('//')) {
      return E_OBJECT_NAME_CONTAINS_SLASH;
    }
    if (duplicateName(file.name, objectList)) {
      return E_OBJECT_NAME_EXISTS;
    }
    return '';
  };

  const errorHandler = (error: string) => {
    setCreating(false);
    if (error === E_OFF_CHAIN_AUTH) {
      setOpenAuthModal();
      return;
    }
    dispatch(
      setStatusDetail({
        title: FILE_TITLE_UPLOAD_FAILED,
        icon: FILE_FAILED_URL,
        desc: 'Sorry, there’s something wrong when uploading the file.',
        buttonText: BUTTON_GOT_IT,
        buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
        errorText: 'Error message: ' + error,
      }),
    );
  };

  const onUploadClick = async () => {
    if (!selectedFile) return;
    setCreating(true);
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
    const finalName = [...folders, selectedFile.name].join('/');
    const createObjectPayload: TCreateObject = {
      bucketName,
      objectName: finalName,
      creator: loginAccount,
      visibility: reverseVisibilityType[visibility],
      fileType: selectedFile.type || 'application/octet-stream',
      contentLength: selectedFile.size,
      expectCheckSums: selectedFile.checksum,
      spInfo,
      signType: 'offChainAuth',
      domain,
      seedString,
    };
    const [createObjectTx, _createError] = await genCreateObjectTx(createObjectPayload).then(
      resolve,
      createTxFault,
    );

    if (_createError) {
      return errorHandler(_createError);
    }

    dispatch(
      setStatusDetail({
        icon: FILE_UPLOAD_URL,
        title: OBJECT_TITLE_CREATING,
        desc: FILE_STATUS_UPLOADING,
      }),
    );

    const [simulateInfo, simulateError] = await createObjectTx!
      .simulate({
        denom: 'BNB',
      })
      .then(resolve, simulateFault);

    if (simulateError) {
      if (
        simulateError?.includes('lack of') ||
        simulateError?.includes('static balance is not enough')
      ) {
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
      signTypedDataCallback: signTypedDataCallback(connector!),
      granter: '',
    };
    const [res, error] = await createObjectTx!
      .broadcast(broadcastPayload)
      .then(resolve, broadcastFault);

    const _ = res?.rawLog;
    if (error) {
      return errorHandler(error || _!);
    }
    toast.success({ description: 'Object created successfully!' });
    dispatch(
      addTaskToUploadQueue(selectedFile.id, res!.transactionHash, primarySp.operatorAddress),
    );
    dispatch(setEditUpload(0));
    dispatch(setStatusDetail({} as TStatusDetail));
    dispatch(setTaskManagement(true));
    setCreating(false);
  };

  useAsyncEffect(async () => {
    if (!editUpload) {
      setCreating(false);
      dispatch(updateHashQueue());
      return;
    }
    if (!selectedFile) return;
    const { file, id } = selectedFile;
    const error = basicValidate(file);
    if (!error) {
      dispatch(updateHashStatus({ id, status: 'WAIT' }));
      return;
    }
    dispatch(updateHashTaskMsg({ id, msg: getErrorMsg(error).title }));
  }, [editUpload]);

  const loading = selectedFile?.status !== 'READY';
  const hasError = hashQueue.some((item) => item.msg !== '');

  return (
    <DCDrawer isOpen={!!editUpload} onClose={onClose}>
      <QDrawerCloseButton />
      <QDrawerHeader>Upload Objects</QDrawerHeader>
      {!!selectedFile && (
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
                  marginBottom={'8px'}
                >
                  <AccessItem freeze={loading} value={visibility} onChange={setVisibility} />
                  <Box>
                    Total Upload: <strong>{formatBytes(selectedFile.size)}</strong> /{' '}
                    <strong>1 Files</strong>
                  </Box>
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Flex mt="32px" flexDirection={'column'} alignItems={'center'} display={'flex'}>
            <QListItem cursor={'default'} _hover={{}} maxW={'520px'} paddingX={'6px'} right={null}>
              <Flex fontSize={'12px'} alignItems={'center'} justifyContent={'space-between'}>
                <Box maxW={'300px'}>
                  <EllipsisText marginRight={'12px'}>{selectedFile.name}</EllipsisText>
                  {selectedFile.msg ? (
                    <EllipsisText color={'red'}>{selectedFile.msg}</EllipsisText>
                  ) : (
                    <EllipsisText>{formatBytes(selectedFile.size)}</EllipsisText>
                  )}
                </Box>
                <EllipsisText maxW="200px" textAlign={'right'} flex={1}>{`${path}/`}</EllipsisText>
              </Flex>
            </QListItem>
          </Flex>
        </QDrawerBody>
      )}
      <QDrawerFooter flexDirection={'column'} marginTop={'12px'}>
        <Fee lockFee={selectedFile?.lockFee || ''} />
        <Flex width={'100%'} flexDirection={'column'}>
          <DCButton
            w="100%"
            variant={'dcPrimary'}
            onClick={onUploadClick}
            isDisabled={loading || creating}
            justifyContent={'center'}
            gaClickName="dc.file.upload_modal.confirm.click"
          >
            {(loading || creating) && !hasError ? (
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
