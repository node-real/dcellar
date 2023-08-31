import React, { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectGroupList,
  setAddGroupMember,
  setCurrentGroupPage,
  setEditGroup,
  setRemoveGroup,
  setRemoveGroupMember,
} from '@/store/slices/group';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { SorterType, updateGroupPageSize, updateGroupSorter } from '@/store/slices/persist';
import { ColumnProps } from 'antd/es/table';
import { AlignType, DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { Loading } from '@/components/common/Loading';
import { GroupEmpty } from '@/modules/group/components/GroupEmpty';
import { CreateGroup } from '@/modules/group/components/CreateGroup';
import { StatusDetail } from '@/modules/object/components/StatusDetail';
import { NameItem } from '@/modules/group/components/NameItem';
import { Text } from '@totejs/uikit';
import { CopyText } from '@/components/common/CopyText';
import { ActionMenu, ActionMenuItem } from '@/components/common/DCTable/ActionMenu';
import { EditGroup } from '@/modules/group/components/EditGroup';
import { DeleteGroup } from '@/modules/group/components/DeleteGroup';
import { AddGroupMember } from '@/modules/group/components/AddGroupMember';
import { RemoveGroupMember } from '@/modules/group/components/RemoveGroupMember';

const Actions: ActionMenuItem[] = [
  { label: 'Edit Description', value: 'edit' },
  { label: 'Add Member', value: 'add' },
  { label: 'Remove Member', value: 'remove' },
  { label: 'Delete Group', value: 'delete' },
];

interface GroupListProps {}

export const GroupList = memo<GroupListProps>(function GroupList() {
  const dispatch = useAppDispatch();
  const { loginAccount, groupPageSize, groupSortBy } = useAppSelector((root) => root.persist);
  const { loading, currentPage } = useAppSelector((root) => root.group);
  const groupList = useAppSelector(selectGroupList(loginAccount));
  const { dir, sortName, sortedList, page, canPrev, canNext } = useTableNav<GroupInfo>({
    list: groupList,
    sorter: groupSortBy,
    pageSize: groupPageSize,
    currentPage,
  });

  const updateSorter = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    if (sortName === name && dir === newSort) return;
    dispatch(updateGroupSorter([name, newSort] as SorterType));
  };

  const onMenuClick = (menu: string, record: GroupInfo) => {
    switch (menu) {
      case 'edit':
        return dispatch(setEditGroup(record));
      case 'add':
        return dispatch(setAddGroupMember(record));
      case 'remove':
        return dispatch(setRemoveGroupMember(record));
      case 'delete':
        return dispatch(setRemoveGroup(record));
    }
  };

  const columns: ColumnProps<GroupInfo>[] = [
    {
      key: 'groupName',
      title: (
        <SortItem onClick={() => updateSorter('groupName', 'ascend')}>
          Name{sortName === 'groupName' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, item: GroupInfo) => <NameItem item={item} />,
    },
    {
      key: 'id',
      width: 200,
      title: (
        <SortItem onClick={() => updateSorter('id', 'descend')}>
          Group ID{sortName === 'id' ? SortIcon[dir] : <span>{SortIcon['descend']}</span>}
        </SortItem>
      ),
      render: (_: string) => (
        <CopyText
          alignItems="center"
          value={_}
          fontWeight={400}
          textDecoration="underline"
          iconProps={{ boxSize: 16, ml: 4 }}
          lineHeight={0}
        >
          {_}
        </CopyText>
      ),
    },
    {
      key: 'extra',
      title: (
        <SortItem onClick={() => updateSorter('extra', 'ascend')}>
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
        <ActionMenu menus={Actions} operations={['add']} onChange={(e) => onMenuClick(e, record)} />
      ),
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setCurrentGroupPage(currentPage + (next ? 1 : -1)));
    }
    dispatch(setCurrentGroupPage(0));
    dispatch(updateGroupPageSize(pageSize));
  };

  const empty = !loading && !sortedList.length;

  return (
    <>
      <StatusDetail />
      <CreateGroup />
      <EditGroup />
      <DeleteGroup />
      <AddGroupMember />
      <RemoveGroupMember />
      <DCTable
        loading={{
          spinning: loading,
          indicator: <Loading />,
        }}
        rowKey="id"
        columns={columns}
        dataSource={page}
        renderEmpty={() => <GroupEmpty empty={empty} />}
        pageSize={groupPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
      />
    </>
  );
});
