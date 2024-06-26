import { DCTable } from '@/components/common/DCTable';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  AccountBill,
  selectAccountBills,
  selectAccountBillsCount,
  setupAccountBills,
} from '@/store/slices/billing';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { formatTxType } from '@/utils/billing';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { formatTime } from '@/utils/time';
import { displayTokenSymbol } from '@/utils/wallet';
import { Box, Flex, Text } from '@node-real/uikit';
import { useAsyncEffect } from 'ahooks';
import { ColumnProps } from 'antd/es/table';
import { merge } from 'lodash-es';
import { useRouter } from 'next/router';
import { stringify } from 'querystring';
import { useCallback } from 'react';
import { AccountBillingHistoryFilter } from './AccountBillingHistoryFilter';
import { ShortTxCopy } from './Common';

type Props = {
  address: string;
};
export const AccountBillingHistory = ({ address }: Props) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const accountBillListPage = useAppSelector((root) => root.billing.accountBillListPage);
  const accountBillListLoading = useAppSelector((root) => root.billing.accountBillListLoading);
  const accountBillPageSize = useAppSelector((root) => root.persist.accountBillPageSize);
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);
  const accountBills = useAppSelector(selectAccountBills(address));
  const accountBillsCount = useAppSelector(selectAccountBillsCount(address));

  const query = router.query;
  const pageData = accountBills;

  const columns: ColumnProps<any>[] = [
    {
      title: 'Transaction Hash',
      key: 'tx',
      render: (_: string, record: AccountBill) => <ShortTxCopy address={record.address} />,
    },
    {
      title: 'Type',
      key: 'type',
      render: (_: string, record: AccountBill) => {
        return <Box>{formatTxType(record.txType)}</Box>;
      },
    },
    {
      title: 'Time',
      key: 'timestamp',
      render: (_: string, record: AccountBill) => {
        return <Box>{formatTime(record.timestamp)}</Box>;
      },
    },
    {
      title: 'Total Cost',
      key: 'totalCost',
      render: (_: string, record: AccountBill) => (
        <Flex flexDirection={'column'} justifyContent={'flex-end'}>
          <Text fontSize={14}>
            {record.totalCost} {displayTokenSymbol()}
          </Text>
          <Text color={'readable.tertiary'} fontSize={12}>
            (
            {currencyFormatter(
              BN(record.totalCost || 0)
                .times(BN(exchangeRate))
                .toString(),
            )}
            )
          </Text>
        </Flex>
      ),
    },
  ];
  const empty = !pageData.length;
  const renderEmpty = useCallback(
    () => (
      <ListEmpty
        type="empty-billing"
        title="No Billing History"
        desc="There are no billing records at the moment."
        empty={empty}
        h={274}
      ></ListEmpty>
    ),
    [empty],
  );
  const loadingComponent = {
    spinning: accountBillListLoading,
    indicator: <Loading />,
  };

  const onPageChange = (page: number) => {
    const addQuery = { page };
    const newQuery = merge(query, addQuery);
    const url = router.pathname.replace('[address]', router.query.address as string);
    router.push(`${url}?${stringify(newQuery)}`, undefined, {
      scroll: false,
    });
  };

  useAsyncEffect(async () => {
    await dispatch(setupAccountBills(address));
  }, []);

  return (
    <>
      <AccountBillingHistoryFilter address={address} />
      <DCTable
        loading={loadingComponent}
        columns={columns}
        dataSource={pageData}
        current={accountBillListPage}
        total={accountBillsCount}
        pageSize={accountBillPageSize}
        showQuickJumper={true}
        pageChange={onPageChange}
        renderEmpty={renderEmpty}
      />
    </>
  );
};
