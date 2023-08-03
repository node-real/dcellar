import React, { memo } from 'react';
import { CircularProgress, CircularProgressLabel, Text } from '@totejs/uikit';

type Props = {
  value: number;
};
export const UploadProgress = memo(({ value }: Props) => {
  return (
    <CircularProgress size="32" value={value} trackColor='bg.bottom' color="#00BA34" marginRight={'4px'}>
      <CircularProgressLabel>
        <Text allowSmallFontSize fontSize={10} color="readable.tertiary" fontWeight={600}>
          {value}%
        </Text>
      </CircularProgressLabel>
    </CircularProgress>
  );
});
