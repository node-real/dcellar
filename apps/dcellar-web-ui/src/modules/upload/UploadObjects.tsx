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
import { BUTTON_GOT_IT, FILE_FAILED_URL, FILE_TITLE_UPLOAD_FAILED } from '@/modules/file/constant';
import Fee from './SimulateFee';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { WarningInfo } from '@/components/common/WarningInfo';
import AccessItem from './AccessItem';
import {
  broadcastFault,
  E_FILE_IS_EMPTY,
  E_FILE_TOO_LARGE,
  E_OBJECT_NAME_CONTAINS_SLASH,
  E_OBJECT_NAME_EMPTY,
  E_OBJECT_NAME_NOT_UTF8,
  E_OBJECT_NAME_TOO_LONG,
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
import { setEditUpload, setStatusDetail } from '@/store/slices/object';
import { CloseIcon, SkeletonIcon } from '@totejs/icons';
import { getSpOffChainData } from '@/store/slices/persist';
import { TCreateObject } from '@bnb-chain/greenfield-chain-sdk';
import {
  addTaskToUploadQueue,
  selectHashFile,
  updateHashQueue,
  updateHashStatus,
  updateHashTaskMsg,
} from '@/store/slices/global';
import { useAsyncEffect } from 'ahooks';

const MAX_SIZE = 256;

// TODO 增加重名检测
export const UploadObjects = () => {
  const dispatch = useAppDispatch();
  const { editUpload } = useAppSelector((root) => root.object);
  const { connector } = useAccount();
  const { bucketName, primarySp, folders } = useAppSelector((root) => root.object);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { sps: globalSps } = useAppSelector((root) => root.sp);
  const selectedFile = useAppSelector(selectHashFile(editUpload));
  const [visibility, setVisibility] = useState<any>('');
  const [creating, setCreating] = useState(false);

  const onClose = () => {
    dispatch(setEditUpload(0));
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
    return '';
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
      visibility,
      fileType: selectedFile.type || 'application/octet-stream',
      contentLength: selectedFile.size,
      expectCheckSums: selectedFile.checksum,
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
      // TODO 处理重名的问题
      alert(simulateError);
      setCreating(false);
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
    const [res, error] = await createObjectTx
      .broadcast(broadcastPayload)
      .then(resolve, broadcastFault);

    if (error || res?.code !== 0) {
      setCreating(false);
      dispatch(
        setStatusDetail({
          title: FILE_TITLE_UPLOAD_FAILED,
          icon: FILE_FAILED_URL,
          description: 'Sorry, there’s something wrong when uploading the file.',
          buttonText: BUTTON_GOT_IT,
          errorText: 'Error message: ' + (error || res?.rawLog) ?? '',
        }),
      );
      return;
    }
    toast.success({ description: 'object created!' });
    dispatch(addTaskToUploadQueue(selectedFile.id, res.transactionHash, primarySp.operatorAddress));
    dispatch(setEditUpload(0));
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
    dispatch(updateHashTaskMsg({ id, msg: error }));
  }, [editUpload]);

  const loading = selectedFile?.status !== 'READY';

  return (
    <DCDrawer isOpen={!!editUpload} onClose={onClose}>
      <QDrawerCloseButton />
      <QDrawerHeader>Upload Objects</QDrawerHeader>
      {!!selectedFile && (
        <QDrawerBody>
          <Tabs>
            <TabList>
              <Tab>All Objects</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Flex
                  alignItems={'center'}
                  justifyContent={'space-between'}
                  borderBottom={'1px solid readable.border'}
                >
                  <AccessItem value={visibility} onChange={setVisibility} />
                  <Box>
                    Total Upload: <strong>{formatBytes(selectedFile.size)}</strong> /{' '}
                    <strong>1 Files</strong>
                  </Box>
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Flex mt="32px" flexDirection={'column'} alignItems={'center'} display={'flex'}>
            <QListItem paddingX={'6px'} left={<SkeletonIcon />} right={<CloseIcon />}>
              <Flex marginLeft={'12px'}>
                <Box>
                  <Box>{selectedFile.name}</Box>
                  {selectedFile.msg ? (
                    <Box color={'red'}>{selectedFile.msg}</Box>
                  ) : (
                    <Box>{formatBytes(selectedFile.size)}</Box>
                  )}
                </Box>
              </Flex>
            </QListItem>
          </Flex>
        </QDrawerBody>
      )}
      <QDrawerFooter flexDirection={'column'}>
        <Fee />
        <Flex width={'100%'} flexDirection={'column'}>
          <DCButton
            w="100%"
            variant={'dcPrimary'}
            onClick={onUploadClick}
            isDisabled={loading || creating}
            justifyContent={'center'}
            gaClickName="dc.file.upload_modal.confirm.click"
          >
            {loading || creating ? (
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
