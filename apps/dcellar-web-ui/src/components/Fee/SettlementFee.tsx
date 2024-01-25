import { SettlementTips } from '@/modules/object/components/TotalFees/SettlementTips';
import { renderFeeValue } from '@/modules/object/utils';
import { useAppSelector } from '@/store';
import { TAccount } from '@/store/slices/accounts';
import { selectBnbPrice } from '@/store/slices/global';
import { Box, Flex, Text } from '@totejs/uikit';
import { BoxProps } from '@totejs/uikit';

export type SettlementFeeProps =  {
  amount: string;
};

export const SettlementFee = ({ amount }: SettlementFeeProps) => {
  const exchangeRate = useAppSelector(selectBnbPrice);
  return (
    <Flex w="100%" alignItems="center" justifyContent="space-between">
      <Flex alignItems="center">
        <Text color="readable.tertiary" as="p">
          Settlement fee
        </Text>
        <SettlementTips />
      </Flex>
      <Text color="readable.tertiary">{renderFeeValue(amount, exchangeRate)}</Text>
    </Flex>
  );
};
