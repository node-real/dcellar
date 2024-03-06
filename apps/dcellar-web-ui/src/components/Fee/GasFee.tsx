import { renderFeeValue } from '@/modules/object/utils';
import { useAppSelector } from '@/store';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { Flex, Text } from '@node-real/uikit';

export const GasFee = ({ amount }: { amount: string }) => {
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);

  return (
    <Flex w="100%" alignItems="center" justifyContent="space-between">
      <Flex alignItems="center">
        <Text color="readable.tertiary" as="p">
          Gas fee
        </Text>
      </Flex>
      <Text color="readable.tertiary">{renderFeeValue(String(amount), exchangeRate)}</Text>
    </Flex>
  );
};
