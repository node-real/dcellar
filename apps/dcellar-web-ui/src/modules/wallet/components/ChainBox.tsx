import { Box, Flex, FormLabel, Text } from '@totejs/uikit';
import React from 'react';

import BSCIcon from '@/public/images/icons/bsc.svg';
import { ChainInfos } from '../constants';

type Props = {
  chainId: number;
  type: 'from' | 'to';
};

export const ChainBox = ({ chainId, type }: Props) => {
  const chain = ChainInfos.find((item) => item.chainId === chainId);
  return (
    <Box>
      <FormLabel
        textTransform={'capitalize'}
        fontWeight={500}
        fontSize="14px"
        lineHeight="150%"
        htmlFor={chain?.name}
      >
        {type}
      </FormLabel>
      <Flex
        backgroundColor={'#F5F5F5'}
        borderRadius="8px"
        alignItems={'center'}
        justifyContent="center"
        w={'182px'}
        h="52px"
        mt={'8px'}
      >
        <BSCIcon />
        <Text ml={'8px'} fontSize={'14px'} fontWeight="600" lineHeight={'28px'}>
          {chain?.name}
        </Text>
      </Flex>
    </Box>
  );
};
