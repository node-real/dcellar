import { Box, Flex, FormLabel, Text } from '@node-real/uikit';
import { memo } from 'react';

import { ChainInfos } from '../constants';

import { IconFont } from '@/components/IconFont';
import { isGNFDTestnet } from '@/utils/wallet';

type Props = { chainId: number; type: 'from' | 'to' };

interface ChainBoxProps {
  chainId: number;
  type: 'from' | 'to';
}

export const ChainBox = memo<ChainBoxProps>(function ChainBox({ chainId, type }: Props) {
  const chain = ChainInfos.find((item) => item.chainId === chainId);
  const isTestnet = isGNFDTestnet();

  return (
    <Box position={'relative'}>
      <FormLabel
        textTransform={'capitalize'}
        fontWeight={500}
        fontSize="14px"
        htmlFor={chain?.name}
      >
        {type}
      </FormLabel>
      <Flex
        backgroundColor={'#F5F5F5'}
        borderRadius="4px"
        alignItems={'center'}
        w={'182px'}
        h="44px"
        mt={'8px'}
        px={10}
        border={'1px solid readable.border'}
      >
        <IconFont type={'line-bsc'} w={24} color={'#F0B90B'} />
        <Text ml={'2px'} fontSize={'14px'} fontWeight="500">
          {chain?.name}
        </Text>
      </Flex>
      {isTestnet && (
        <Box
          position={'absolute'}
          right={'-6px'}
          borderRadius={2}
          border={'1px solid readable.border'}
          bgColor={'#E6F9EB'}
          px={3}
          fontSize={12}
          fontWeight={500}
          top={17}
        >
          Testnet
        </Box>
      )}
    </Box>
  );
});
