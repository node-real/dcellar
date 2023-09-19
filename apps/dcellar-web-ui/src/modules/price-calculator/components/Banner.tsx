import { smMedia } from '@/modules/responsive';
import { Box, Text } from '@totejs/uikit';
import React from 'react';

export const Banner = () => {
  return (
    <Box marginY={40} textAlign={'center'} marginX={'20px'} sx={{
      [smMedia]: {
        marginY: "20px",
      }
    }}>
      <Text as="h1" fontSize={40} fontWeight={700} margin={'0 auto 16px'} sx={{
        [smMedia]: {
          fontSize: '24px',
          textAlign: 'left'
        }
      }}>
        BNB Greenfield Price Calculator
      </Text>
      <Text fontSize={16} sx={{
        [smMedia]: {
          fontSize: '14px',
          textAlign: 'left'
        }
      }}>
        With our price calculator, you can easily get an estimate for your project on BNB
        Greenfield.
      </Text>
    </Box>
  );
};
