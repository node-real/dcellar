import { Box, BoxProps } from '@node-real/uikit';
import React, { memo, PropsWithChildren } from 'react';

interface ContainerProps extends BoxProps {}

export const Container = memo<ContainerProps>(function Container({ children, ...props }) {
  return (
    <Box
      margin="0 auto"
      w={'484px'}
      h={'auto'}
      p={'40px 24px'}
      borderRadius="8px"
      backgroundColor="readable.white"
      border={'1px solid readable.border'}
      {...props}
    >
      {children}
    </Box>
  );
});

export default Container;
