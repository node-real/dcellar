import { memo } from 'react';
import { Flex, Link, Text, useDisclosure } from '@totejs/uikit';
import { renderBalanceNumber, renderFeeValue, renderUsd } from '@/modules/file/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBnbPrice, setupTmpAvailableBalance } from '@/store/slices/global';
import { selectBalance } from '@/store/slices/balance';
import { useMount } from 'ahooks';
import { GAS_FEE_DOC } from '../constant';
import { MenuCloseIcon } from '@totejs/icons';
import BigNumber from 'bignumber.js';

interface GasFeeItemProps {
  label?: string;
  gasFee: string;
  lockFee: string;
}

export const Fees = memo<GasFeeItemProps>(function GasFeeItem(props) {
  const { isOpen: isOpenFees, onToggle: onToggleFees } = useDisclosure();
  const exchangeRate = useAppSelector(selectBnbPrice);
  const dispatch = useAppDispatch();
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { bankBalance: availableBalance } = useAppSelector((root) => root.accounts);
  const { label = 'Gas Fee', gasFee, lockFee } = props;
  useMount(() => {
    dispatch(setupTmpAvailableBalance(address));
  });

  return (
    <>
      <Flex
        gap={4}
        padding={16}
        borderRadius={12}
        // mt={32}
        w="100%"
        bg="bg.secondary"
        flexDirection="column"
      >
        <Flex
          paddingBottom={'4px'}
          fontSize={'14px'}
          fontWeight={600}
          onClick={onToggleFees}
          justifyContent={'space-between'}
          alignItems={'center'}
          cursor={'pointer'}
        >
          <Text>Total Fees</Text>
          <Text justifySelf={'flex-end'} fontWeight={'normal'}>
            {renderFeeValue(BigNumber(gasFee).plus(BigNumber(lockFee)).toString(), exchangeRate)}
            <MenuCloseIcon
              sx={{
                transform: isOpenFees ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </Text>
        </Flex>
        {isOpenFees && (
          <>
            <Flex w="100%" alignItems="center" justifyContent="space-between">
              <Flex alignItems="center" mb={4}>
                <Text
                  fontSize={14}
                  lineHeight="28px"
                  fontWeight={400}
                  color="readable.tertiary"
                  as="p"
                >
                  {label} (
                  <Link href={GAS_FEE_DOC} textDecoration={'underline'} color="readable.disabled">
                    Pay by Owner Account
                  </Link>
                  )
                </Text>
              </Flex>
              <Text fontSize={14} lineHeight="28px" fontWeight={400} color="readable.tertiary">
                {renderFeeValue(gasFee, exchangeRate)}
              </Text>
            </Flex>
            <Flex w="100%" alignItems="center" justifyContent="space-between">
              <Flex alignItems="center" mb={4}>
                <Text
                  fontSize={14}
                  lineHeight="28px"
                  fontWeight={400}
                  color="readable.tertiary"
                  as="p"
                >
                  6 months prepaid fee
                </Text>
              </Flex>
              <Text fontSize={14} lineHeight="28px" fontWeight={400} color="readable.tertiary">
                {renderFeeValue(lockFee, exchangeRate)}
              </Text>
            </Flex>
            <Text fontSize={12} lineHeight="16px" color="readable.disabled" alignSelf="flex-end">
              Available balance: {renderBalanceNumber(availableBalance || '0')} (
              {renderUsd(availableBalance || '0', exchangeRate)})
            </Text>
          </>
        )}
      </Flex>
    </>
  );
});
