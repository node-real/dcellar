import { usePreloadPages } from '@/modules/welcome/hooks/usePreloadPages';
import { Box, BoxProps, Flex, Heading, HeadingProps } from '@node-real/uikit';
import React from 'react';
import { INTER_FONT } from '../wallet/constants';
import { Banner } from './components/Banner';
import { Building } from './components/Building';
import { DeveloperTools } from './components/DeveloperTools';
import { HelpDevelopers } from './components/HelpDevelopers';
import { KeyFeatures } from './components/KeyFeatures';
import { PricingCalculator } from './components/PricingCalculator';
import { StartBuild } from './components/StartBuild';

export const xlMedia = `@media (min-width: 1440px)`;
export const lgMedia = `@media (min-width: 954px) and (max-width: 1439px)`;
export const mdMedia = `@media (min-width: 768px) and (max-width: 977px)`;
export const smMedia = `@media (max-width: 767px)`;

type LandingResponsiveProps = BoxProps & React.PropsWithChildren;
export const LandingResponsiveContainer = ({ children, ...restProps }: LandingResponsiveProps) => {
  return (
    <Box
      margin={'auto auto'}
      sx={{
        [xlMedia]: {
          width: '1280px',
        },
        [lgMedia]: {
          width: '100%',
          paddingX: 40,
        },
        [mdMedia]: {
          width: '100%',
          paddingX: 20,
          minWidth: '351px',
        },
        [smMedia]: {
          width: '100%',
          paddingX: 20,
          minWidth: '351px',
        },
      }}
      {...restProps}
    >
      {children}
    </Box>
  );
};

export function Welcome() {
  usePreloadPages();

  return (
    <Flex bgColor={'white'} flexDirection={'column'}>
      <Banner />
      <KeyFeatures />
      <HelpDevelopers />
      <Building />
      <PricingCalculator />
      <DeveloperTools />
      <StartBuild />
    </Flex>
  );
}

export const LandingH2 = ({ children, ...restProps }: HeadingProps) => (
  <Heading
    as="h2"
    fontSize={40}
    fontWeight={700}
    fontFamily={INTER_FONT}
    marginBottom={16}
    sx={{
      [smMedia]: {
        fontSize: 20,
        marginBottom: 8,
      },
    }}
    {...restProps}
  >
    {children}
  </Heading>
);
