import { Box } from '@totejs/uikit';
import React from 'react';

type Props = {
  children: any;
};
export const Container = ({ children }: Props) => {
  return (
    <Box
      margin="0 auto"
      w={'484px'}
      h={'auto'}
      p={'40px 24px'}
      borderRadius="12px"
      boxShadow={'0px 4px 20px rgba(0, 0, 0, 0.04)'}
      backgroundColor="readable.white"
    >
      {children}
    </Box>
  );
};

export default Container;
