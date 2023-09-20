import { Box, Flex, Link } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React from 'react';
import { DCTable } from '@/components/common/DCTable';
import { useAppDispatch, useAppSelector } from '@/store';
import { TAccount, setEditOwnerDetail } from '@/store/slices/accounts';
import { isEmpty } from 'lodash-es';
import { ActionMenu, ActionMenuItem } from '@/components/common/DCTable/ActionMenu';
import { CopyText } from '@/components/common/CopyText';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { Loading } from '@/components/common/Loading';

const actions: ActionMenuItem[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' },
  { label: 'Send', value: 'send' },
];

export const OwnerAccount = () => {
  const dispatch = useAppDispatch();
  const { ownerAccount } = useAppSelector((root) => root.accounts);
  const data = ownerAccount?.address ? [ownerAccount] : [];
  const router = useRouter();
  const onMenuClick = (e: string, record: TAccount) => {
    if (e === 'detail') {
      return dispatch(setEditOwnerDetail(record.address));
    }
    if (['transfer_in', 'transfer_out', 'send'].includes(e)) {
      return router.push(`/wallet?type=${e}`);
    }
  };
  const ownerAccountLoading = isEmpty(ownerAccount);
  const columns: ColumnProps<TAccount>[] = [
    {
      key: 'name',
      title: 'Name',
      render: (_: string, record: TAccount) => {
        return <Box>{record.name}</Box>;
      },
    },
    {
      key: 'address',
      title: 'Account Address',
      render: (_: string, record: TAccount) => {
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
            <CopyText value={record.address} boxSize={16} />
          </Flex>
        );
      },
    },
    {
      key: 'Operation',
      title: <></>,
      width: 200,
      render: (_: string, record: TAccount) => {
        const operations = ['transfer_in', 'transfer_out', 'send'];
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
  ].map((col) => ({ ...col, dataIndex: col.key }));

  return (
    <Container>
      <Box as="h3" fontSize={16} fontWeight={600} marginBottom={16}>
        Owner Account
      </Box>
      <DCTable
        rowKey="address"
        columns={columns}
        dataSource={data}
        canNext={false}
        canPrev={false}
        pageSize={10}
        pagination={false}
        loading={{
          spinning: ownerAccountLoading,
          indicator: <Loading />,
        }}
        onRow={(record: TAccount) => ({
          onClick: () => {
            dispatch(setEditOwnerDetail(record.address));
          },
        })}
      ></DCTable>
    </Container>
  );
};

const Container = styled(Box)`
  margin-bottom: 32px;
  .ant-table-wrapper .ant-table-tbody > tr > td {
    border-bottom: none;
  }
`;
