import { IconFont } from '@/components/IconFont';
import { MenuOption } from '@/components/common/DCMenuList';
import { AlignType, DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { Loading } from '@/components/common/Loading';
import { BucketNameColumn } from '@/modules/bucket/components/BucketNameColumn';
import { CreateBucket } from '@/modules/bucket/components/CreateBucket';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  BucketEntity,
  BucketOperationsType,
  selectBucketList,
  selectBucketListSpinning,
  setBucketListPage,
  setBucketOperation,
} from '@/store/slices/bucket';
import { setBucketListPageSize, setBucketSorter, SorterType } from '@/store/slices/persist';
import { openLink } from '@/utils/bom';
import { apolloUrlTemplate } from '@/utils/string';
import { formatTime, getMillisecond } from '@/utils/time';
import { Flex, Text } from '@node-real/uikit';
import { ColumnProps } from 'antd/es/table';
import { memo, useCallback } from 'react';

const BUCKET_ACTIONS: MenuOption[] = [
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
  { label: 'Share', value: 'share' },
  { label: 'Delete', value: 'delete', variant: 'danger' },
];

interface BucketListProps {}

export const BucketList = memo<BucketListProps>(function BucketList() {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bucketPageSize = useAppSelector((root) => root.persist.bucketPageSize);
  const bucketSortBy = useAppSelector((root) => root.persist.bucketSortBy);
  const bucketListPage = useAppSelector((root) => root.bucket.bucketListPage);
  const LIST_FOR_SELL_ENDPOINT = useAppSelector((root) => root.apollo.LIST_FOR_SELL_ENDPOINT);
  const bucketList = useAppSelector(selectBucketList(loginAccount));
  const bucketSpinning = useAppSelector(selectBucketListSpinning(loginAccount));

  const { dir, sortName, sortedList, page, canPrev, canNext } = useTableNav<BucketEntity>({
    list: bucketList,
    sorter: bucketSortBy,
    pageSize: bucketPageSize,
    currentPage: bucketListPage,
  });

  const columns: ColumnProps<BucketEntity>[] = [
    {
      key: 'BucketName',
      title: (
        <SortItem onClick={() => onSorterChange('BucketName', 'ascend')}>
          Name{sortName === 'BucketName' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: BucketEntity) => <BucketNameColumn item={record} />,
    },
    {
      key: 'CreateAt',
      width: 200,
      title: (
        <SortItem onClick={() => onSorterChange('CreateAt', 'descend')}>
          Date Created
          {sortName === 'CreateAt' ? SortIcon[dir] : <span>{SortIcon['descend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: BucketEntity) => (
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
      render: (_: string, record: BucketEntity) => {
        const _actions = LIST_FOR_SELL_ENDPOINT
          ? BUCKET_ACTIONS
          : BUCKET_ACTIONS.filter((a) => a.value !== 'marketplace');
        return (
          <ActionMenu
            operations={['share']}
            menus={_actions}
            onChange={(e) => onBucketMenuClick(e as BucketOperationsType, record)}
          />
        );
      },
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));

  const empty = !bucketSpinning && !sortedList.length;

  const loadingComponent = {
    spinning: bucketSpinning,
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
        <CreateBucket showRefresh={false} />
      </ListEmpty>
    ),
    [empty],
  );

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setBucketListPage(bucketListPage + (next ? 1 : -1)));
    }
    dispatch(setBucketListPage(0));
    dispatch(setBucketListPageSize(pageSize));
  };

  const onSorterChange = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    if (sortName === name && dir === newSort) return;
    dispatch(setBucketSorter([name, newSort] as SorterType));
  };

  const onBucketMenuClick = (menu: BucketOperationsType, record: BucketEntity) => {
    if (menu === 'marketplace') {
      const link = apolloUrlTemplate(
        LIST_FOR_SELL_ENDPOINT,
        `address=${loginAccount}&bid=${record.Id}`,
      );
      openLink(link);
      return;
    }
    return dispatch(setBucketOperation({ operation: [record.BucketName, menu] }));
  };

  return (
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
        onClick: () => onBucketMenuClick('detail', record),
      })}
    />
  );
});
