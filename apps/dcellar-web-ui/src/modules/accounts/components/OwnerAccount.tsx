import { Box, Flex, Text, useMediaQuery } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React from 'react';
import { DCTable } from '@/components/common/DCTable';
import { useAppSelector } from '@/store';
import { TAccountInfo } from '@/store/slices/accounts';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { MenuOption } from '@/components/common/DCMenuList';
import { displayTokenSymbol } from '@/utils/wallet';
import { BN } from '@/utils/math';
import { CRYPTOCURRENCY_DISPLAY_PRECISION, DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { currencyFormatter } from '@/utils/formatter';
import { selectBnbPrice } from '@/store/slices/global';
import { trimFloatZero } from '@/utils/string';
import { isEmpty } from 'lodash-es';
import { Loading } from '@/components/common/Loading';
import { ShortTxCopy } from './Common';

const actions: MenuOption[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' },
  { label: 'Send', value: 'send' },
];

export const OwnerAccount = () => {
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { ownerAccount } = useAppSelector((root) => root.accounts);
  const [isLessThan1100] = useMediaQuery('(max-width: 1100px)');
  const { accountInfo, bankBalance } = useAppSelector((root) => root.accounts);

  const data = ownerAccount?.address ? [accountInfo[ownerAccount.address] || {}] : [];
  const router = useRouter();

  const spinning = isEmpty(ownerAccount);
  const loadingComponent = {
    spinning: spinning,
    indicator: <Loading />,
  };
  const onMenuClick = (e: string, record: TAccountInfo) => {
    switch (e) {
      case 'detail':
        // return dispatch(setAccountOperation([record.address, 'oaDetail']));
        return router.push(`/accounts/${record.address}`);
      default:
        return router.push(`/wallet?type=${e}`);
    }
  };

  const columns: ColumnProps<TAccountInfo>[] = [
    {
      title: 'Name',
      key: 'name',
      render: (_: string, record: TAccountInfo) => {
        return <Text>{record.name}</Text>;
      },
    },
    {
      title: 'Account Address',
      key: 'address',
      width: isLessThan1100 ? 130 : 'auto',
      render: (_: string, record: TAccountInfo) => (<ShortTxCopy address={record.address}/>),
    },
    {
      title: 'Balance',
      key: 'bankBalance',
      render: (_: string, record: TAccountInfo) => {
        return (
          <Flex flexWrap={'wrap'} alignItems={'center'}>
            <Text fontSize={14}>
              {BN(bankBalance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString()}{' '}
              {displayTokenSymbol()}
            </Text>
            <Text color="readable.tertiary" fontSize={12}>
              &nbsp;(
              {currencyFormatter(BN(bankBalance).times(BN(bnbPrice)).toString(DECIMAL_NUMBER))})
            </Text>
          </Flex>
        );
      },
    },
    {
      title: 'Prepaid Fee',
      key: 'bufferBalance',
      render: (_: string, record: TAccountInfo) => {
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
      render: (_: string, record: TAccountInfo) => {
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
      render: (_: string, record: TAccountInfo) => {
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
        onRow={(record: TAccountInfo) => ({
          onClick: () => onMenuClick('detail', record),
        })}
      ></DCTable>
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
