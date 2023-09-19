import React, { ReactElement } from 'react';
import { BaseHeader } from '../LandingHeader/BaseHeader';
import { Footer } from '../Footer';
import { Box, Flex, useMediaQuery } from '@totejs/uikit';
import { MobileHeader } from '../LandingHeader/MobileHeader';
import { breakpoints } from '@/modules/responsive';

export interface LandingPageProps {
  page: ReactElement;
}

export const LandingPage = (props: LandingPageProps) => {
  const { page } = props;
  const [isSm] = useMediaQuery(`(max-width: ${breakpoints.SM - 1}px)`, false);

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
        {!isSm && <BaseHeader />}
        {isSm && <MobileHeader />}
        <Box flex={1}>{page}</Box>
        <Footer borderTop={'1px solid readable.border'} />
      </Flex>
    </Flex>
  );
};
