import { memo } from 'react';
import { Flex, Text } from '@totejs/uikit';
import { renderBalanceNumber, renderFeeValue, renderUsd } from '@/modules/file/utils';
import { useAppSelector } from '@/store';
import { selectBalance, selectBnbPrice } from '@/store/slices/global';
import { useLogin } from '@/hooks/useLogin';

interface GasFeeItemProps {
  label?: string;
  gasFee: string;
}

export const GasFeeItem = memo<GasFeeItemProps>(function GasFeeItem(props) {
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { loginState } = useLogin();
  const address = loginState?.address;
  const { availableBalance } = useAppSelector(selectBalance(address));
  const exchangeRate = Number(bnbPrice);
  const { label = 'Gas Fee', gasFee } = props;

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
    </>
  );
});
