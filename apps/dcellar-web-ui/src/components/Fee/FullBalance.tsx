import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { useAppSelector } from '@/store';
import { selectAccount } from '@/store/slices/accounts';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { renderFee } from '@/utils/common';
import { BN } from '@/utils/math';
import { Flex, Text } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { memo } from 'react';

interface FullBalanceProps {
  address: string;
}

export const FullBalance = memo<FullBalanceProps>(function FullBalance({ address }) {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const accountDetail = useAppSelector(selectAccount(address));
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);

  const isOwnerAccount = address === loginAccount;
  const balance = isOwnerAccount
    ? BN(accountDetail.staticBalance)
        .plus(bankBalance)
        .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
        .toString()
    : BN(accountDetail.staticBalance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();

  if (isEmpty(accountDetail)) return null;

  return (
    <Flex w="100%" alignItems="center" justifyContent="space-between">
      <Flex alignItems="center" />
      <Text fontSize={12} color="readable.disable">
        {`${accountDetail.name} balance: `}
        {renderFee(balance, exchangeRate)}
      </Text>
    </Flex>
  );
});
