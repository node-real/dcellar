import { memo } from 'react';
import { Flex, Text } from '@totejs/uikit';
import { renderBalanceNumber, renderFeeValue, renderUsd } from '@/modules/file/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBnbPrice, setupTmpAvailableBalance } from '@/store/slices/global';
import { selectBalance } from '@/store/slices/balance';
import { useMount } from 'ahooks';

interface GasFeeItemProps {
  label?: string;
  gasFee: string;
}

export const GasFeeItem = memo<GasFeeItemProps>(function GasFeeItem(props) {
  const dispatch = useAppDispatch();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const exchangeRate = Number(bnbPrice);
  const { label = 'Gas Fee', gasFee } = props;

  useMount(() => {
    dispatch(setupTmpAvailableBalance(address));
  });

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
