import React, { memo } from 'react';
import { CircularProgress, CircularProgressLabel, Text } from '@totejs/uikit';

interface UploadProgressProps {
  value: number;
}

export const UploadProgress = memo<UploadProgressProps>(({ value }) => {
  return (
    <CircularProgress
      size="32"
      value={value}
      trackColor="bg.bottom"
      color="#00BA34"
      marginRight={'4px'}
    >
      <CircularProgressLabel>
        <Text allowSmallFontSize fontSize={10} color="readable.tertiary" fontWeight={600}>
          {value}%
        </Text>
      </CircularProgressLabel>
    </CircularProgress>
  );
});
