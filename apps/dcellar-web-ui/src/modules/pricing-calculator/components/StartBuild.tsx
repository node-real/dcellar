import { assetPrefix } from '@/base/env';
import { Text } from '@totejs/uikit';
import React from 'react';
import { PriceResponsiveContainer } from '..';
import { smMedia } from '@/modules/responsive';
import { H2 } from './Common';
import { ConnectWallet } from '@/components/ConnectWallet';

export const StartBuild = () => (
  <PriceResponsiveContainer
    display={'flex'}
    borderRadius={8}
    p={['16px', '40px 48px']}
    gap={24}
    flexDirection={'column'}
    bg={`url(${assetPrefix}/images/price/start_bg.svg) no-repeat left/auto 100%`}
    bgColor={'#F9F9F9'}
    margin={'0 auto'}
    textAlign={'center'}
    sx={{
      [smMedia]: {
        padding: '16px',
      },
    }}
  >
    <H2>Start Building with DCellar Now</H2>
    <Text
      fontSize={16}
      sx={{
        [smMedia]: {
          fontSize: '14px',
        },
      }}
    >
      Start your business with BNB Greenfield's decentralized storage solution with DCellar, and
      easily expand your operations.
    </Text>
    <ConnectWallet
      text="Get Started"
      w={'fit-content'}
      margin={'auto auto'}
      h={54}
      padding={'16px 48px'}
      fontWeight={600}
      sx={{
        [smMedia]: {
          height: '33px',
          fontSize: '14px',
        },
      }}
    />
  </PriceResponsiveContainer>
);
