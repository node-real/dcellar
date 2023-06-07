import { memo, useContext } from 'react';
import { Flex, Text } from '@totejs/uikit';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
  renderUsd,
} from '@/modules/file/utils';
import { BnbPriceContext } from '@/context/GlobalContext/BnbPriceProvider';
import { useAvailableBalance } from '@/hooks/useAvailableBalance';

interface GasFeeItemProps {
  label?: string;
  gasFee: string;
  gaOptions?: { gaClickName: string; gaShowName: string };
}

export const GasFeeItem = memo<GasFeeItemProps>(function GasFeeItem(props) {
  const { value: bnbPrice } = useContext(BnbPriceContext);
  const { availableBalance } = useAvailableBalance();
  const exchangeRate = bnbPrice?.toNumber() ?? 0;
  const { label = 'Gas Fee', gasFee, gaOptions } = props;

  return (
    <>
      <Flex
        gap={4}
        padding={16}
        borderRadius={12}
        mt={32}
        w="100%"
        bg="bg.secondary"
        flexDirection="column"
      >
        <Flex w="100%" alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" mb={4}>
            <Text fontSize={14} lineHeight="28px" fontWeight={400} color="readable.tertiary" as="p">
              {label}
            </Text>
          </Flex>
          <Text fontSize={14} lineHeight="28px" fontWeight={400} color="readable.tertiary">
            {renderFeeValue(gasFee, exchangeRate)}
          </Text>
        </Flex>
        <Text fontSize={12} lineHeight="16px" color="readable.disabled" alignSelf="flex-end">
          Available balance: {renderBalanceNumber(availableBalance || '0')} (
          {renderUsd(availableBalance || '0', exchangeRate)})
        </Text>
      </Flex>
      <Flex w="100%" justifyContent="space-between" mt={8}>
        <Text fontSize={12} lineHeight="16px" color="scene.danger.normal">
          {renderInsufficientBalance(gasFee, '0', availableBalance || '0', gaOptions)}
        </Text>
      </Flex>
    </>
  );
});
