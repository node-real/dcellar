import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { DCLink } from '@/components/common/DCLink';
import { MenuOption } from '@/components/common/DCMenuList';
import { DCTable, SortIcon, SortItem } from '@/components/common/DCTable';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { Loading } from '@/components/common/Loading';
import { CRYPTOCURRENCY_DISPLAY_PRECISION, DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  AccountEntity,
  AccountInfo,
  setPaymentAccountListPage,
  setEditingPaymentAccountRefundable,
} from '@/store/slices/accounts';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import {
  SorterType,
  setPaymentAccountListPageSize,
  setPaymentAccountSorter,
} from '@/store/slices/persist';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { trimFloatZero } from '@/utils/string';
import { displayTokenSymbol, getShortenWalletAddress } from '@/utils/wallet';
import { Box, Flex, Text, useMediaQuery } from '@node-real/uikit';
import { ColumnProps } from 'antd/es/table';
import { chunk, reverse, sortBy } from 'lodash-es';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { CreatePaymentAccount } from './CreatePaymentAccount';
import { memo } from 'react';

const ACCOUNT_ACTIONS: MenuOption[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Deposit', value: 'deposit' },
  { label: 'Withdraw', value: 'withdraw' },
  { label: 'Set as Non-refundable', value: 'setNonRefundable' },
];

interface PaymentAccountListProps {}

export const PaymentAccountList = memo<PaymentAccountListProps>(function PaymentAccountList() {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const paymentAccountPageSize = useAppSelector((root) => root.persist.paymentAccountPageSize);
  const [sortName, dir] = useAppSelector((root) => root.persist.paymentAccountSortBy);
  const paymentAccountsLoading = useAppSelector((root) => root.accounts.paymentAccountsLoading);
  const paymentAccountListPage = useAppSelector((root) => root.accounts.paymentAccountListPage);
  const ownerAccount = useAppSelector((root) => root.accounts.ownerAccount);
  const accountRecords = useAppSelector((root) => root.accounts.accountRecords);
  const paymentAccountListRecords = useAppSelector(
    (root) => root.accounts.paymentAccountListRecords,
  );

  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);
  const router = useRouter();
  const [isLessThan1100] = useMediaQuery('(max-width: 1100px)');

  const detailList = useMemo(() => {
    if (!loginAccount) return [];
    return (
      (paymentAccountListRecords[loginAccount] || []).map((item) => ({
        ...accountRecords[item.address],
      })) || []
    );
  }, [accountRecords, loginAccount, paymentAccountListRecords]);
  const ascend = sortBy(detailList, sortName);
  const sortedList = dir === 'ascend' ? ascend : reverse(ascend);
  const chunks = useMemo(
    () => chunk(sortedList, paymentAccountPageSize),
    [sortedList, paymentAccountPageSize],
  );
  const pages = chunks.length;
  const current = paymentAccountListPage >= pages ? 0 : paymentAccountListPage;
  const page = chunks[current];
  const canNext = current < pages - 1;
  const canPrev = current > 0;
  const spinning = !(loginAccount in paymentAccountListRecords) || paymentAccountsLoading;
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
        <CreatePaymentAccount />
      </ListEmpty>
    ),
    [empty],
  );

  const onSorterChange = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    dispatch(setPaymentAccountSorter([name, newSort] as SorterType));
  };

  const columns: ColumnProps<AccountInfo>[] = [
    {
      key: 'name',
      title: (
        // account for default sort
        <SortItem onClick={() => onSorterChange('account', 'ascend')}>
          <Text>Name</Text>
          {sortName === 'account' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: AccountInfo) => {
        return <Box>{record.name}</Box>;
      },
    },
    {
      key: 'address',
      width: isLessThan1100 ? 130 : 'auto',
      title: (
        <SortItem onClick={() => onSorterChange('address', 'ascend')}>
          Account Address
          {sortName === 'address' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: AccountInfo) => {
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
        <SortItem onClick={() => onSorterChange('staticBalance', 'ascend')}>
          Balance
          {sortName === 'balance' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: AccountInfo) => {
        return (
          <Flex flexWrap={'wrap'}>
            <Text fontSize={14} fontWeight={500}>
              {BN(record.staticBalance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString()}{' '}
              {displayTokenSymbol()}
            </Text>
            <Text color="readable.tertiary" fontSize={12}>
              &nbsp;(
              {currencyFormatter(
                BN(record.staticBalance).times(BN(exchangeRate)).toString(DECIMAL_NUMBER),
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
        <SortItem onClick={() => onSorterChange('bufferBalance', 'ascend')}>
          Prepaid Fee
          {sortName === 'bufferBalance' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: AccountInfo) => {
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
        <SortItem onClick={() => onSorterChange('netflowRate', 'ascend')}>
          Flow Rate
          {sortName === 'netflowRate' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: AccountInfo) => {
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
      title: <Text textAlign={'center'}>Operation</Text>,
      width: 150,
      render: (_: string, record: AccountInfo) => {
        let operations = ['deposit', 'withdraw'];
        let finalActions = ACCOUNT_ACTIONS;
        if (record.refundable === false) {
          finalActions = finalActions.filter(
            (item) => !['setNonRefundable', 'withdraw'].includes(item.value),
          );
          operations = operations.filter(
            (value) => !['setNonRefundable', 'withdraw'].includes(value),
          );
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

  const onMenuClick = (e: string, record: AccountEntity) => {
    if (e === 'detail') {
      // dispatch(setAccountOperation([record.address, 'paDetail']));
      return router.push(`/accounts/${record.address}`);
    }
    if (e === 'setNonRefundable') {
      return dispatch(setEditingPaymentAccountRefundable(record.address));
    }
    if (e === 'deposit') {
      return router.push(`/wallet?type=send&from=${ownerAccount.address}&to=${record.address}`);
    }
    if (e === 'withdraw') {
      return router.push(`/wallet?type=send&from=${record.address}&to=${ownerAccount.address}`);
    }
  };

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setPaymentAccountListPage(paymentAccountListPage + (next ? 1 : -1)));
    }
    dispatch(setPaymentAccountListPage(0));
    dispatch(setPaymentAccountListPageSize(pageSize));
  };

  return (
    <DCTable
      rowKey="address"
      loading={loadingComponent}
      columns={columns}
      dataSource={page}
      renderEmpty={renderEmpty}
      pageSize={paymentAccountPageSize}
      pageChange={onPageChange}
      canNext={canNext}
      canPrev={canPrev}
      onRow={(record: AccountEntity) => ({
        onClick: () => onMenuClick('detail', record),
      })}
    />
  );
});
