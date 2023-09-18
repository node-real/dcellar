import { Box, Text } from '@totejs/uikit';
import React from 'react';

export const Banner = () => {
  return (
    <Box marginY={40} textAlign={'center'}>
      <Text as="h1" fontSize={40} fontWeight={700} margin={'0 auto 16px'}>
        BNB Greenfield Price Calculator
      </Text>
      <Text fontSize={16}>
        With our price calculator, you can easily get an estimate for your project on BNB
        Greenfield.
      </Text>
    </Box>
  );
};
