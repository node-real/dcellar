import React, { ReactElement } from 'react';
import { StaticHeader } from '../StaticHeader';
import { Footer } from '../Footer';
import { Box, Flex } from '@totejs/uikit';

export interface StaticPageProps {
  page: ReactElement;
}

export const StaticPage = (props: StaticPageProps) => {
  const { page } = props;
  return (
    <Flex minH={'100vh'} minW={'1000px'}>
      <Flex
        minW={0}
        flex={1}
        flexDirection={'column'}
        justifyContent="space-between"
        position="relative"
        bg="bg.bottom"
      >
      <StaticHeader />
        <Box flex={1}>{page}</Box>
        <Footer borderTop={'1px solid readable.border'} />
      </Flex>

    </Flex>
  );
};
