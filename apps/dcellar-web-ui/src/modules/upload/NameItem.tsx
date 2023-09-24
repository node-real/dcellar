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
  const icon = (
    <Flex
      width={27}
      height={27}
      border={'1px solid readable.border'}
      borderRadius={4}
      alignItems={'center'}
      justifyContent={'center'}
      marginRight={12}
    >
      <IconFont w={20} type={`${fileType}-file`} />
    </Flex>
  );
  return (
    <Flex alignItems="center" {...styleProps}>
      {icon}
      <Box w="calc(100% - 39px)">
        <EllipsisText marginRight={'12px'}>{name}</EllipsisText>
        {(status && ['CANCEL', 'ERROR'].includes(status)) || msg ? (
          <EllipsisText fontWeight={400} color={'red'}>
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
