import React, { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectGroupList,
  setAddGroupMember,
  setCurrentGroupPage,
  setDetailGroup,
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
import { CreateGroup } from '@/modules/group/components/CreateGroup';
import { NameItem } from '@/modules/group/components/NameItem';
import { Text } from '@totejs/uikit';
import { CopyText } from '@/components/common/CopyText';
import { ActionMenu, ActionMenuItem } from '@/components/common/DCTable/ActionMenu';
import { EditGroup } from '@/modules/group/components/EditGroup';
import { DeleteGroup } from '@/modules/group/components/DeleteGroup';
import { AddGroupMember } from '@/modules/group/components/AddGroupMember';
import { GroupDetail } from '@/modules/group/components/GroupDetail';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { ethers } from 'ethers';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { NewGroup } from '@/modules/group/components/NewGroup';

const Actions: ActionMenuItem[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Edit Group', value: 'edit' },
  { label: 'Manage Members', value: 'add' },
  { label: 'Delete', value: 'delete' },
];

interface GroupListProps {}

export const GroupList = memo<GroupListProps>(function GroupList() {
  const dispatch = useAppDispatch();
  const { loginAccount, groupPageSize, groupSortBy } = useAppSelector((root) => root.persist);
  const { loading, currentPage, groups } = useAppSelector((root) => root.group);
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
      case 'detail':
        return dispatch(setDetailGroup(record));
      case 'edit':
        return dispatch(setEditGroup(record));
      case 'add':
        return dispatch(setAddGroupMember({ record, from: 'menu' }));
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
      render: (_: string) => {
        const hexString = ethers.utils.hexZeroPad(ethers.BigNumber.from(_).toHexString(), 32);
        return (
          <CopyText
            alignItems="center"
            value={_}
            fontWeight={400}
            iconProps={{ boxSize: 16, ml: 4 }}
            lineHeight={0}
          >
            <Text
              as="a"
              textDecoration="underline"
              _hover={{ textDecoration: 'underline' }}
              target="_blank"
              href={`${GREENFIELD_CHAIN_EXPLORER_URL}/group/${hexString}`}
            >
              {_}
            </Text>
          </CopyText>
        );
      },
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

  const spinning = !(loginAccount in groups);
  const empty = !spinning && !sortedList.length;

  return (
    <>
      <GroupDetail />
      <CreateGroup />
      <EditGroup />
      <DeleteGroup />
      <AddGroupMember />
      <DCTable
        loading={{
          spinning: spinning || loading,
          indicator: <Loading />,
        }}
        rowKey="id"
        columns={columns}
        dataSource={page}
        renderEmpty={() => (
          <ListEmpty type="empty-group" title="No Groups" desc="Create a group!👏" empty={empty}>
            <NewGroup showRefresh={false} />
          </ListEmpty>
        )}
        pageSize={groupPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
        onRow={(record: GroupInfo) => ({
          onClick: () => {
            dispatch(setDetailGroup(record));
          },
        })}
      />
    </>
  );
});
