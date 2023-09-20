import { Box, Flex, Link } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React, { useMemo } from 'react';
import { DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectPaymentAccounts,
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
import { NewPA } from './NewPA';
import { Loading } from '@/components/common/Loading';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';

const actions: ActionMenuItem[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Deposit', value: 'deposit' },
  { label: 'Withdraw', value: 'withdraw' },
  { label: 'Set as non-refundable', value: 'setNonRefundable' },
];

export const PaymentAccounts = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    loginAccount,
    PAPageSize,
    paymentAccountSortBy: [sortName, dir],
  } = useAppSelector((root) => root.persist);
  const { isLoadingPaymentAccounts, currentPAPage, ownerAccount } = useAppSelector(
    (root) => root.accounts,
  );
  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));
  const ascend = sortBy(paymentAccounts, sortName);
  const sortedList = dir === 'ascend' ? ascend : reverse(ascend);
  const updateSorter = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    dispatch(updatePASorter([name, newSort] as SorterType));
  };

  const onMenuClick = (e: string, record: TAccount) => {
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
        const operations = ['deposit', 'withdraw'];
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
  const empty = !isLoadingPaymentAccounts && !sortedList.length;

  return (
    <>
      <Flex justifyContent={'space-between'} marginBottom={16} alignItems="center">
        <Box as="h3" fontSize={16} fontWeight={600}>
          Payment Account
        </Box>
        <NewPA />
      </Flex>
      <DCTable
        rowKey="address"
        loading={{
          spinning: isLoadingPaymentAccounts,
          indicator: <Loading />,
        }}
        columns={columns}
        dataSource={page}
        renderEmpty={() => (
          <ListEmpty
            type="empty-account"
            title="No Payment Accounts"
            desc="Create payment accounts to pay for storage and bandwidth. "
            empty={empty}
            h={274}
          >
            <NewPA />
          </ListEmpty>
        )}
        pageSize={PAPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
        onRow={(record: TAccount) => ({
          onClick: () => {
            dispatch(setEditPaymentDetail(record.address));
          },
        })}
      />
    </>
  );
};
