import { EllipsisText } from '@/components/common/EllipsisText';
import { Box, Flex } from '@totejs/uikit';
import { formatBytes } from '@/utils/formatter';
import { contentIconTypeToExtension } from '@/modules/object/utils';
import { IconFont } from '@/components/IconFont';
import React from 'react';

type Props = {
  name: string;
  size: number;
  msg?: string;
  status?: string;
  [key: string]: any;
};
export const NameItem = ({ name, size, msg, status, ...styleProps }: Props) => {
  const fileType = contentIconTypeToExtension(name);
  return (
    <Flex alignItems="center" {...styleProps}>
      <IconFont mr={8} w={20} type={`${fileType}-file`} />
      <Box w="calc(100% - 39px)" lineHeight="normal">
        <EllipsisText marginRight={'12px'} mb={4}>
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
