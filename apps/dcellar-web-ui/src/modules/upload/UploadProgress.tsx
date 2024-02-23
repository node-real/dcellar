import { CircularProgress, CircularProgressLabel, Text } from '@node-real/uikit';
import { memo } from 'react';

interface UploadProgressProps {
  value: number;
}

export const UploadProgress = memo<UploadProgressProps>(function UploadProgress({ value }) {
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
