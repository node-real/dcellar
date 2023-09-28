import { assetPrefix } from '@/base/env';
import { DCButton } from '@/components/common/DCButton';
import { Box, Flex, Text } from '@totejs/uikit';
import React from 'react';

export const StartBuild = () => {
  return (
    <Flex
      borderRadius={8}
      p={'40px 48px'}
      gap={24}
      flexDirection={'column'}
      bg={`url(${assetPrefix}/images/price/start_bg.svg) no-repeat left/auto 100%`}
      bgColor={'#F9F9F9'}
      margin={'0 auto'}
      w={954}
      textAlign={'center'}
    >
      <Text fontWeight={'700'} fontSize={36}>
        Start Building with DCellar Now
      </Text>
      <Text fontSize={16}>
        Start your business with BNB Greenfield's decentralized storage solution with DCellar, and
        easily expand your operations.
      </Text>
      <DCButton margin="0 auto" variant="dcPrimary" w={'fit-content'}>
        Get Started
      </DCButton>
      </Flex>
  );
};
