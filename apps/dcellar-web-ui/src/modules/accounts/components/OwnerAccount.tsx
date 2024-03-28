import { MenuOption } from '@/components/common/DCMenuList';
import { DCTable } from '@/components/common/DCTable';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { Loading } from '@/components/common/Loading';
import { CRYPTOCURRENCY_DISPLAY_PRECISION, DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { useAppSelector } from '@/store';
import { AccountInfo } from '@/store/slices/accounts';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { trimFloatZero } from '@/utils/string';
import { displayTokenSymbol } from '@/utils/wallet';
import styled from '@emotion/styled';
import { Box, Flex, Text, useMediaQuery } from '@node-real/uikit';
import { ColumnProps } from 'antd/es/table';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import { ShortTxCopy } from './Common';

const actions: MenuOption[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' },
  { label: 'Send', value: 'send' },
];

export const OwnerAccount = () => {
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);
  const ownerAccount = useAppSelector((root) => root.accounts.ownerAccount);
  const accountInfos = useAppSelector((root) => root.accounts.accountInfos);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const router = useRouter();
  const [isLessThan1100] = useMediaQuery('(max-width: 1100px)');

  const data = ownerAccount?.address ? [accountInfos[ownerAccount.address] || {}] : [];
  const spinning = isEmpty(ownerAccount);

  const loadingComponent = {
    spinning: spinning,
    indicator: <Loading />,
  };

  const columns: ColumnProps<AccountInfo>[] = [
    {
      title: 'Name',
      key: 'name',
      render: (_: string, record: AccountInfo) => {
        return <Text>{record.name}</Text>;
      },
    },
    {
      title: 'Account Address',
      key: 'address',
      width: isLessThan1100 ? 130 : 'auto',
      render: (_: string, record: AccountInfo) => <ShortTxCopy address={record.address} />,
    },
    {
      title: 'Balance',
      key: 'bankBalance',
      render: (_: string, record: AccountInfo) => {
        return (
          <Flex flexWrap={'wrap'} alignItems={'center'}>
            <Text fontSize={14}>
              {BN(bankBalance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString()}{' '}
              {displayTokenSymbol()}
            </Text>
            <Text color="readable.tertiary" fontSize={12}>
              &nbsp;(
              {currencyFormatter(BN(bankBalance).times(BN(exchangeRate)).toString(DECIMAL_NUMBER))})
            </Text>
          </Flex>
        );
      },
    },
    {
      title: 'Prepaid Fee',
      key: 'bufferBalance',
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
      title: 'Flow Rate',
      key: 'netflowRate',
      render: (_: string, record: AccountInfo) => {
        const value = BN(record?.netflowRate || 0)
          .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
          .toString();

        return (
          <Text fontSize={14} fontWeight={500}>
            {value === '0' ? '≈ ' : ''}
            {trimFloatZero(value)} {displayTokenSymbol()}/s
          </Text>
        );
      },
    },
    {
      title: <Text textAlign={'center'}>Operation</Text>,
      key: 'Operation',
      width: 150,
      render: (_: string, record: AccountInfo) => {
        const operations = ['transfer_in', 'transfer_out', 'send'];
        return (
          <ActionMenu
            operations={operations}
            menus={actions}
            onChange={(e) => onMenuClick(e, record)}
          />
        );
      },
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));

  const onMenuClick = (e: string, record: AccountInfo) => {
    switch (e) {
      case 'detail':
        // return dispatch(setAccountOperation([record.address, 'oaDetail']));
        return router.push(`/accounts/${record.address}`);
      default:
        return router.push(`/wallet?type=${e}`);
    }
  };

  return (
    <Container>
      <DCTable
        rowKey="address"
        columns={columns}
        dataSource={data}
        canNext={false}
        canPrev={false}
        pageSize={10}
        pagination={false}
        loading={loadingComponent}
        renderEmpty={() => null}
        onRow={(record: AccountInfo) => ({
          onClick: () => onMenuClick('detail', record),
        })}
      />
    </Container>
  );
};

const Container = styled(Box)`
  .dc-table {
    overflow: hidden;
  }

  .ant-table-wrapper .ant-table-tbody > tr > td {
    border-bottom: none;
  }
`;
