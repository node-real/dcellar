import { memo } from 'react';
import { BucketItem } from '@/store/slices/bucket';
import { formatFullTime } from '@/utils/time';
import { DiscontinueNotice } from './DiscontinueNotice';
import FileIcon from '@/public/images/icons/bucket_icon.svg';
import Link from 'next/link';
import styled from '@emotion/styled';
import { useAppDispatch } from '@/store';
import { setCurrentObjectPage } from '@/store/slices/object';

interface NameItemProps {
  item: BucketItem;
}

export const NameItem = memo<NameItemProps>(function NameItem({ item }) {
  const dispatch = useAppDispatch();
  const { delete_at, bucket_status, bucket_name } = item;
  const discontinue = bucket_status === 1;
  const estimateTime = formatFullTime(
    +delete_at * 1000 + 7 * 24 * 60 * 60 * 1000,
    'YYYY-MM-DD HH:mm:ss',
  );
  const more = 'https://docs.nodereal.io/docs/faq-1#question-what-is-discontinue';
  const content = `This item will be deleted by SP with an estimated time of ${estimateTime}. Please backup your data in time.`;
  return (
    <Container>
      <Link
        href={`/buckets/${bucket_name}`}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(setCurrentObjectPage({ path: bucket_name, current: 0 }));
        }}
      >
        <FileIcon /> <span title={item.bucket_name}>{item.bucket_name}</span>
      </Link>
      {discontinue && <DiscontinueNotice content={content} learnMore={more} />}
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  align-items: center;
  a {
    display: flex;
    align-items: center;
    min-width: 0;
    svg {
      flex-shrink: 0;
    }
    span {
      margin: 0 4px;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;
