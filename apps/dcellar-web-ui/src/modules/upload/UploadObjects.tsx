import React, { forwardRef, useCallback, useContext, useEffect, useState } from 'react';
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
  FILE_INFO_IMAGE_URL,
  FILE_TITLE_FILE_TOO_LARGE,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_TOO_LARGE_URL,
} from '@/modules/file/constant';
import Fee from './SimulateFee';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { WarningInfo } from '@/components/common/WarningInfo';
import AccessItem from './AccessItem';
import {
  E_CAL_OBJECT_HASH,
  E_FILE_IS_EMPTY,
  E_OBJECT_NAME_CONTAINS_SLASH,
  E_OBJECT_NAME_EMPTY,
  E_OBJECT_NAME_EXISTS,
  E_OBJECT_NAME_NOT_UTF8,
  E_OBJECT_NAME_TOO_LONG,
  E_FILE_TOO_LARGE,
  E_OFF_CHAIN_AUTH,
  broadcastFault,
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
import { useChecksumApi } from '../checksum';
import { TFileItem, setEditUpload, setStatusDetail, setUploading } from '@/store/slices/object';
import { CloseIcon, SkeletonIcon } from '@totejs/icons';
import { getSpOffChainData } from '@/store/slices/persist';
import { TCreateObject } from '@bnb-chain/greenfield-chain-sdk';

const MAX_SIZE = 256;

// TODO 增加重名检测
export const UploadObjects = () => {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();
  const {
    editUpload: { isOpen, visibility, fileInfos },
    bucketName,
    primarySp,
    files,
    folders,
  } = useAppSelector((root) => root.object);
  // TODO 增加错误原因展示
  const [errors, setErrors] = useState<{ name: string; errorMsg: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { sps: globalSps } = useAppSelector((root) => root.sp);
  const checkSumApi = useChecksumApi();
  const file = files[0];
  const onClose = () => {
    dispatch(setEditUpload({ isOpen: false }));
  };

  const basicValidate = (file: File) => {
    if (!file) {
      return [null, E_FILE_IS_EMPTY];
    }
    if (file.size > MAX_SIZE * 1024 * 1024) {
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
    return [null, null];
  };

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
      visibility,
      fileType: file.type || 'application/octet-stream',
      contentLength: fileInfos[0]?.calHash.contentLength,
      expectCheckSums: fileInfos[0]?.calHash.expectCheckSums,
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
      return;
    };
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
    dispatch(
      setEditUpload({ isOpen: false, fileInfos: [] }),
    );
    dispatch(
      setUploading({
        isOpen: true,
        fileInfos: [{ ...fileInfos[0], errorMsg: error || '' , txnHash: res?.transactionHash}]
      })
    )
    console.log('data-------', error, res);
    // 成功之后，则弹出上传任务drawer
    return [res, null];
  };

  useEffect(() => {
    const validateFile = async () => {
      setLoading(true);
      const [basRes, basError] = basicValidate(file);
      const hashResult = await checkSumApi?.generateCheckSumV2(file);
      console.log(hashResult);
      dispatch(
        setEditUpload({
          fileInfos: [{ ...fileInfos[0], errorMsg: basError || '', calHash: hashResult }],
        }),
      );
      setLoading(false);
    };
    validateFile();

    return () => {
      dispatch(setEditUpload({ isOpen: false, fileInfos: [] }));
    };
  }, [isOpen]);

  return (
    <DCDrawer isOpen={isOpen} onClose={onClose}>
      <QDrawerCloseButton />
      <QDrawerHeader>Upload Objects</QDrawerHeader>
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
                <AccessItem />
                <Box>
                  Total Upload: <strong>{formatBytes(file.size)}</strong> / <strong>1 Files</strong>
                </Box>
              </Flex>
            </TabPanel>
          </TabPanels>
        </Tabs>
        <Flex mt="32px" flexDirection={'column'} alignItems={'center'} display={'flex'}>
          {fileInfos &&
            fileInfos.map((item: TFileItem, index: number) => (
              <QListItem key={index} paddingX={'6px'} left={<SkeletonIcon />} right={<CloseIcon />}>
                <Flex marginLeft={'12px'}>
                  <Box>
                    <Box>{item.name}</Box>
                    {item.errorMsg ? (
                      <Box color={'red'}>{item.errorMsg}</Box>
                    ) : (
                      <Box>{formatBytes(item.size)}</Box>
                    )}
                  </Box>
                </Flex>
              </QListItem>
            ))}
        </Flex>
      </QDrawerBody>
      <QDrawerFooter flexDirection={'column'}>
        <Fee />
        <Flex width={'100%'} flexDirection={'column'}>
          <DCButton
            w="100%"
            variant={'dcPrimary'}
            onClick={() => {
              console.log('upload file');
              onUploadClick();
            }}
            isDisabled={loading}
            justifyContent={'center'}
            gaClickName="dc.file.upload_modal.confirm.click"
          >
            {loading ? (
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
