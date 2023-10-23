import { Box, Divider, Flex, Text } from '@totejs/uikit';
import React, { memo, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { EOperation, TFeeData } from '../type';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  DECIMAL_NUMBER,
  FIAT_CURRENCY_DISPLAY_PRECISION,
  INIT_FEE_DATA,
} from '../constants';
import { Tips } from '@/components/common/Tips';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { SettlementTips } from '@/modules/object/components/TotalFees/SettlementTips';
import { currencyFormatter } from '@/utils/formatter';
import { renderFeeValue } from '@/modules/object/utils';
import { GasFeeTips } from '@/modules/object/components/TotalFees/GasFeeTips';
import { renderFee } from '@/utils/common';
import { displayTokenSymbol } from '@/utils/wallet';
import { isEmpty } from 'lodash-es';

const DefaultFee = {
  // TODO temp down limit fee
  transfer_in: 0.00008 + 0.002,
  transfer_out: 0.000006 + 0.001,
  send: 0.000006,
};
const DefaultGasRelayerFee = {
  // TODO temp down limit fee
  transfer_in: { gasFee: 0.00008, relayerFee: 0.002 },
  transfer_out: { gasFee: 0.000006, relayerFee: 0.001 },
  send: { gasFee: 0, relayerFee: 0 },
};

interface FeeProps {
  amount: string;
  showSettlement?: boolean;
  settlementFee?: string;
  feeData: TFeeData;
  isGasLoading: boolean;
  gaShowTipsName?: string;
  bankBalance?: string;
  staticBalance?: string;
}

