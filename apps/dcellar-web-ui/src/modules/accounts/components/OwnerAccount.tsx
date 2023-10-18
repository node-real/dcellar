import { Box, Flex, Text } from '@totejs/uikit';
import { ColumnProps } from 'antd/es/table';
import React from 'react';
import { DCTable } from '@/components/common/DCTable';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAccountOperation, TAccountDetail } from '@/store/slices/accounts';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { CopyText } from '@/components/common/CopyText';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { DCLink } from '@/components/common/DCLink';
import { MenuOption } from '@/components/common/DCMenuList';
import { displayTokenSymbol, getShortenWalletAddress } from '@/utils/wallet';
import { BN } from '@/utils/math';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  DECIMAL_NUMBER,
} from '@/modules/wallet/constants';
import { currencyFormatter } from '@/utils/formatter';
import { selectBnbPrice } from '@/store/slices/global';
import { trimFloatZero } from '@/utils/string';
import { isEmpty } from 'lodash-es';
import { Loading } from '@/components/common/Loading';

const actions: MenuOption[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' },
  { label: 'Send', value: 'send' },
];

export const OwnerAccount = () => {
  const dispatch = useAppDispatch();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { ownerAccount } = useAppSelector((root) => root.accounts);
  const { accountDetails, bankBalance } = useAppSelector((root) => root.accounts);

  const data = ownerAccount?.address ? [accountDetails[ownerAccount.address] || {}] : [];
  const router = useRouter();

  const spinning = isEmpty(ownerAccount);
  const loadingComponent = {
    spinning: spinning,
    indicator: <Loading />,
  };
  const onMenuClick = (e: string, record: TAccountDetail) => {
    switch (e) {
      case 'detail':
        return dispatch(setAccountOperation([record.address, 'oaDetail']));
      default:
        return router.push(`/wallet?type=${e}`);
    }
  };

  const columns: ColumnProps<TAccountDetail>[] = [
    {
      title: 'Name',
      key: 'name',
      render: (_: string, record: TAccountDetail) => {
        return <Box>{record.name}</Box>;
      },
    },
    {
      title: 'Account Address',
      key: 'address',
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
      title: 'Balance',
      key: 'bankBalance',
      render: (_: string, record: TAccountDetail) => {
        return (
          <Flex flexWrap={'wrap'}>
            <Text fontSize={14} fontWeight={500}>
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
      title: 'Flow Rate',
      key: 'netflowRate',
      render: (_: string, record: TAccountDetail) => {
        const value = BN(record?.netflowRate || 0)
          .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
          .toString();

        return (
          <Text fontSize={14} fontWeight={500}>
            {value === '0' ? '≈ ' : ''}
            {trimFloatZero(value)}{' '}
            {displayTokenSymbol()}/s
          </Text>
        );
      },
    },
    {
      title: <Text textAlign={'center'}>Operation</Text>,
      key: 'Operation',
      width: 200,
      render: (_: string, record: TAccountDetail) => {
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
      <Box as="h3" fontSize={16} fontWeight={600} marginBottom={16}>
        Owner Account
      </Box>
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
        onRow={(record: TAccountDetail) => ({
          onClick: () => onMenuClick('detail', record),
        })}
      ></DCTable>
    </Container>
  );
};

const Container = styled(Box)`
  margin-bottom: 32px;

  .dc-table {
    overflow: hidden;
  }

  .ant-table-wrapper .ant-table-tbody > tr > td {
    border-bottom: none;
  }
`;
