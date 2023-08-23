import { Box, Flex, Link } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React, { useState } from 'react';
import { DCTable } from '@/components/common/DCTable';
import { useAppDispatch, useAppSelector } from '@/store';
import { TFullAccount, setEditOwnerDetail } from '@/store/slices/accounts';
import { isEmpty } from 'lodash-es';
import { ActionMenu, ActionMenuItem } from '@/components/common/DCTable/ActionMenu';
import { CopyText } from '@/components/common/CopyText';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { useRouter } from 'next/router';

const actions: ActionMenuItem[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' },
  { label: 'Send', value: 'send' },
];

export const OwnerAccount = () => {
  const dispatch = useAppDispatch();
  const [rowIndex, setRowIndex] = useState(-1);
  const { ownerAccount } = useAppSelector((root) => root.accounts);
  const data = [ownerAccount];
  const router = useRouter();
  const onMenuClick = (e: string, record: TFullAccount) => {
    if (e === 'detail') {
      return dispatch(setEditOwnerDetail(record.address));
    }
    if (['transfer_in', 'transfer_out', 'send'].includes(e)) {
      return router.push(`/wallet?type=${e}`);
    }
  };
  const ownerAccountLoading = isEmpty(ownerAccount);
  const columns: ColumnProps<any>[] = [
    {
      key: 'name',
      title: 'Name',
      render: (_: string, record: TFullAccount) => {
        return <Box>{record.name}</Box>;
      },
    },
    {
      key: 'address',
      title: 'Account Address',
      render: (_: string, record: TFullAccount) => {
        const addressUrl = `${GREENFIELD_CHAIN_EXPLORER_URL}/account/${record.address}`;
        return (
          <Flex>
            <Link
              href={addressUrl}
              target="_blank"
              textDecoration={'underline'}
              color={'readable.normal'}
              _hover={{
                textDecoration: 'underline',
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {record.address}{' '}
            </Link>{' '}
            <CopyText value={record.address} />
          </Flex>
        );
      },
    },
    {
      key: 'Operation',
      title: 'Operation',
      align: 'center',
      width: 200,
      render: (_: string, record: TFullAccount, index: number) => {
        const isCurRow = rowIndex === index;
        const operations = isCurRow ? ['transfer_in', 'transfer_out', 'send'] : [];
        return (
          <ActionMenu
            operations={operations}
            menus={actions}
            justifyContent="flex-end"
            onChange={(e) => onMenuClick(e, record)}
          />
        );
      },
    },
  ];
  return (
    <Box marginBottom={32}>
      <Box as="h3" fontSize={16} fontWeight={600} marginBottom={16}>
        Owner Account
      </Box>
      <DCTable
        columns={columns}
        dataSource={data}
        canNext={false}
        canPrev={false}
        pageSize={10}
        pagination={false}
        loading={ownerAccountLoading}
        onRow={(record: TFullAccount, index) => ({
          onClick: () => {
            dispatch(setEditOwnerDetail(record.address));
          },
          onMouseEnter: () => {
            setRowIndex(Number(index));
          },
          onMouseLeave: () => {
            setRowIndex(-1);
          },
        })}
      ></DCTable>
    </Box>
  );
};