export const Fee = memo<FeeProps>(function Fee({
  amount,
  showSettlement,
  settlementFee,
  isGasLoading,
  feeData = INIT_FEE_DATA,
  gaShowTipsName,
  bankBalance = '0',
  staticBalance = '0',
}) {
  const bnbPrice = useAppSelector(selectBnbPrice);
  const TOKEN_SYMBOL = displayTokenSymbol();
  const { fromAccount } = useAppSelector((root) => root.wallet);
  const { price: exchangeRate } = useAppSelector((root) => root.global.bnb);
  const { transType } = useAppSelector((root) => root.wallet);
  const { gasFee, relayerFee } = feeData;
  const defaultFee = DefaultFee[transType];
  const defaultGasRelayerFee = DefaultGasRelayerFee[transType];
  const totalFee = gasFee.plus(relayerFee);
  const isShowDefault = gasFee.toString() === '0' && relayerFee.toString() === '0';
  const feeUsdPrice = totalFee && totalFee.times(BigNumber(bnbPrice));
  const formatFeeUsdPrice =
    feeUsdPrice &&
    currencyFormatter(feeUsdPrice.dp(FIAT_CURRENCY_DISPLAY_PRECISION).toString(DECIMAL_NUMBER));

  const totalAmount = BigNumber(amount || 0)
    .plus(totalFee)
    .plus(settlementFee || '0')
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1);
  const totalUsdPrice = totalAmount.times(BigNumber(bnbPrice));
  const formatTotalUsdPrice =
    totalUsdPrice &&
    currencyFormatter(totalUsdPrice.dp(FIAT_CURRENCY_DISPLAY_PRECISION).toString(DECIMAL_NUMBER));

  // const TotalFeeContent = `${totalFee
  //   .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
  //   .toString(DECIMAL_NUMBER)} ${TOKEN_SYMBOL} (${formatFeeUsdPrice})`;

  //show defalut fee if cannot get fee data in 3000ms
  const defaultFeeUsdPrice = currencyFormatter(
    BigNumber(defaultFee)
      .times(BigNumber(bnbPrice))
      .dp(FIAT_CURRENCY_DISPLAY_PRECISION)
      .toString(DECIMAL_NUMBER),
  );
  const TotalFeeContent = useMemo(() => {
    let total = totalFee;
    if (isShowDefault) {
      total = BigNumber(defaultFee);
      return `~${total
        .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
        .toString(DECIMAL_NUMBER)} ${TOKEN_SYMBOL} (${defaultFeeUsdPrice})`;
    }
    return `${totalFee
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
      .toString(DECIMAL_NUMBER)} ${TOKEN_SYMBOL} (${formatFeeUsdPrice})`;
  }, [TOKEN_SYMBOL, defaultFee, formatFeeUsdPrice, isShowDefault, totalFee, defaultFeeUsdPrice]);
  const TotalAmountContent = `${totalAmount} ${TOKEN_SYMBOL} (${formatTotalUsdPrice})`;

  const TipContent = useMemo(() => {
    if (transType === EOperation.send) {
      return null;
    }
    return (
      <Box>
        <Text>
          Gas fee:{' '}
          {gasFee.toString() === '0'
            ? BigNumber(defaultGasRelayerFee.gasFee)
                .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
                .toString(DECIMAL_NUMBER)
            : gasFee.dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1).toString(DECIMAL_NUMBER)}{' '}
          {TOKEN_SYMBOL}
        </Text>
        <Text>
          Relayer fee:{' '}
          {gasFee.toString() === '0'
            ? BigNumber(defaultGasRelayerFee.relayerFee)
                .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
                .toString(DECIMAL_NUMBER)
            : relayerFee.dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1).toString()}{' '}
          {TOKEN_SYMBOL}
        </Text>
        <Text>
          BNB Gas fee covers the gas cost for sending your transfer on the destination chain.
        </Text>
        <Text>Relayer fee is paid to relayers for handling cross-chain packets.</Text>
      </Box>
    );
  }, [
    transType,
    gasFee,
    defaultGasRelayerFee.gasFee,
    defaultGasRelayerFee.relayerFee,
    TOKEN_SYMBOL,
    relayerFee,
  ]);

  const amountUsd = currencyFormatter(
    BigNumber(amount || 0)
      .times(bnbPrice)
      .dp(FIAT_CURRENCY_DISPLAY_PRECISION)
      .toString(DECIMAL_NUMBER),
  );

  const sendingAmount = `${amount} ${TOKEN_SYMBOL} (${amountUsd})`;
  const paymentAccount = fromAccount.address?.substring(38);
  const paymentLabel = `${fromAccount?.name} (${paymentAccount}) balance:`;
  const showPaymentAccountBalance =
    transType === 'send' && !isEmpty(fromAccount) && fromAccount.name.includes('Payment');

  return (
    <Flex
      gap={8}
      flexDirection={'column'}
      bg={'bg.bottom'}
      borderRadius={4}
      mb={24}
      padding={'8px 12px'}
    >
      <Flex justifyContent={'space-between'} fontWeight={600} color={'readable.normal'}>
        <Text>Total Amount</Text>
        <Text color={'readable.secondary'} fontWeight={500}>
          {isGasLoading ? '--' : TotalAmountContent}
        </Text>
      </Flex>
      <Divider borderColor={'readable.disable'} />
      {showSettlement && (
        <Flex justifyContent={'space-between'} color="readable.tertiary">
          <Flex justifyContent={'flex-start'} alignItems="center">
            <Text>Settlement Fee</Text> <SettlementTips />
          </Flex>
          <Text textAlign="right">
            {isGasLoading ? '--' : renderFeeValue(String(settlementFee), exchangeRate)}
          </Text>
        </Flex>
      )}
      <Flex color="readable.tertiary" justifyContent={'space-between'} alignItems={'center'}>
        <Flex justifyContent={'flex-start'}>
          <Text>{'Sending amount'}</Text>{' '}
        </Flex>
        <Text>{isGasLoading ? '--' : sendingAmount}</Text>
      </Flex>
      {showPaymentAccountBalance && (
        <Flex
          fontSize={12}
          color="readable.disable"
          justifyContent={'flex-end'}
          alignItems={'center'}
        >
          {paymentLabel} {renderFee(staticBalance, exchangeRate)}
        </Flex>
      )}
      <Flex color="readable.tertiary" justifyContent={'space-between'} alignItems={'center'}>
        <Flex>
          {transType !== 'send' && (
            <Flex justifyContent={'flex-start'}>
              <Text>{'Gas fee'}</Text>{' '}
              <Tips
                containerWidth={'308px'}
                tips={TipContent}
                placement="top"
                gaShowName={gaShowTipsName}
              />
            </Flex>
          )}
          {transType === 'send' && (
            <>
              <Text>Gas fee</Text>
              <GasFeeTips />
            </>
          )}
        </Flex>
        <Text>{isGasLoading ? '--' : TotalFeeContent}</Text>
      </Flex>
      {transType === 'send' && (
        <Flex
          fontSize={12}
          color="readable.disable"
          justifyContent={'flex-end'}
          alignItems={'center'}
        >
          Owner Account balance: {renderFee(bankBalance, exchangeRate)}
        </Flex>
      )}
    </Flex>
  );
});
