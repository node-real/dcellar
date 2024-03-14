import React from 'react';
import { Box, keyframes } from '@node-real/uikit';

const dotAnimation = keyframes`
  33% {
    transform: translateY(-2em);
  }
  66% {
    transform: translateY(-1em);
  }
`;

export const DotLoading = () => {
  return (
    <Box
      display="inline-block"
      textAlign="left"
      overflow="hidden"
      height="1em"
      lineHeight="1em"
      verticalAlign="-0.25em"
      _before={{
        content: `'...\\A..\\A.'`,
        display: 'block',
        whiteSpace: 'pre-wrap',
        animation: `${dotAnimation} 2s infinite step-start both`,
      }}
    />
  );
};
