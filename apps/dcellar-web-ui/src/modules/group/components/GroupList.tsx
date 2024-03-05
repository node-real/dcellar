import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { DCLink } from '@/components/common/DCLink';
import { MenuOption } from '@/components/common/DCMenuList';
import { AlignType, DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { Loading } from '@/components/common/Loading';
import { GroupNameColumn } from '@/modules/group/components/GroupNameColumn';
import { CreateGroup } from '@/modules/group/components/CreateGroup';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectGroupList,
  selectGroupSpinning,
  setGroupListPage,
  setGroupOperation,
  setGroupRemoving,
} from '@/store/slices/group';
import { setGroupListPageSize, setGroupSorter, SorterType } from '@/store/slices/persist';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { Text } from '@node-real/uikit';
import { ColumnProps } from 'antd/es/table';
import { ethers } from 'ethers';
import { memo, useCallback } from 'react';

const GROUP_ACTIONS: MenuOption[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Edit Group', value: 'edit' },
  { label: 'Manage Members', value: 'add' },
  { label: 'Delete', value: 'delete', variant: 'danger' },
];

interface GroupListProps {}

export const GroupList = memo<GroupListProps>(function GroupList() {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const groupPageSize = useAppSelector((root) => root.persist.groupPageSize);
  const groupSortBy = useAppSelector((root) => root.persist.groupSortBy);
  const groupListPage = useAppSelector((root) => root.group.groupListPage);

  const groupList = useAppSelector(selectGroupList(loginAccount));
  const groupSpinning = useAppSelector(selectGroupSpinning(loginAccount));

  const { dir, sortName, sortedList, page, canPrev, canNext } = useTableNav<GroupInfo>({
    list: groupList,
    sorter: groupSortBy,
    pageSize: groupPageSize,
    currentPage: groupListPage,
  });

  const columns: ColumnProps<GroupInfo>[] = [
    {
      key: 'groupName',
      title: (
        <SortItem onClick={() => onSorterChange('groupName', 'ascend')}>
          Name{sortName === 'groupName' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, item: GroupInfo) => <GroupNameColumn item={item} />,
    },
    {
      key: 'id',
      width: 200,
      title: (
        <SortItem onClick={() => onSorterChange('id', 'descend')}>
          Group ID{sortName === 'id' ? SortIcon[dir] : <span>{SortIcon['descend']}</span>}
        </SortItem>
      ),
      render: (_: string) => {
        const hexString = ethers.utils.hexZeroPad(ethers.BigNumber.from(_).toHexString(), 32);
        return (
          <CopyText alignItems="center" value={_} boxSize={16} iconProps={{ mt: 2 }}>
            <DCLink
              color="currentcolor"
              target="_blank"
              href={`${GREENFIELD_CHAIN_EXPLORER_URL}/group/${hexString}`}
            >
              {_}
            </DCLink>
          </CopyText>
        );
      },
    },
    {
      key: 'extra',
      title: (
        <SortItem onClick={() => onSorterChange('extra', 'ascend')}>
          Description{sortName === 'extra' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string) => (
        <Text title={_} noOfLines={1}>
          {_ || '-'}
        </Text>
      ),
    },
    {
      key: 'Action',
      width: 200,
      align: 'center' as AlignType,
      title: <></>,
      render: (_: string, record: GroupInfo) => (
        <ActionMenu
          menus={GROUP_ACTIONS}
          operations={['add']}
          onChange={(e) => onGroupMenuClick(e, record)}
        />
      ),
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));

  const empty = !groupSpinning && !sortedList.length;

  const loadingComponent = {
    spinning: groupSpinning,
    indicator: <Loading />,
  };

  const renderEmpty = useCallback(
    () => (
      <ListEmpty type="empty-group" title="No Groups" desc="Create a group!👏" empty={empty}>
        <CreateGroup showRefresh={false} />
      </ListEmpty>
    ),
    [empty],
  );

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setGroupListPage(groupListPage + (next ? 1 : -1)));
    }
    dispatch(setGroupListPage(0));
    dispatch(setGroupListPageSize(pageSize));
  };

  const onSorterChange = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    if (sortName === name && dir === newSort) return;
    dispatch(setGroupSorter([name, newSort] as SorterType));
  };

  const onGroupMenuClick = (menu: string, record: GroupInfo) => {
    switch (menu) {
      case 'detail':
      case 'edit':
        return dispatch(setGroupOperation({ operation: [record.id, menu] }));
      case 'add':
        return dispatch(setGroupOperation({ level: 1, operation: [record.id, menu] }));
      case 'delete':
        return dispatch(setGroupRemoving(record));
    }
  };

  return (
    <DCTable
      loading={loadingComponent}
      rowKey="id"
      columns={columns}
      dataSource={page}
      renderEmpty={renderEmpty}
      pageSize={groupPageSize}
      pageChange={onPageChange}
      canNext={canNext}
      canPrev={canPrev}
      onRow={(record: GroupInfo) => ({
        onClick: () => {
          onGroupMenuClick('detail', record);
        },
      })}
    />
  );
});
