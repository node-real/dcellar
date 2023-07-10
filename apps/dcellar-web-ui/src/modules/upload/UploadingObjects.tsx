import React from 'react';
import {
  Box,
  Flex,
  Image,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerHeader,
  Text,
} from '@totejs/uikit';
import { FILE_UPLOAD_URL } from '@/modules/file/constant';
import { useAppSelector } from '@/store';
import { formatBytes } from '../file/utils';
import { sortBy } from 'lodash-es';

export const UploadingObjects = () => {
  const { objectsInfo } = useAppSelector((root) => root.object);
  const { uploadQueue } = useAppSelector((root) => root.global);
  const { loginAccount } = useAppSelector((root) => root.persist);

  const queue = sortBy(uploadQueue[loginAccount] || [], [
    (o) => {
      switch (o.status) {
        case 'SEAL':
          return 0;
        case 'UPLOAD':
          return 1;
        case 'WAIT':
          return 2;
        case 'FINISH':
          return 3;
      }
    },
  ]);

  if (!queue.length) {
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
        <Box fontWeight={'600'} fontSize={'18px'} borderBottom={'1px solid readable.border'}>
          Current Upload
        </Box>
        {queue.map((task) => (
          <Flex mb={30} key={task.id}>
            <Box>
              <Box>{task.file.name}</Box>
              {task.msg ? (
                <Box color={'red'}>{task.msg}</Box>
              ) : (
                <Box>{formatBytes(task.file.size)}</Box>
              )}
              <Box>create hash: {task.createHash}</Box>
              <Box>
                seal hash:{' '}
                {
                  objectsInfo[[task.bucketName, ...task.folders, task.file.name].join('/')]
                    ?.seal_tx_hash
                }
              </Box>
              <Box>progress: {task.progress}%</Box>
            </Box>
          </Flex>
        ))}
      </QDrawerBody>
    </>
  );
};
