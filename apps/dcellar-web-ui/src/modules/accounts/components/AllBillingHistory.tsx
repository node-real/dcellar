import { DCTable } from '@/components/common/DCTable';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { Box, Flex, Text } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React, { useCallback } from 'react';
import { BillingHistoryFilter } from './BillingHistoryFilter';
import { updateAllBillsPageSize } from '@/store/slices/persist';
import { selectAllBills, selectAllBillsCount, setCurrentAllBillsPage, setupAllBills } from '@/store/slices/billing';
import { useAsyncEffect } from 'ahooks';
import { displayTokenSymbol, getShortenWalletAddress } from '@/utils/wallet';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { Loading } from '@/components/common/Loading';
import { formatTime } from '@/utils/time';

export const AllBillingHistory = () => {
  const dispatch = useAppDispatch();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { curAllBillsPage, loadingAllBills } = useAppSelector((root) => root.billing);
  const { allBillsPageSize } = useAppSelector((root) => root.persist);
  const allBills = useAppSelector(selectAllBills(loginAccount));
  const allBillsCount = useAppSelector(selectAllBillsCount(loginAccount));
  const { accountInfo } = useAppSelector((root) => root.accounts);
  const pages = Math.ceil(!allBillsPageSize ? 0 : allBillsCount / allBillsPageSize);
  const current = curAllBillsPage >= pages ? 0 : curAllBillsPage;
  const page = allBills;
  const canNext = current < pages - 1;
  const canPrev = current > 0;
  useAsyncEffect(async () => {
    const params = {
      owner: loginAccount,
      per_page: allBillsPageSize,
      page: curAllBillsPage,
    };
    await dispatch(setupAllBills(params));
  }, []);

  const columns: ColumnProps<any>[] = [
    {
      title: 'Time',
      key: 'timestamp',
      render: (_: string, record: any) => {
        return <Box>{formatTime(record.timestamp)}</Box>;
      },
    },
    {
      title: 'Account',
      key: 'address',
      render: (_: string, record: any) => {
        return (
          <Box>
            <Text display={'inline-block'}>
              {accountInfo[record.address.toLowerCase()]?.name}
            </Text>
            &nbsp;
            <Text color="readable.tertiary" display={'inline-block'} fontSize={12}>
              ({getShortenWalletAddress(record.address)})
            </Text>
          </Box>
        );
      },
    },
    {
      title: 'Total Cost',
      key: 'totalCost',
      render: (_: string, record: any) => {
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
        type="empty-account"
        title="No Payment Accounts"
        desc="Create payment accounts to pay for storage and bandwidth. "
        empty={empty}
        h={274}
      >
        <BillingHistoryFilter />
      </ListEmpty>
    ),
    [empty],
  );
  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      const params = {
        owner: loginAccount,
        page: curAllBillsPage + (next ? 1 : -1),
        per_page: pageSize,
      };
      dispatch(setCurrentAllBillsPage(curAllBillsPage + (next ? 1 : -1)));
      dispatch(setupAllBills(params));
      return;
    }
    dispatch(setCurrentAllBillsPage(1));
    dispatch(updateAllBillsPageSize(pageSize));
  };
  const spinning = loadingAllBills;
  const loadingComponent = {
    spinning: spinning,
    indicator: <Loading />,
  };
  return (
    <DCTable
      loading={loadingComponent}
      columns={columns}
      dataSource={page}
      canNext={canNext}
      canPrev={canPrev}
      pageSize={allBillsPageSize}
      pageChange={onPageChange}
      renderEmpty={renderEmpty}
    />
  );
};
