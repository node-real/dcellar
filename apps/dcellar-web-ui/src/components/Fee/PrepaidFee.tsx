import { PrePaidTips } from '@/modules/object/components/TotalFees/PrepaidTips';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { renderFee } from '@/utils/common';
import { Flex, Text } from '@node-real/uikit';

export type PrepaidFeeProps = {
  amount: string;
};

export const PrepaidFee = ({ amount }: PrepaidFeeProps) => {
  const exchangeRate = useAppSelector(selectBnbPrice);

  return (
    <Flex w="100%" alignItems="center" justifyContent="space-between">
      <Flex alignItems="center">
        <Text color="readable.tertiary" as="p">
          Prepaid fee
        </Text>
        <PrePaidTips />
      </Flex>
      <Text color="readable.tertiary">{renderFee(amount, exchangeRate)}</Text>
    </Flex>
  );
};
