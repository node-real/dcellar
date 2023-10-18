import { Box, Flex, Text } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React, { useCallback, useMemo } from 'react';
import { DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectPaymentAccountList,
  setAccountOperation,
  setCurrentPAPage,
  setEditDisablePaymentAccount,
  TAccount,
  TAccountDetail,
} from '@/store/slices/accounts';
import { chunk, reverse, sortBy } from 'lodash-es';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { useRouter } from 'next/router';
import { SorterType, updatePAPageSize, updatePASorter } from '@/store/slices/persist';
import { NewPA } from './NewPA';
import { Loading } from '@/components/common/Loading';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { DCLink } from '@/components/common/DCLink';
import { MenuOption } from '@/components/common/DCMenuList';
import { BN } from '@/utils/math';
import { CRYPTOCURRENCY_DISPLAY_PRECISION, DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { displayTokenSymbol, getShortenWalletAddress } from '@/utils/wallet';
import { currencyFormatter } from '@/utils/formatter';
import { selectBnbPrice } from '@/store/slices/global';
import { trimFloatZero } from '@/utils/string';

const actions: MenuOption[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Deposit', value: 'deposit' },
  { label: 'Withdraw', value: 'withdraw' },
  { label: 'Set as non-refundable', value: 'setNonRefundable' },
];

export const PaymentAccounts = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const {
    loginAccount,
    PAPageSize,
    paymentAccountSortBy: [sortName, dir],
  } = useAppSelector((root) => root.persist);
  const { isLoadingPaymentAccounts, currentPAPage, ownerAccount, paymentAccounts } = useAppSelector(
    (root) => root.accounts,
  );
  const curPaymentAccounts = useAppSelector(selectPaymentAccountList(loginAccount));
  const ascend = sortBy(curPaymentAccounts, sortName);
  const sortedList = dir === 'ascend' ? ascend : reverse(ascend);
  const updateSorter = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    dispatch(updatePASorter([name, newSort] as SorterType));
  };

  const onMenuClick = (e: string, record: TAccount) => {
    if (e === 'detail') {
      dispatch(setAccountOperation([record.address, 'paDetail']));
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
  const columns: ColumnProps<TAccountDetail>[] = [
    {
      key: 'name',
      title: (
        <SortItem onClick={() => updateSorter('name', 'ascend')}>
          Name{sortName === 'name' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: TAccountDetail) => {
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
      render: (_: string, record: TAccountDetail) => {
        const addressUrl = `${GREENFIELD_CHAIN_EXPLORER_URL}/account/${record.address}`;
        return (
          <CopyText value={record.address} boxSize={16} iconProps={{ mt: 2 }}>
            <DCLink color="currentcolor" href={addressUrl} target="_blank">
              {getShortenWalletAddress(record.address)}
            </DCLink>
          </CopyText>
        );
      },
    },
    {
      key: 'staticBalance',
      title: (
        <SortItem onClick={() => updateSorter('staticBalance', 'ascend')}>
          Balance
          {sortName === 'balance' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: TAccountDetail) => {
        return (
          <Flex flexWrap={'wrap'}>
            <Text fontSize={14} fontWeight={500}>
              {BN(record.staticBalance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString()}{' '}
              {displayTokenSymbol()}
            </Text>
            <Text color="readable.tertiary" fontSize={12}>
              &nbsp;(
              {currencyFormatter(
                BN(record.staticBalance).times(BN(bnbPrice)).toString(DECIMAL_NUMBER),
              )}
              )
            </Text>
          </Flex>
        );
      },
    },
    {
      key: 'bufferBalance',
      title: (
        <SortItem onClick={() => updateSorter('bufferBalance', 'ascend')}>
          Prepaid Fee
          {sortName === 'bufferBalance' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: TAccountDetail) => {
        return (
          <Text fontSize={14} fontWeight={500}>
            {BN(record.bufferBalance || 0)
              .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
              .toString()}{' '}
            {displayTokenSymbol()}
          </Text>
        );
      },
    },
    {
      key: 'netflowRate',
      title: (
        <SortItem onClick={() => updateSorter('netflowRate', 'ascend')}>
          Flow Rate
          {sortName === 'netflowRate' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: TAccountDetail) => {
        const value = BN(record?.netflowRate || 0)
          .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
          .toString();

        return (
          <Text fontSize={14} fontWeight={500}>
            {record?.netflowRate && +record?.netflowRate !== 0 && value === '0' ? '≈ ' : ''}
            {trimFloatZero(value)} {displayTokenSymbol()}/s
          </Text>
        );
      },
    },
    {
      key: 'Operation',
      title: <></>,
      width: 200,
      render: (_: string, record: TAccountDetail) => {
        const operations = ['deposit', 'withdraw'];
        let finalActions = actions;
        console.log('operation record', record.address, record.refundable);
        if (record.refundable === false) {
          finalActions = finalActions.filter(item => item.value !== 'setNonRefundable')
        }
        return (
          <ActionMenu
            operations={operations}
            menus={finalActions}
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

  const spinning = !(loginAccount in paymentAccounts) || isLoadingPaymentAccounts;
  const empty = !spinning && !sortedList.length;
  const loadingComponent = {
    spinning: spinning,
    indicator: <Loading />,
  };
  const renderEmpty = useCallback(
    () => (
      <ListEmpty
        type="empty-account"
        title="No Payment Accounts"
        desc="Create payment accounts to pay for storage and bandwidth. "
        empty={empty}
        h={274}
      >
        <NewPA />
      </ListEmpty>
    ),
    [empty],
  );

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
        loading={loadingComponent}
        columns={columns}
        dataSource={page}
        renderEmpty={renderEmpty}
        pageSize={PAPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
        onRow={(record: TAccount) => ({
          onClick: () => onMenuClick('detail', record),
        })}
      />
    </>
  );
};
