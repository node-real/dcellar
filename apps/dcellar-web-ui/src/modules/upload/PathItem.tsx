import { EllipsisText } from '@/components/common/EllipsisText';
import { memo } from 'react';

interface PathItemProps {
  path: string;
  [key: string]: any;
}

export const PathItem = memo<PathItemProps>(function ({ path, ...styleProps }) {
  return (
    <EllipsisText
      color={'readable.tertiary'}
      w={126}
      textAlign={'left'}
      marginRight={'12px'}
      fontWeight={400}
      {...styleProps}
    >
      {path}
    </EllipsisText>
  );
});
