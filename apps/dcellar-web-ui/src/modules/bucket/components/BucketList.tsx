import { memo, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  BucketItem,
  selectBucketList,
  selectHasDiscontinue,
  setCurrentBucketPage,
} from '@/store/slices/bucket';
import { AlignType, DCTable } from '@/components/common/DCTable';
import { ColumnProps } from 'antd/es/table';
import { NameItem } from '@/modules/bucket/components/NameItem';
import { formatTime, getMillisecond } from '@/utils/time';
import { Text } from '@totejs/uikit';
import { MoreIcon } from '@totejs/icons';
import { Loading } from '@/components/common/Loading';
import { ListEmpty } from '@/modules/bucket/components/ListEmpty';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { SortItem } from '@/modules/bucket/bucket.style';
import Ascend from '@/components/common/SvgIcon/Ascend.svg';
import Descend from '@/components/common/SvgIcon/Descend.svg';
import { chunk, reverse, sortBy } from 'lodash-es';
import { SorterType, updateBucketPageSize, updateBucketSorter } from '@/store/slices/persist';

const SortIcon = {
  descend: <Descend />,
  ascend: <Ascend />,
};

interface BucketListProps {}

export const BucketList = memo<BucketListProps>(function BucketList() {
  const dispatch = useAppDispatch();
  const {
    loginAccount,
    bucketPageSize,
    bucketSortBy: [sortName, dir],
  } = useAppSelector((root) => root.persist);
  const { loading, currentPage } = useAppSelector((root) => root.bucket);
  const bucketList = useAppSelector(selectBucketList(loginAccount));
  const discontinue = useAppSelector(selectHasDiscontinue(loginAccount));
  const ascend = useMemo(() => sortBy(bucketList, sortName), [bucketList, sortName]);
  const sortedList = useMemo(() => (dir === 'ascend' ? ascend : reverse(ascend)), [ascend, dir]);

  const updateSorter = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    dispatch(updateBucketSorter([name, newSort] as SorterType));
  };

  const columns: ColumnProps<BucketItem>[] = [
    {
      key: 'bucket_name',
      title: (
        <SortItem onClick={() => updateSorter('bucket_name', 'ascend')}>
          Name{sortName === 'bucket_name' ? SortIcon[dir] : <span>{<Ascend />}</span>}
        </SortItem>
      ),
      render: (_: string, record: BucketItem) => <NameItem item={record} />,
    },
    {
      key: 'created_at',
      width: 250,
      title: (
        <SortItem onClick={() => updateSorter('create_at', 'descend')}>
          Date Created{sortName === 'create_at' ? SortIcon[dir] : <span>{<Descend />}</span>}
        </SortItem>
      ),
      render: (_: string, record: BucketItem) => (
        <Text color={'readable.normal'} _hover={{ color: 'readable.normal' }}>
          {formatTime(getMillisecond(record.create_at))}
        </Text>
      ),
    },
    {
      key: 'Action',
      width: 200,
      align: 'center' as AlignType,
      title: 'Action',
      render: () => <MoreIcon />,
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));

  const chunks = useMemo(() => chunk(sortedList, bucketPageSize), [sortedList, bucketPageSize]);
  const pages = chunks.length;
  const current = currentPage >= pages ? 0 : currentPage;
  const page = chunks[current];
  const canNext = current < pages - 1;
  const canPrev = current > 0;

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setCurrentBucketPage(currentPage + (next ? 1 : -1)));
    }
    dispatch(setCurrentBucketPage(0));
    dispatch(updateBucketPageSize(pageSize));
  };

  const empty = !loading && !sortedList.length;

  return (
    <>
      {discontinue && (
        <DiscontinueBanner
          content="Some items were marked as discontinued and will be deleted by SP soon. Please backup your data in time. "
          height={44}
          marginBottom={16}
        />
      )}
      <DCTable
        loading={{
          spinning: loading,
          indicator: <Loading />,
        }}
        tableLayout="fixed"
        rowKey="bucket_name"
        columns={columns}
        dataSource={page}
        renderEmpty={() => <ListEmpty empty={empty} />}
        pagination={false}
        pageSize={bucketPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
      />
    </>
  );
});
