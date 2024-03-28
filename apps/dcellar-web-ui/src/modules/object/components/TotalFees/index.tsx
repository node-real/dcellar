import { IconFont } from '@/components/IconFont';
import { GasFeeTips } from '@/modules/object/components/TotalFees/GasFeeTips';
import { renderBalanceNumber, renderFeeValue, renderUsd } from '@/modules/object/utils';
import { useAppSelector } from '@/store';
import {
  AccountEntity,
  selectAvailableBalance,
  selectPaymentAccounts,
} from '@/store/slices/accounts';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { Divider, Flex, Text, useDisclosure } from '@node-real/uikit';
import BigNumber from 'bignumber.js';
import { find } from 'lodash-es';
import { memo } from 'react';
import { PrePaidTips } from './PrepaidTips';
import { SettlementTips } from './SettlementTips';

interface TotalFeesProps {
  gasFee: string | number;
  prepaidFee: string;
  settlementFee: string;
  payStoreFeeAddress: string;
  refund?: boolean;
  expandable?: boolean;
  expand?: boolean;
}

// TODO refactor
export const TotalFees = memo<TotalFeesProps>(function TotalFeesItem(props) {
  const {
    gasFee,
    prepaidFee,
    settlementFee,
    payStoreFeeAddress = '',
    refund = false,
    expandable = true,
    expand = true,
  } = props;
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);

  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);
  const { isOpen: isOpenFees, onToggle: onToggleFees } = useDisclosure({ defaultIsOpen: expand });
  const bankBalance = useAppSelector(selectAvailableBalance(loginAccount));
  const staticBalance = useAppSelector(selectAvailableBalance(payStoreFeeAddress));
  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));

  const paymentAccount = find<AccountEntity>(
    paymentAccounts,
    (a) => a.address === payStoreFeeAddress,
  );
  const str = payStoreFeeAddress.substring(38);
  const paymentLabel = paymentAccount && `${paymentAccount.name} (${str}) balance:`;

  return (
    <Flex
      gap={8}
      padding={'8px 12px'}
      borderRadius={4}
      w="100%"
      bg="bg.bottom"
      flexDirection="column"
    >
      <Flex
        fontSize={'14px'}
        fontWeight={600}
        onClick={() => expandable && onToggleFees()}
        justifyContent={'space-between'}
        alignItems={'center'}
        cursor={expandable ? 'pointer' : 'default'}
      >
        <Text>Total Fees</Text>
        <Flex
          color={'readable.secondary'}
          alignItems="center"
          gap={4}
          justifySelf={'flex-end'}
          fontWeight={'400'}
        >
          {renderFeeValue(
            BigNumber(gasFee).plus(BigNumber(prepaidFee)).plus(settlementFee).toString(),
            exchangeRate,
          )}
          {expandable && (
            <IconFont
              color={'readable.normal'}
              type={isOpenFees ? 'menu-open' : 'menu-close'}
              w={20}
            />
          )}
        </Flex>
      </Flex>
      {isOpenFees && <Divider borderColor={'readable.disable'} />}
      {isOpenFees && (
        <>
          <Flex w="100%" alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <Text color="readable.tertiary" as="p">
                {refund ? 'Prepaid fee refund' : 'Prepaid fee'}
              </Text>
              <PrePaidTips />
            </Flex>
            <Text color="readable.tertiary">
              {refund && (
                <Text as="span" color={'#EEBE11'} mr={4}>
                  Refund
                </Text>
              )}
              {renderFeeValue(prepaidFee, exchangeRate)}
            </Text>
          </Flex>

          <Flex w="100%" alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <Text color="readable.tertiary" as="p">
                Settlement fee
              </Text>
              <SettlementTips />
            </Flex>
            <Text color="readable.tertiary">{renderFeeValue(settlementFee, exchangeRate)}</Text>
          </Flex>
          {paymentAccount && (
            <Flex w="100%" alignItems="center" justifyContent="space-between">
              <Flex alignItems="center" />
              <Text fontSize={12} color="readable.disable">
                {paymentLabel} {renderBalanceNumber(staticBalance || '0')} (
                {renderUsd(staticBalance || '0', exchangeRate)})
              </Text>
            </Flex>
          )}

          {+gasFee !== 0 && (
            <Flex w="100%" alignItems="center" justifyContent="space-between">
              <Flex alignItems="center">
                <Text color="readable.tertiary" as="p">
                  Gas fee
                </Text>
                <GasFeeTips />
              </Flex>
              <Text color="readable.tertiary">{renderFeeValue(String(gasFee), exchangeRate)}</Text>
            </Flex>
          )}
          <Text fontSize={12} lineHeight="16px" color="readable.disabled" alignSelf="flex-end">
            Owner Account balance: {renderBalanceNumber(bankBalance || '0')} (
            {renderUsd(bankBalance || '0', exchangeRate)})
          </Text>
        </>
      )}
    </Flex>
  );
});
