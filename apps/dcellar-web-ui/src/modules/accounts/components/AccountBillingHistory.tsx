import { DCTable } from '@/components/common/DCTable';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { Box, Flex, Text } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React, { useCallback } from 'react';
import { BillingHistoryFilter } from './BillingHistoryFilter';
import { selectAccountBills, selectAccountBillsCount, setAccountBills, setCurrentAccountBillsPage, setupAccountBills } from '@/store/slices/billing';
import { useAsyncEffect } from 'ahooks';
import { formatTime } from '@/utils/time';
import { displayTokenSymbol, getShortenWalletAddress } from '@/utils/wallet';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { updateAccountBillsPageSize } from '@/store/slices/persist';
import { Loading } from '@/components/common/Loading';

type Props = {
  address: string;
};
export const AccountBillingHistory = ({ address }: Props) => {
  const dispatch = useAppDispatch();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const accountBills = useAppSelector(selectAccountBills(address));
  const accountBillsCount = useAppSelector(selectAccountBillsCount(address));
  const { accountInfo } = useAppSelector((root) => root.accounts);
  const { curAccountBillsPage, loadingAccountBills } = useAppSelector((root) => root.billing);
  const { accountBillsPageSize } = useAppSelector((root) => root.persist);
  const pages = Math.ceil(!accountBillsPageSize ? 0 : accountBillsCount/accountBillsPageSize);
  const current = curAccountBillsPage >= pages ? 0 : curAccountBillsPage;
  const page = accountBills;
  const canNext = current < pages - 1;
  const canPrev = current > 0;
  useAsyncEffect(async () => {
    const params = {
      address,
      per_page: accountBillsPageSize,
      page: curAccountBillsPage,
    };
    await dispatch(setupAccountBills(params));
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
      render: (_: string, record: any) => (
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
      ),
    },
  ];
  const empty = !page.length;
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
      dispatch(setCurrentAccountBillsPage(curAccountBillsPage + (next ? 1 : -1)));
      const params = {
        address,
        page: curAccountBillsPage + (next ? 1 : -1),
        per_page: pageSize,
      }
      dispatch(setupAccountBills(params))
      return;
    }
    dispatch(setCurrentAccountBillsPage(0));
    dispatch(updateAccountBillsPageSize(pageSize));
  };
  const spinning = loadingAccountBills;
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
      pageSize={accountBillsPageSize}
      pageChange={onPageChange}
      renderEmpty={renderEmpty}
    />
  );
};
