import React, { ReactElement } from 'react';
import { BaseHeader } from '../LandingHeader/BaseHeader';
import { Footer } from '../Footer';
import { Box, Flex } from '@totejs/uikit';
import { MobileHeader } from '../LandingHeader/MobileHeader';
import { CookiePolicyContainer } from '@/components/CookiePolicyContainer';

export interface LandingPageProps {
  page: ReactElement;
}

export const LandingPage = (props: LandingPageProps) => {
  const { page } = props;

  return (
    <Flex minH={'100vh'}>
      <Flex
        minW={0}
        flex={1}
        flexDirection={'column'}
        justifyContent="space-between"
        position="relative"
        bg="bg.bottom"
      >
        <BaseHeader />
        <MobileHeader />
        <Box flex={1}>{page}</Box>
        <Footer borderTop={'1px solid readable.border'} />
        <CookiePolicyContainer />
      </Flex>
    </Flex>
  );
};
