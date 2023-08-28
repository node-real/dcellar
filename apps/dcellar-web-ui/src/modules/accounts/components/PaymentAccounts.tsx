import { Box, Flex, Link, Loading } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { AlignType, DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  TFullAccount,
  setCurrentPAPage,
  setEditDisablePaymentAccount,
  setEditPaymentDetail,
  TAccount,
} from '@/store/slices/accounts';
import { chunk, reverse, sortBy } from 'lodash-es';
import { ActionMenu, ActionMenuItem } from '@/components/common/DCTable/ActionMenu';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { useRouter } from 'next/router';
import { SorterType, updatePAPageSize, updatePASorter } from '@/store/slices/persist';
import { PAListEmpty } from './PAListEmpty';
import { NewPA } from './NewPA';

const actions: ActionMenuItem[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Deposit', value: 'deposit' },
  { label: 'Withdraw', value: 'withdraw' },
  { label: 'Set as non-refundable', value: 'setNonRefundable' },
];

export const PaymentAccounts = () => {
  const dispatch = useAppDispatch();
  const [rowIndex, setRowIndex] = useState(-1);
  const router = useRouter();
  const { PAList, isLoadingPAList, currentPAPage, ownerAccount } = useAppSelector(
    (root) => root.accounts,
  );
  const {
    PAPageSize,
    paymentAccountSortBy: [sortName, dir],
  } = useAppSelector((root) => root.persist);
  const ascend = sortBy(PAList, sortName);
  const sortedList = dir === 'ascend' ? ascend : reverse(ascend);
  const updateSorter = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    dispatch(updatePASorter([name, newSort] as SorterType));
  };

  const onMenuClick = (e: string, record: TFullAccount) => {
    if (e === 'detail') {
      dispatch(setEditPaymentDetail(record.address));
    }
    if (e === 'setNonRefundable') {
      dispatch(setEditDisablePaymentAccount(record.address));
    }
    if (e === 'deposit') {
      router.push(`/wallet?type=send&from=${ownerAccount.address}&to=${record.address}`);
    }
    if (e === 'withdraw') {
      router.push(`/wallet?type=send&from=${record.address}&to=${ownerAccount.address}`);
    }
  };
  const columns: ColumnProps<TAccount>[] = [
    {
      key: 'name',
      title: (
        <SortItem onClick={() => updateSorter('name', 'ascend')}>
          Name{sortName === 'name' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: TAccount) => {
        return <Box>{record.name}</Box>;
      },
    },
    {
      key: 'account',
      title: (
        <SortItem onClick={() => updateSorter('account', 'ascend')}>
          Account Address
          {sortName === 'account' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
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
            <CopyText value={record.address} />
          </Flex>
        );
      },
    },
    {
      key: 'Operation',
      title: 'Operation',
      align: 'center' as AlignType,
      width: 200,
      render: (_: string, record: TFullAccount, index: number) => {
        const isCurRow = rowIndex === index;
        const operations = isCurRow ? ['deposit', 'withdraw'] : [];
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

  const chunks = useMemo(() => chunk(sortedList, PAPageSize), [sortedList, PAPageSize]);
  const pages = chunks.length;
  const current = currentPAPage >= pages ? 0 : currentPAPage;
  const page = chunks[current];
  const canNext = current < pages - 1;
  const canPrev = current > 0;
  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setCurrentPAPage(currentPAPage + (next ? 1 : -1)));
    }
    dispatch(setCurrentPAPage(0));
    dispatch(updatePAPageSize(pageSize));
  };
  const empty = !isLoadingPAList && !sortedList.length;

  return (
    <>
      <Flex justifyContent={'space-between'} marginBottom={16}>
        <Box as="h3" fontSize={16} fontWeight={600} marginBottom={16}>
          Payment Account
        </Box>
        <NewPA />
      </Flex>
      <DCTable
        rowKey="address"
        loading={{
          spinning: isLoadingPAList,
          indicator: <Loading />,
        }}
        columns={columns}
        dataSource={page}
        renderEmpty={() => <PAListEmpty empty={empty} />}
        pageSize={PAPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
        onRow={(record: TFullAccount, index) => ({
          onClick: () => {
            dispatch(setEditPaymentDetail(record.address));
          },
          onMouseEnter: () => {
            setRowIndex(Number(index));
          },
          onMouseLeave: () => {
            setRowIndex(-1);
          },
        })}
      ></DCTable>
    </>
  );
};
