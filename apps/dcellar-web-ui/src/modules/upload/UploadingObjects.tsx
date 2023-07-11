import React from 'react';
import {
  Box,
  Flex,
  Image,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerHeader,
  QListItem,
  Text,
} from '@totejs/uikit';
import { FILE_UPLOAD_STATIC_URL } from '@/modules/file/constant';
import { useAppSelector } from '@/store';
import { formatBytes } from '../file/utils';
import { sortBy } from 'lodash-es';
import CircleProgress from '../file/components/CircleProgress';
import { ColoredSuccessIcon } from '@totejs/icons';
import { Loading } from '@/components/common/Loading';
import { UploadFile } from '@/store/slices/global';
import { EllipsisText } from '@/components/common/EllipsisText';

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
            <Image alt="upload" src={FILE_UPLOAD_STATIC_URL} width={'120px'} />
            <Text marginTop={'12px'}>You don't have upload tasks.</Text>
          </Flex>
        </QDrawerBody>
      </>
    );
  }
  const FileStatus = ({ task }: { task: UploadFile }) => {
    switch (task.status) {
      case 'WAIT':
        return (
          <>
            waiting
          </>
        );
      case 'UPLOAD':
        return (
          <CircleProgress
            progress={task.progress}
            size={18}
            strokeWidth={2}
            circleOneStroke="rgba(0,186,52,0.1)"
            circleTwoStroke="#00BA34"
            />
        );
      case 'SEAL':
        return (
          <>
            <Loading />
            sealing
          </>
        );
      case 'FINISH':
        return <ColoredSuccessIcon />;
      default:
        return null;
    }
  };

  return (
    <>
      <QDrawerCloseButton />
      <QDrawerHeader>Upload Object</QDrawerHeader>
      <QDrawerBody>
        <Box fontWeight={'600'} fontSize={'18px'} borderBottom={'1px solid readable.border'}>
          Current Upload
        </Box>
        {queue.map((task) => (
          <QListItem cursor={'default'} _hover={{}} maxW={'520px'} key={task.id} paddingX={'6px'} right={null}>
            <Flex marginLeft={'12px'} fontSize={'12px'} alignItems={'center'}>
              <Box maxW='200px'>
                <EllipsisText marginRight={'12px'}>{task.file.name}</EllipsisText>
                {task.msg ? (
                  <EllipsisText color={'red'}>{task.msg}</EllipsisText>
                ) : (
                  <EllipsisText>{formatBytes(task.file.size)}</EllipsisText>
                )}
              </Box>
              <EllipsisText
                maxW='200px'
                textAlign={'center'}
                marginRight={'12px'}
              >
                {`${[task.bucketName, ...task.folders].join('/')}/`}
              </EllipsisText>
              {/* <Box>create hash: {task.createHash}</Box>
              <Box>
                seal hash:{' '}
                {
                  objectsInfo[[task.bucketName, ...task.folders, task.file.name].join('/')]
                    ?.seal_tx_hash
                }
              </Box> */}
              <Flex flex={1} justifyContent={'flex-end'} alignItems={'center'}>
                <FileStatus task={task} />
              </Flex>
            </Flex>
          </QListItem>
        ))}
      </QDrawerBody>
    </>
  );
};
