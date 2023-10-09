import React from 'react';
import { LandingH2, LandingResponsiveContainer } from '..';
import { DCButton } from '@/components/common/DCButton';
import { Flex, Text } from '@totejs/uikit';
import { useRouter } from 'next/router';
import { InternalRoutePaths } from '@/constants/paths';
import { smMedia } from '@/modules/responsive';
import { assetPrefix } from '@/base/env';

export const PricingCalculator = () => {
  const router = useRouter();
  return (
    <LandingResponsiveContainer>
      <Flex
        bgColor={'#F9F9F9'}
        flexDirection={'column'}
        p={'64px 48px'}
        my={40}
        bg={`url(${assetPrefix}/images/welcome/calculator.png) no-repeat right/auto 240px`}
        sx={{
          [smMedia]: {
            alignItems: 'center',
            p: '20px 16px',
            my: 20,
            bgSize: 160,
            textAlign: 'center'
          },
        }}
      >
        <LandingH2>Pricing Calculator</LandingH2>
        <Text
          mb={24}
          maxW={560}
          sx={{
            [smMedia]: {
              mb: 16,
            },
          }}
        >
          With our price calculator, you can easily get an estimate for your project on BNB
          Greenfield.
        </Text>
        <DCButton
          variant="brand"
          onClick={() => {
            window.open(InternalRoutePaths.pricing_calculator, '_blank');
          }}
          w={'fit-content'}
        >
          Calculate Now
        </DCButton>
      </Flex>
    </LandingResponsiveContainer>
  );
};
