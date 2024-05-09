import { Box, Flex, Text } from '@node-real/uikit';
import { useRouter } from 'next/router';

import { EllipsisText } from '@/components/common/EllipsisText';
import { IconFont } from '@/components/IconFont';
import { contentIconTypeToExtension } from '@/modules/object/utils';
import { useAppDispatch } from '@/store';
import { UploadObject, setTaskManagement } from '@/store/slices/global';
import { setObjectOperation } from '@/store/slices/object';
import { formatBytes } from '@/utils/formatter';
import { encodeObjectName } from '@/utils/string';
import { ReactNode } from 'react';

type Props = {
  name: string;
  size: number;
  msg?: ReactNode;
  status?: string;
  task?: UploadObject;
  [key: string]: any;
};

export const NameItem = ({ name, size, msg, status, task, ...styleProps }: Props) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const fileType = contentIconTypeToExtension(name);
  const finished = status === 'FINISH';
  const hoverStyles = finished
    ? {
        borderBottom: '1px solid readable.normal',
        cursor: 'pointer',
      }
    : {};

  const onClick = () => {
    if (!finished || !task) return;
    const id = [task.bucketName, ...task.prefixFolders, task.waitObject.relativePath, name]
      .filter(Boolean)
      .join('/');
    const objectName = [...task.prefixFolders, task.waitObject.relativePath, name]
      .filter(Boolean)
      .join('/');

    if (name.endsWith('/')) {
      dispatch(setTaskManagement(false));
      return router.push(`/buckets/${task.bucketName}/${encodeObjectName(objectName)}`);
    }

    dispatch(
      setObjectOperation({
        level: 1,
        operation: [
          id,
          'download',
          {
            action: 'view',
            bucketName: task.bucketName,
            payloadSize: task.waitObject.size,
            objectName,
          },
        ],
      }),
    );
  };

  return (
    <Flex alignItems="center" {...styleProps}>
      <IconFont mr={8} w={20} type={`${fileType}-file`} />
      <Box lineHeight="normal" flex={1} minW={0}>
        <EllipsisText
          borderBottom={'1px solid transparent'}
          _hover={hoverStyles}
          text={name}
          mb={4}
          onClick={onClick}
          w={'max-content'}
          maxW={'100%'}
        >
          {name}
        </EllipsisText>
        {(status && ['CANCEL', 'ERROR'].includes(status)) || msg ? (
          <EllipsisText fontWeight={400} color={'scene.danger.normal'}>
            {msg}
          </EllipsisText>
        ) : (
          <EllipsisText fontWeight={400} color="readable.tertiary">
            {size ? formatBytes(size) : '--'}
          </EllipsisText>
        )}
      </Box>
    </Flex>
  );
};
