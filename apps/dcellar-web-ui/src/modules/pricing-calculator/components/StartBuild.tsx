import { assetPrefix } from '@/base/env';
import { Text } from '@totejs/uikit';
import React from 'react';
import { PriceResponsiveContainer } from '..';
import { smMedia } from '@/modules/responsive';
import { H2 } from './Common';
import { ConnectWallet } from '@/components/ConnectWallet';

export const StartBuildContent = ({gaClickName}: {gaClickName: string}) => (
  <>
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
      gaClickName={gaClickName}
      sx={{
        [smMedia]: {
          height: '33px',
          fontSize: '14px',
        },
      }}
    />
  </>
);
export const StartBuild = () => (
  <PriceResponsiveContainer
    display={'flex'}
    borderRadius={8}
    p={['16px', '40px 48px']}
    gap={24}
    flexDirection={'column'}
    bg={`url(${assetPrefix}/images/price/start-bg-lt-2.png) no-repeat left/auto 100%, url(${assetPrefix}/images/price/start-bg-rt.png) no-repeat right 20% top 0, url(${assetPrefix}/images/price/start-bg-rb.png) no-repeat right 0% bottom 0%`}
    bgColor={'#F9F9F9'}
    margin={'0 auto'}
    textAlign={'center'}
    sx={{
      [smMedia]: {
        padding: '16px',
        bg: `url(${assetPrefix}/images/price/start-bg-lt-2.png) no-repeat left/auto 100%`
      },
    }}
  >
    <StartBuildContent gaClickName='dc_lp.calculator.dcellar.connect_wallet.click'/>
  </PriceResponsiveContainer>
);
