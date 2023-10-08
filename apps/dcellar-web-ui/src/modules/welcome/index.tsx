import { usePreloadPages } from '@/modules/welcome/hooks/usePreloadPages';
import { Box, BoxProps, Flex, Heading, HeadingProps } from '@totejs/uikit';
import React from 'react';
import { Banner } from './components/Banner';
import { StartBuild } from './components/StartBuild';
import { KeyFeatures } from './components/KeyFeatures';
import { HelpDevelopers } from './components/HelpDevelopers';
import { Building } from './components/Building';
import { PricingCalculator } from './components/PricingCalculator';
import { DeveloperTools } from './components/DeveloperTools';

export const xlMedia = `@media (min-width: 1440px)`;
export const lgMedia = `@media (min-width: 954px) and (max-width: 1439px)`;
export const mdMedia = `@media (min-width: 768px) and (max-width: 977px)`;
export const smMedia = `@media (max-width: 767px)`;

type LandingResponsiveProps = BoxProps & React.PropsWithChildren;
export const LandingResponsiveContainer = ({
  children,
  sx,
  ...restProps
}: LandingResponsiveProps) => {
  return (
    <Box
      margin={'auto auto'}
      sx={{
        [xlMedia]: {
          width: '1280px',
        },
        [lgMedia]: {
          width: 'calc(100% - 80px)',
        },
        [mdMedia]: {
          width: 'calc(100% - 40px)',
          minWidth: '351px',
        },
        [smMedia]: {
          width: 'calc(100% - 40px)',
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
  <Heading as="h2" fontSize={40} fontWeight={700} marginBottom={16} sx={{
    [smMedia]: {
      fontSize: 20,
      marginBottom: 8
    }
  }} {...restProps}>
    {children}
  </Heading>
);
