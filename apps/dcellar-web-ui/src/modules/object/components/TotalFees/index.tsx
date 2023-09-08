import { memo } from 'react';
import { Flex, Link, Text, useDisclosure } from '@totejs/uikit';
import { renderBalanceNumber, renderFeeValue, renderUsd } from '@/modules/file/utils';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { MenuCloseIcon } from '@totejs/icons';
import BigNumber from 'bignumber.js';
import { selectAvailableBalance } from '@/store/slices/accounts';
import { GAS_FEE_DOC } from '@/modules/file/constant';
import { PrePaidTips } from './PrepaidTips';
import { SettlementTips } from './SettlementTips';

interface TotalFeesProps {
  gasFee: string | number;
  prepaidFee: string;
  settlementFee: string;
  payStoreFeeAddress: string;
}

export const TotalFees = memo<TotalFeesProps>(function TotalFeesItem(props) {
  const { gasFee, prepaidFee, settlementFee, payStoreFeeAddress } = props;
  const exchangeRate = useAppSelector(selectBnbPrice);
  const { isOpen: isOpenFees, onToggle: onToggleFees } = useDisclosure({defaultIsOpen: true});
  const availableBalance = useAppSelector(selectAvailableBalance(payStoreFeeAddress));

  return (
    <Flex gap={8} padding={'8px 12px'} borderRadius={4} w="100%" bg="bg.secondary" flexDirection="column">
      <Flex
        fontSize={'14px'}
        fontWeight={600}
        onClick={onToggleFees}
        justifyContent={'space-between'}
        alignItems={'center'}
        cursor={'pointer'}
      >
        <Text>Total Fees</Text>
        <Text justifySelf={'flex-end'} fontWeight={'normal'}>
          {renderFeeValue(
            BigNumber(gasFee).plus(BigNumber(prepaidFee)).plus(settlementFee).toString(),
            exchangeRate,
          )}
          <MenuCloseIcon
            sx={{
              transform: isOpenFees ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Text>
      </Flex>
      {isOpenFees && (
        <>
          <Flex h={18} w="100%" alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <Text
                fontSize={14}
                lineHeight="28px"
                fontWeight={400}
                color="readable.tertiary"
                as="p"
              >
                Prepaid fee
              </Text>
              <PrePaidTips />
            </Flex>
            <Text fontSize={14} lineHeight="28px" fontWeight={400} color="readable.tertiary">
              {renderFeeValue(prepaidFee, exchangeRate)}
            </Text>
          </Flex>
          <Flex h={18} w="100%" alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <Text
                fontSize={14}
                lineHeight="28px"
                fontWeight={400}
                color="readable.tertiary"
                as="p"
              >
                Settlement fee
              </Text>
              <SettlementTips />
            </Flex>
            <Text fontSize={14} lineHeight="28px" fontWeight={400} color="readable.tertiary">
              {renderFeeValue(settlementFee, exchangeRate)}
            </Text>
          </Flex>
          <Flex h={18} w="100%" alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <Text
                fontSize={14}
                lineHeight="28px"
                fontWeight={400}
                color="readable.tertiary"
                as="p"
              >
                Gas fee (
                <Link
                  href={GAS_FEE_DOC}
                  textDecoration={'underline'}
                  color="readable.disabled"
                  target="_blank"
                >
                  Pay by Owner Account
                </Link>
                )
              </Text>
            </Flex>
            <Text fontSize={14} lineHeight="28px" fontWeight={400} color="readable.tertiary">
              {renderFeeValue(String(gasFee), exchangeRate)}
            </Text>
          </Flex>
          <Text fontSize={12} lineHeight="16px" color="readable.disabled" alignSelf="flex-end">
            Available balance: {renderBalanceNumber(availableBalance || '0')} (
            {renderUsd(availableBalance || '0', exchangeRate)})
          </Text>
        </>
      )}
    </Flex>
  );
});
