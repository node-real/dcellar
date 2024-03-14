import { IconFont } from '@/components/IconFont';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  FIAT_CURRENCY_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { useAppSelector } from '@/store';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { displayTokenSymbol, getNumInDigits } from '@/utils/wallet';
import { Circle, Flex, Text } from '@node-real/uikit';
import { memo } from 'react';

interface BalanceAmountProps {}

export const BalanceAmount = memo<BalanceAmountProps>(function BalanceAmount() {
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);

  const renderBalanceNumber = () => {
    if (Number(bankBalance) < 0) return 'Fetching balance...';
    return `${getNumInDigits(
      bankBalance,
      CRYPTOCURRENCY_DISPLAY_PRECISION,
    )} ${displayTokenSymbol()}`;
  };

  const renderUsd = () => {
    if (Number(exchangeRate) <= 0) return '';
    const numberInUsd = Number(bankBalance) * Number(exchangeRate);
    return `≈ $${getNumInDigits(numberInUsd, FIAT_CURRENCY_DISPLAY_PRECISION, true)}`;
  };

  return (
    <Flex w="100%" flexDirection={'column'} marginBottom={16}>
      <Flex alignItems="center" mt="4px" flexDirection={'column'} gap={8} flexWrap="wrap">
        <Flex
          color="readable.normal"
          fontWeight="700"
          fontSize="24px"
          mr="8px"
          alignItems={'center'}
        >
          <Circle backgroundColor={'#F0B90B'} size="24px" marginRight={10}>
            <IconFont color={'#fff'} type="bsc" />
          </Circle>{' '}
          {renderBalanceNumber()}
        </Flex>
        <Text color="readable.disabled" fontWeight="400" fontSize="12px">
          {renderUsd()}
        </Text>
      </Flex>
    </Flex>
  );
});
