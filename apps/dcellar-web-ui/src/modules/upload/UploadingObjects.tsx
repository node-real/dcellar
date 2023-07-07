import React, { useRef, useState } from 'react';
import {
  Text,
  Flex,
  Image,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerHeader,
  Box,
  QListItem,
} from '@totejs/uikit';
import { FILE_UPLOAD_URL } from '@/modules/file/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { TFileItem, setUploading } from '@/store/slices/object';
import { CloseIcon, SkeletonIcon } from '@totejs/icons';
import { formatBytes } from '../file/utils';
import { useAsyncEffect } from 'ahooks';
import { generatePutObjectOptions } from '../file/utils/generatePubObjectOptions';
import { getDomain } from '@/utils/getDomain';
import { getSpOffChainData } from '@/store/slices/persist';
import axios from 'axios';

export const UploadingObjects = () => {
  const dispatch = useAppDispatch();
  const { files, uploading: { fileInfos }, bucketName, primarySp, folders } = useAppSelector((root) => root.object);
  const {loginAccount} = useAppSelector((root) => root.persist);
  const objectName = `${fileInfos[0]?.name}`;
  const file = files[0];
  const [progress, setProgress] = useState(0);

  useAsyncEffect(async () => {
    // TODO 上传服务抽离到全局，本页面只做展示
    console.log('invoke uploading Objects');
    if (!fileInfos || fileInfos.length === 0) {
      return;
    }
    const domain = getDomain();
    dispatch(setUploading({isLoading: true}));
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, primarySp.operatorAddress));
    const finalName = [...folders, objectName].join('/');
    const { url, headers } = await generatePutObjectOptions({
      bucketName,
      objectName: finalName,
      body: file,
      endpoint: primarySp.endpoint,
      txnHash: fileInfos[0]?.txnHash,
      userAddress: loginAccount,
      domain,
      seedString,
    });

    await axios.put(url, file, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded / (progressEvent.total as number)) * 100,
        );
        // TODO 页面展示文件上传进度
        console.log('progress', progress);
      },
      headers: {
        Authorization: headers.get('Authorization'),
        'X-Gnfd-Txn-hash': headers.get('X-Gnfd-Txn-hash'),
        'X-Gnfd-User-Address': headers.get('X-Gnfd-User-Address'),
        'X-Gnfd-App-Domain': headers.get('X-Gnfd-App-Domain'),
      },
    });
    dispatch(setUploading({isLoading: false}));
    // TODO add get seal tx hash
    // startPolling(() => {
    //   const sealTxHash = await getObjectIsSealed({
    //     bucketName,
    //     objectName: finalName,
    //     primarySp: primarySp,
    //     address: loginState.address,
    //     folderName,
    //   });
    // });

  }, []);

  if (files.length === 0) {
    return (
      <>
        <QDrawerCloseButton />
        <QDrawerHeader>Task Management</QDrawerHeader>
        <QDrawerBody>
          <Flex
            flexDirection={'column'}
            width={'100%'}
            height={'100%'}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <Image alt="upload" src={FILE_UPLOAD_URL} width={'120px'} />
            <Text marginTop={'12px'}>You don't have upload tasks.</Text>
          </Flex>
        </QDrawerBody>
      </>
    );
  }

  return (
    <>
      <QDrawerCloseButton />
      <QDrawerHeader>Upload Object</QDrawerHeader>
      <QDrawerBody>
        <Box fontWeight={'600'} fontSize={'18px'} borderBottom={'1px solid readable.border'}>Current Upload</Box>
        <Flex flexDirection={'column'} alignItems={'center'} display={'flex'}>
          {/* TODO UI展示更多信息 */}
          {fileInfos &&
            fileInfos.map((item: TFileItem, index: number) => (
              <QListItem key={index} paddingX={'6px'} left={<SkeletonIcon />} right={<CloseIcon />} marginTop={0}>
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
    </>
  );
};
