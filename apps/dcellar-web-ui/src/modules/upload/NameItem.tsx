import { EllipsisText } from '@/components/common/EllipsisText';
import { Box, Flex, Text } from '@totejs/uikit';
import { formatBytes } from '@/utils/formatter';
import { contentIconTypeToExtension } from '@/modules/object/utils';
import { IconFont } from '@/components/IconFont';
import React from 'react';
import { useAppDispatch } from '@/store';
import { setObjectOperation } from '@/store/slices/object';
import { UploadFile } from '@/store/slices/global';

type Props = {
  name: string;
  size: number;
  msg?: string;
  status?: string;
  task?: UploadFile;
  [key: string]: any;
};
export const NameItem = ({ name, size, msg, status, task, ...styleProps }: Props) => {
  const dispatch = useAppDispatch();
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
    const id = [task.bucketName, ...task.prefixFolders, name].join('/');
    dispatch(
      setObjectOperation({
        level: 1,
        operation: [id, 'download', { action: 'view', bucketName: task.bucketName }],
      }),
    );
  };

  return (
    <Flex alignItems="center" {...styleProps}>
      <IconFont mr={8} w={20} type={`${fileType}-file`} />
      <Box w="calc(100% - 39px)" lineHeight="normal">
        <EllipsisText text={name} marginRight={'12px'} mb={4} onClick={onClick}>
          <Text
            display="inline-flex"
            borderBottom={'1px solid transparent'}
            as={'span'}
            onClick={onClick}
            _hover={hoverStyles}
          >
            {name}
          </Text>
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
