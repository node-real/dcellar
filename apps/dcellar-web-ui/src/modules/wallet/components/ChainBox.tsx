import { Box, Flex, FormLabel, Text } from '@totejs/uikit';
import React from 'react';

import BNBIcon from '@/public/images/icons/bnb.svg';
import { ChainInfos, POPPINS_FONT } from '../constants';

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
        fontFamily={POPPINS_FONT}
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
        <BNBIcon />
        <Text ml={'8px'} fontSize={'14px'} fontWeight="600" lineHeight={'28px'}>
          {chain?.name}
        </Text>
      </Flex>
    </Box>
  );
};
