import { runtimeEnv } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { Box, Flex, Text } from '@node-real/uikit';
import { memo } from 'react';

export const Faucet = memo(function Faucet() {
  if (runtimeEnv !== 'testnet') {
    return null;
  }
  return (
    <Flex
      margin="16px auto 0"
      w={'484px'}
      h={'auto'}
      p={'12px 24px'}
      borderRadius="8px"
      backgroundColor="transparent"
      border={'1px solid readable.border'}
      _hover={{
        bgColor: 'white',
        borderColor: 'brand.brand6',
      }}
      justifyContent={'space-between'}
      alignItems={'center'}
      as={'a'}
      target="_blank"
      href="https://testnet.bnbchain.org/faucet-smart"
    >
      <Box>
        <Text fontSize={16} fontWeight={700}>
          Get Testnet Tokens
        </Text>
        <Text fontSize={12} color={'readable.secondary'} marginTop={4}>
          Use the BNB Greenfield faucet to get testnet tokens.
        </Text>
      </Box>
      <IconFont type="share-b38fk167" width={16} />
    </Flex>
  );
});
