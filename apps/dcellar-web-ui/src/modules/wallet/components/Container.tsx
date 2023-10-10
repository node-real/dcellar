import { Box } from '@totejs/uikit';
import React, { memo, PropsWithChildren } from 'react';

interface ContainerProps extends PropsWithChildren {}

export const Container = memo<ContainerProps>(function ({ children }) {
  return (
    <Box
      margin="0 auto"
      w={'484px'}
      h={'auto'}
      p={'40px 24px'}
      borderRadius="8px"
      backgroundColor="readable.white"
      border={'1px solid readable.border'}
    >
      {children}
    </Box>
  );
});

export default Container;
