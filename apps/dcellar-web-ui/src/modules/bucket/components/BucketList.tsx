import { memo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  BucketItem,
  BucketOperationsType,
  selectBucketList,
  selectHasDiscontinue,
  setBucketOperation,
  setCurrentBucketPage,
} from '@/store/slices/bucket';
import { AlignType, DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { ColumnProps } from 'antd/es/table';
import { BucketNameColumn } from '@/modules/bucket/components/BucketNameColumn';
import { formatTime, getMillisecond } from '@/utils/time';
import { Flex, Text } from '@totejs/uikit';
import { Loading } from '@/components/common/Loading';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { SorterType, updateBucketPageSize, updateBucketSorter } from '@/store/slices/persist';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { NewBucket } from '@/modules/bucket/components/NewBucket';
import { MenuOption } from '@/components/common/DCMenuList';
import { BucketOperations } from '@/modules/bucket/components/BucketOperations';
import { IconFont } from '@/components/IconFont';
import { openLink } from '@/utils/bom';

const Actions: MenuOption[] = [
  {
    label: (
      <Flex alignItems={'center'}>
        List for Sell
        <IconFont ml={4} w={76} h={16} type="data-marketplace" />
      </Flex>
    ),
    value: 'marketplace',
  },
  { label: 'View Details', value: 'detail' },
  { label: 'Delete', value: 'delete', variant: 'danger' },
];

interface BucketListProps {}

export const BucketList = memo<BucketListProps>(function BucketList() {
  const dispatch = useAppDispatch();
  const { loginAccount, bucketPageSize, bucketSortBy } = useAppSelector((root) => root.persist);
  const { buckets, currentPage, loading } = useAppSelector((root) => root.bucket);
  const bucketList = useAppSelector(selectBucketList(loginAccount));
  const discontinue = useAppSelector(selectHasDiscontinue(loginAccount));
  const { LIST_FOR_SELL_ENDPOINT } = useAppSelector((root) => root.apollo);
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

  const onMenuClick = (menu: BucketOperationsType, record: BucketItem) => {
    if (menu === 'marketplace') {
      openLink(`${LIST_FOR_SELL_ENDPOINT}?address=${loginAccount}&bucket=${record.Id}`);
      return;
    }
    return dispatch(setBucketOperation([record.BucketName, menu]));
  };

  const columns: ColumnProps<BucketItem>[] = [
    {
      key: 'BucketName',
      title: (
        <SortItem onClick={() => updateSorter('BucketName', 'ascend')}>
          Name{sortName === 'BucketName' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: BucketItem) => <BucketNameColumn item={record} />,
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
      render: (_: string, record: BucketItem) => {
        const _actions = !!LIST_FOR_SELL_ENDPOINT
          ? Actions
          : Actions.filter((a) => a.value !== 'marketplace');
        return (
          <ActionMenu
            menus={_actions}
            onChange={(e) => onMenuClick(e as BucketOperationsType, record)}
          />
        );
      },
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setCurrentBucketPage(currentPage + (next ? 1 : -1)));
    }
    dispatch(setCurrentBucketPage(0));
    dispatch(updateBucketPageSize(pageSize));
  };

  const spinning = !(loginAccount in buckets) || loading;
  const empty = !spinning && !sortedList.length;

  const loadingComponent = {
    spinning: spinning,
    indicator: <Loading />,
  };

  const renderEmpty = useCallback(
    () => (
      <ListEmpty
        type="empty-bucket"
        empty={empty}
        title="No Buckets"
        desc="Create a bucket to get started!👏"
      >
        <NewBucket showRefresh={false} />
      </ListEmpty>
    ),
    [empty],
  );

  return (
    <>
      {discontinue && (
        <DiscontinueBanner
          content="Some items were marked as discontinued and will be deleted by SP soon. Please backup your data in time. "
          height={44}
          marginBottom={16}
        />
      )}
      <BucketOperations />
      <DCTable
        loading={loadingComponent}
        rowKey="BucketName"
        columns={columns}
        dataSource={page}
        renderEmpty={renderEmpty}
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
