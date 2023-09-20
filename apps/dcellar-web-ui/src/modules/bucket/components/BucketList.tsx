import { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  BucketItem,
  selectBucketList,
  selectHasDiscontinue,
  setCurrentBucketPage,
  setEditDelete,
  setEditDetail,
} from '@/store/slices/bucket';
import { AlignType, DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { ColumnProps } from 'antd/es/table';
import { NameItem } from '@/modules/bucket/components/NameItem';
import { formatTime, getMillisecond } from '@/utils/time';
import { Text } from '@totejs/uikit';
import { Loading } from '@/components/common/Loading';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { SorterType, updateBucketPageSize, updateBucketSorter } from '@/store/slices/persist';
import { ActionMenu, ActionMenuItem } from '@/components/common/DCTable/ActionMenu';
import { DetailDrawer } from '@/modules/bucket/components/DetailDrawer';
import { DeleteBucket } from '@/modules/bucket/components/DeleteBucket';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { BucketDrawer } from '@/modules/bucket/components/BucketDrawer';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { NewBucket } from '@/modules/bucket/components/NewBucket';

const Actions: ActionMenuItem[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Delete', value: 'delete' },
];

interface BucketListProps {}

export const BucketList = memo<BucketListProps>(function BucketList() {
  const dispatch = useAppDispatch();
  const { loginAccount, bucketPageSize, bucketSortBy } = useAppSelector((root) => root.persist);
  const { buckets, currentPage, loading } = useAppSelector((root) => root.bucket);
  const bucketList = useAppSelector(selectBucketList(loginAccount));
  const discontinue = useAppSelector(selectHasDiscontinue(loginAccount));
  const { dir, sortName, sortedList, page, canPrev, canNext } = useTableNav<BucketItem>({
    list: bucketList,
    sorter: bucketSortBy,
    pageSize: bucketPageSize,
    currentPage,
  });

  const updateSorter = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    if (sortName === name && dir === newSort) return;
    dispatch(updateBucketSorter([name, newSort] as SorterType));
  };

  const onMenuClick = (menu: string, record: BucketItem) => {
    switch (menu) {
      case 'detail':
        return dispatch(setEditDetail(record));
      case 'delete':
        return dispatch(setEditDelete(record));
    }
  };

  const columns: ColumnProps<BucketItem>[] = [
    {
      key: 'BucketName',
      title: (
        <SortItem onClick={() => updateSorter('BucketName', 'ascend')}>
          Name{sortName === 'BucketName' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: BucketItem) => <NameItem item={record} />,
    },
    {
      key: 'CreateAt',
      width: 200,
      title: (
        <SortItem onClick={() => updateSorter('CreateAt', 'descend')}>
          Date Created
          {sortName === 'CreateAt' ? SortIcon[dir] : <span>{SortIcon['descend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: BucketItem) => (
        <Text color={'readable.normal'} _hover={{ color: 'readable.normal' }}>
          {formatTime(getMillisecond(record.CreateAt))}
        </Text>
      ),
    },
    {
      key: 'Action',
      width: 200,
      align: 'center' as AlignType,
      title: <></>,
      render: (_: string, record: BucketItem) => (
        <ActionMenu menus={Actions} onChange={(e) => onMenuClick(e, record)} />
      ),
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setCurrentBucketPage(currentPage + (next ? 1 : -1)));
    }
    dispatch(setCurrentBucketPage(0));
    dispatch(updateBucketPageSize(pageSize));
  };

  const spinning = !(loginAccount in buckets);
  const empty = !spinning && !sortedList.length;

  return (
    <>
      <BucketDrawer />
      <DetailDrawer />
      <DeleteBucket />
      {discontinue && (
        <DiscontinueBanner
          content="Some items were marked as discontinued and will be deleted by SP soon. Please backup your data in time. "
          height={44}
          marginBottom={16}
        />
      )}
      <DCTable
        loading={{
          spinning: spinning || loading,
          indicator: <Loading />,
        }}
        rowKey="BucketName"
        columns={columns}
        dataSource={page}
        renderEmpty={() => (
          <ListEmpty
            type="empty-bucket"
            empty={empty}
            title="No Buckets"
            desc="Create a bucket to get started!👏"
          >
            <NewBucket showRefresh={false} />
          </ListEmpty>
        )}
        pageSize={bucketPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
        onRow={(record) => ({
          onClick: () => onMenuClick('detail', record),
        })}
      />
    </>
  );
});
