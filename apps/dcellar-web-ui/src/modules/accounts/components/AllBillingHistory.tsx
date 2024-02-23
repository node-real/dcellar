import { DCTable } from '@/components/common/DCTable';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { Loading } from '@/components/common/Loading';
import { InternalRoutePaths } from '@/constants/paths';
import { useAppSelector } from '@/store';
import { TAccountInfo } from '@/store/slices/accounts';
import { AccountBill, selectAllBills, selectAllBillsCount } from '@/store/slices/billing';
import { selectBnbPrice } from '@/store/slices/global';
import { formatTxType } from '@/utils/billing';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { formatTime } from '@/utils/time';
import { displayTokenSymbol, getShortenWalletAddress } from '@/utils/wallet';
import { Box, Flex, Text } from '@node-real/uikit';
import { ColumnProps } from 'antd/es/table';
import { merge } from 'lodash-es';
import { useRouter } from 'next/router';
import { stringify } from 'querystring';
import { useCallback, useMemo } from 'react';
import { AllBillingHistoryFilter } from './AllBillingHistoryFilter';
import { ShortTxCopy } from './Common';

export const AllBillingHistory = () => {
  const router = useRouter();
  const { query } = router;
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { curAllBillsPage, loadingAllBills } = useAppSelector((root) => root.billing);
  const { allBillsPageSize } = useAppSelector((root) => root.persist);
  const allBills = useAppSelector(selectAllBills());
  const allBillsCount = useAppSelector(selectAllBillsCount());
  const { accountInfo } = useAppSelector((root) => root.accounts);
  const pageData = allBills;
  const lowerKeyAccountInfo = useMemo(() => {
    const newInfo: Record<string, TAccountInfo> = {};
    Object.entries(accountInfo).forEach(([key, value]) => {
      newInfo[key.toLowerCase()] = value;
    });
    return newInfo;
  }, [accountInfo]);

  const columns: ColumnProps<any>[] = [
    {
      title: 'Transaction Hash',
      key: 'tx',
      render: (_: string, record: AccountBill) => <ShortTxCopy address={record.txHash} />,
    },
    {
      title: 'Account',
      key: 'address',
      render: (_: string, record: AccountBill) => {
        return (
          <Box>
            <Text display={'inline-block'}>{lowerKeyAccountInfo[record.address]?.name}</Text>
            &nbsp;
            <Text color="readable.tertiary" display={'inline-block'} fontSize={12}>
              ({getShortenWalletAddress(record.address)})
            </Text>
          </Box>
        );
      },
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
      render: (_: string, record: AccountBill) => {
        return (
          <Flex flexDirection={'column'} justifyContent={'flex-end'}>
            <Text fontSize={14}>
              {record.totalCost} {displayTokenSymbol()}
            </Text>
            <Text color={'readable.tertiary'} fontSize={12}>
              (
              {currencyFormatter(
                BN(record.totalCost || 0)
                  .times(BN(bnbPrice))
                  .toString(),
              )}
              )
            </Text>
          </Flex>
        );
      },
    },
  ];
  const empty = !allBills.length;
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
  const onPageChange = (page: number) => {
    const addQuery = { page };
    const newQuery = merge(query, addQuery);
    router.push(`${InternalRoutePaths.accounts}?${stringify(newQuery)}`, undefined, {
      scroll: false,
    });
  };
  const spinning = loadingAllBills;
  const loadingComponent = {
    spinning: spinning,
    indicator: <Loading />,
  };

  return (
    <>
      <AllBillingHistoryFilter />
      <DCTable
        loading={loadingComponent}
        columns={columns}
        dataSource={pageData}
        current={curAllBillsPage}
        total={allBillsCount}
        pageSize={allBillsPageSize}
        showQuickJumper={true}
        pageChange={onPageChange}
        renderEmpty={renderEmpty}
      />
    </>
  );
};
