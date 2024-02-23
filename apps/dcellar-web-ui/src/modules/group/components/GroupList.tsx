import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { DCLink } from '@/components/common/DCLink';
import { MenuOption } from '@/components/common/DCMenuList';
import { AlignType, DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { Loading } from '@/components/common/Loading';
import { DeleteGroup } from '@/modules/group/components/DeleteGroup';
import { GroupNameColumn } from '@/modules/group/components/GroupNameColumn';
import { GroupOperations } from '@/modules/group/components/GroupOperations';
import { NewGroup } from '@/modules/group/components/NewGroup';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectGroupList,
  setCurrentGroupPage,
  setGroupOperation,
  setRemoveGroup,
} from '@/store/slices/group';
import { SorterType, updateGroupPageSize, updateGroupSorter } from '@/store/slices/persist';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { Text } from '@node-real/uikit';
import { ColumnProps } from 'antd/es/table';
import { ethers } from 'ethers';
import { memo, useCallback } from 'react';

const Actions: MenuOption[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Edit Group', value: 'edit' },
  { label: 'Manage Members', value: 'add' },
  { label: 'Delete', value: 'delete', variant: 'danger' },
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
      case 'edit':
        return dispatch(setGroupOperation({ operation: [record.id, menu] }));
      case 'add':
        return dispatch(setGroupOperation({ level: 1, operation: [record.id, menu] }));
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
      render: (_: string, item: GroupInfo) => <GroupNameColumn item={item} />,
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

  const spinning = !(loginAccount in groups) || loading;
  const empty = !spinning && !sortedList.length;

  const loadingComponent = {
    spinning: spinning,
    indicator: <Loading />,
  };

  const renderEmpty = useCallback(
    () => (
      <ListEmpty type="empty-group" title="No Groups" desc="Create a group!👏" empty={empty}>
        <NewGroup showRefresh={false} />
      </ListEmpty>
    ),
    [empty],
  );

  return (
    <>
      <DeleteGroup />
      <GroupOperations />
      <GroupOperations level={1} />
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
            onMenuClick('detail', record);
          },
        })}
      />
    </>
  );
});
