import { IconFont } from '@/components/IconFont';
import { EllipsisText } from '@/components/common/EllipsisText';
import { InternalRoutePaths } from '@/constants/paths';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { useAppSelector } from '@/store';
import { AccountEntity, selectPaymentAccounts } from '@/store/slices/accounts';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { displayTokenSymbol } from '@/utils/wallet';
import styled from '@emotion/styled';
import { Box, Button, Circle, Divider, Flex, Text } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Card, CardProps } from './Common';
import { TotalBalanceTips } from './TotalBalanceTips';

const FeeOptions: {
  id: 'totalPrepaidFee' | 'totalNetflowRate';
  label: string;
  symbol: string;
}[] = [
  {
    id: 'totalPrepaidFee',
    label: 'Total prepaid fee',
    symbol: displayTokenSymbol(),
  },
  {
    id: 'totalNetflowRate',
    label: 'Total flow rate',
    symbol: displayTokenSymbol() + '/s',
  },
];

type TotalBalanceProps = CardProps;

export const TotalBalance = ({ children, ...restProps }: TotalBalanceProps) => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const accountRecords = useAppSelector((root) => root.accounts.accountRecords);
  const paymentAccountListRecords = useAppSelector(
    (root) => root.accounts.paymentAccountListRecords,
  );

  const router = useRouter();
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);
  const paymentList = useAppSelector(selectPaymentAccounts(loginAccount));

  const isLoading =
    bankBalance === '' || isEmpty(accountRecords) || isEmpty(paymentAccountListRecords);

  const res = useMemo(() => {
    const ownerInfo = accountRecords[loginAccount] || {};
    const ownerTotalBalance = BN(ownerInfo.staticBalance).plus(bankBalance);
    const ownerNetflowRate = BN(ownerInfo.netflowRate);
    const ownerPrepaidFee = BN(ownerInfo.bufferBalance);
    let paymentTotalNetflow = BN(0);
    let paymentTotalBalance = BN(0);
    let paymentTotalPrepaidFee = BN(0);
    paymentList.forEach((item: AccountEntity) => {
      const paymentDetail = accountRecords[item.address];
      paymentTotalNetflow = paymentTotalNetflow.plus(paymentDetail.netflowRate);

      paymentTotalBalance = paymentTotalBalance.plus(paymentDetail.staticBalance);
      paymentTotalPrepaidFee = paymentTotalPrepaidFee.plus(paymentDetail.bufferBalance);
    });

    const totalBalance = ownerTotalBalance.plus(paymentTotalBalance);
    const totalNetflowRate = ownerNetflowRate.plus(paymentTotalNetflow);
    const totalPrepaidFee = ownerPrepaidFee.plus(paymentTotalPrepaidFee);

    return {
      totalBalance: totalBalance.dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString(),
      totalNetflowRate: totalNetflowRate.dp(18).toString(),
      totalPrepaidFee: totalPrepaidFee.dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString(),
    };
  }, [accountRecords, bankBalance, loginAccount, paymentList]);

  const onNavigate = (target: string) => () => {
    router.push(target);
  };

  return (
    <Card w={374} {...restProps}>
      <Flex>
        <Text fontWeight={600} fontSize={16}>
          Total Balance
        </Text>
        <TotalBalanceTips />
      </Flex>
      <Box>
        <Flex gap={4} fontSize={32} fontWeight={500} mb={8}>
          <EllipsisText>{isLoading ? '--' : res.totalBalance}</EllipsisText>
          <Text>{displayTokenSymbol()}</Text>
        </Flex>
        <Flex gap={4} color={'readable.disable'}>
          <EllipsisText>
            {isLoading
              ? '--'
              : currencyFormatter(BN(res.totalBalance).times(exchangeRate).toString())}
          </EllipsisText>
          <Text>USD</Text>
        </Flex>
      </Box>
      {FeeOptions.map((item, index) => (
        <Flex key={index} justifyContent={'space-between'} fontSize={12} fontWeight={500}>
          <Text color={'readable.tertiary'}>{item.label}</Text>
          <Text>
            {isLoading ? '--' : res[item.id]} {item.symbol}
          </Text>
        </Flex>
      ))}
      <Divider />
      <Flex alignItems="center" width="100%" justifyContent="space-between">
        <ActionButton
          data-track-id="dc.main.account.transferin.click"
          variant="ghost"
          onClick={onNavigate(InternalRoutePaths.transfer_in)}
        >
          <StyledIcon>
            <IconFont type="in" />
          </StyledIcon>
          <Box fontWeight={500} fontSize="14px" marginTop={8}>
            Transfer In
          </Box>
        </ActionButton>
        <ActionButton
          data-track-id="dc.main.account.transferout.click"
          variant="ghost"
          onClick={onNavigate(InternalRoutePaths.transfer_out)}
        >
          <StyledIcon>
            <IconFont type="out" />
          </StyledIcon>
          <Box fontWeight={500} fontSize="14px" marginTop={8}>
            Transfer Out
          </Box>
        </ActionButton>
        <ActionButton
          data-track-id="dc.main.account.send.click"
          variant="ghost"
          onClick={onNavigate(InternalRoutePaths.send)}
        >
          <StyledIcon>
            <IconFont type="send" />
          </StyledIcon>
          <Box fontWeight={500} fontSize="14px" marginTop={8}>
            Send
          </Box>
        </ActionButton>
      </Flex>
    </Card>
  );
};

const StyledIcon = styled(Circle)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--ui-colors-readable-border);
  background: var(--ui-colors-brand-normal);
  color: #ffffff;
  font-size: 20px;
`;

const ActionButton = styled(Button)`
  height: 81px;
  width: 97px;
  padding: 0;
  border-radius: 4px;
  border: none;
  flex-direction: column;
  place-items: center;

  :hover {
    background: #f5f5f5;
  }
`;
