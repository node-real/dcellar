import { EllipsisText } from '@/components/common/EllipsisText';
import { memo } from 'react';
import { Text } from '@totejs/uikit';
import Link from 'next/link';
import { encodeObjectName } from '@/utils/string';
import { setTaskManagement } from '@/store/slices/global';
import { useAppDispatch } from '@/store';

interface PathItemProps {
  path: string;
  status?: string;
  [key: string]: any;
}

export const PathItem = memo<PathItemProps>(function PathItem({ path, status, ...styleProps }) {
  const dispatch = useAppDispatch();
  const finished = status === 'FINISH';
  const hoverStyles = finished
    ? {
        color: '#3ec659',
        cursor: 'pointer',
        borderColor: '#3ec659',
      }
    : {
        cursor: 'default',
      };
  return (
    <EllipsisText
      color={'readable.tertiary'}
      flex={1}
      textAlign={'left'}
      marginRight={'12px'}
      fontWeight={400}
      text={path}
      {...styleProps}
    >
      <Link href={`/buckets/${encodeObjectName(path)}`} legacyBehavior passHref>
        <Text
          borderBottom={finished ? '1px solid' : ''}
          as={'a'}
          _hover={hoverStyles}
          onClick={(e) => {
            if (!finished) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            dispatch(setTaskManagement(false));
          }}
        >
          {path}
        </Text>
      </Link>
    </EllipsisText>
  );
});
