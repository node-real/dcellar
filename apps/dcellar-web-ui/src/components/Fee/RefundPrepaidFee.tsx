import { PrePaidTips } from '@/modules/object/components/TotalFees/PrepaidTips';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { renderFee } from '@/utils/common';
import { Flex, Text } from '@node-real/uikit';

export type RefundPrepaidFeeProps = {
  amount: string;
};

export const RefundPrepaidFee = ({ amount }: RefundPrepaidFeeProps) => {
  const exchangeRate = useAppSelector(selectBnbPrice);

  return (
    <Flex w="100%" alignItems="center" justifyContent="space-between">
      <Flex alignItems="center">
        <Text color="readable.tertiary" as="p">
          Prepaid fee refund
        </Text>
        <PrePaidTips />
      </Flex>
      <Text color="readable.tertiary">
        <Text as="span" color={'#EEBE11'} mr={4}>
          Refund
        </Text>
        {renderFee(amount, exchangeRate)}
      </Text>
    </Flex>
  );
};
