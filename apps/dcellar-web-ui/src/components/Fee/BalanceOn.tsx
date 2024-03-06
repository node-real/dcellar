import { useAppSelector } from '@/store';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { renderFee } from '@/utils/common';
import { Text, TextProps } from '@node-real/uikit';

type BalanceOnProps = TextProps & {
  amount: string;
};

export const BalanceOn = ({ amount, ...restProps }: BalanceOnProps) => {
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);

  return (
    <Text color={'readable.tertiary'} fontSize={12} textAlign={'right'} mt={8} {...restProps}>
      Balance on Greenfield: {renderFee(amount, exchangeRate)}
    </Text>
  );
};
