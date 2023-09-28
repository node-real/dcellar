import { memo } from 'react';
import { BucketItem } from '@/store/slices/bucket';
import { formatFullTime } from '@/utils/time';
import { DiscontinueNotice } from './DiscontinueNotice';
import Link from 'next/link';
import styled from '@emotion/styled';
import { useAppDispatch } from '@/store';
import { setCurrentObjectPage } from '@/store/slices/object';
import { IconFont } from '@/components/IconFont';

interface BucketNameColumnProps {
  item: BucketItem;
}

export const BucketNameColumn = memo<BucketNameColumnProps>(function BucketNameColumn({ item }) {
  const dispatch = useAppDispatch();
  const { DeleteAt, BucketStatus, BucketName } = item;
  const discontinue = BucketStatus === 1;
  const estimateTime = formatFullTime(
    +DeleteAt * 1000 + 7 * 24 * 60 * 60 * 1000,
    'YYYY-MM-DD HH:mm:ss',
  );
  const more = 'https://docs.nodereal.io/docs/dcellar-faq#question-what-is-discontinue';
  const content = `This item will be deleted by SP with an estimated time of ${estimateTime}. Please backup your data in time.`;
  return (
    <Container>
      <Link
        href={`/buckets/${BucketName}`}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(setCurrentObjectPage({ path: BucketName, current: 0 }));
        }}
      >
        <IconFont type="bucket-thumbnail" w={20} />
        <span title={item.BucketName}>{item.BucketName}</span>
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
    span {
      margin: 0 4px;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;