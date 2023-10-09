import React from 'react';
import { LandingH2, LandingResponsiveContainer } from '..';
import { DCButton } from '@/components/common/DCButton';
import { Flex, Text } from '@totejs/uikit';
import { InternalRoutePaths } from '@/constants/paths';
import { smMedia } from '@/modules/responsive';
import { assetPrefix } from '@/base/env';
import { INTER_FONT } from '@/modules/wallet/constants';

export const PricingCalculator = () => {
  return (
    <LandingResponsiveContainer>
      <Flex
        flexDirection={'column'}
        p={'44px 48px'}
        my={80}
        bg={`url(${assetPrefix}/images/welcome/calculator.png) no-repeat right/auto 240px`}
        borderRadius={4}
        bgColor={'#F9F9F9'}
        sx={{
          [smMedia]: {
            alignItems: 'center',
            p: '20px 16px',
            my: 20,
            bgSize: 160,
            textAlign: 'center',
            bg: `none`,
            bgColor: '#f9f9f9'
          },
        }}
      >
        <LandingH2>Pricing Calculator</LandingH2>
        <Text
          fontFamily={INTER_FONT}
          mb={24}
          maxW={660}
          color='readable.secondary'
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
          sx={{
            [smMedia]: {
              h: 33
            }
          }}
        >
          Calculate Now
        </DCButton>
      </Flex>
    </LandingResponsiveContainer>
  );
};
