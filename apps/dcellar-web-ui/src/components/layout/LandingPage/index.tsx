import { CookiePolicyContainer } from '@/components/CookiePolicyContainer';
import { Box, Flex } from '@node-real/uikit';
import { ReactElement } from 'react';
import { Footer } from '../Footer';
import { BaseHeader } from '../LandingHeader/BaseHeader';
import { MobileHeader } from '../LandingHeader/MobileHeader';

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
