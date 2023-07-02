import { Box, Flex, Text } from '@totejs/uikit';
import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { currencyFormatter } from '@/utils/currencyFormatter';
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

type FeeProps = {
  amount: string;
  feeData: TFeeData;
  isGasLoading: boolean;
  gaShowTipsName?: string;
};
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

export const Fee = ({
  amount,
  isGasLoading,
  feeData = INIT_FEE_DATA,
  gaShowTipsName,
}: FeeProps) => {
  const bnbPrice = useAppSelector(selectBnbPrice);
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
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1);
  const totalUsdPrice = totalAmount.times(BigNumber(bnbPrice));
  const formatTotalUsdPrice =
    totalUsdPrice &&
    currencyFormatter(totalUsdPrice.dp(FIAT_CURRENCY_DISPLAY_PRECISION).toString(DECIMAL_NUMBER));

  // const TotalFeeContent = `${totalFee
  //   .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
  //   .toString(DECIMAL_NUMBER)} BNB (${formatFeeUsdPrice})`;

  //show defalut fee if cannot get fee data in 3000ms
  const TotalFeeContent = useMemo(() => {
    let total = totalFee;
    if (isShowDefault) {
      total = BigNumber(defaultFee);
      return `~${total.dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1).toString(DECIMAL_NUMBER)} BNB`;
    }
    return `${totalFee
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
      .toString(DECIMAL_NUMBER)} BNB (${formatFeeUsdPrice})`;
  }, [defaultFee, formatFeeUsdPrice, isShowDefault, totalFee]);
  const TotalAmountContent = `${totalAmount} BNB (${formatTotalUsdPrice})`;

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
          BNB
        </Text>
        <Text>
          Relayer fee:{' '}
          {gasFee.toString() === '0'
            ? BigNumber(defaultGasRelayerFee.relayerFee)
                .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
                .toString(DECIMAL_NUMBER)
            : relayerFee.dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1).toString()}{' '}
          BNB
        </Text>
        <Text>
          BNB Gas fee covers the gas cost for sending your transfer on the destination chain.
        </Text>
        <Text>Relayer fee is paid to relayers for handling cross-chain packets.</Text>
      </Box>
    );
  }, [gasFee, relayerFee, transType, defaultGasRelayerFee]);

  return (
    <>
      <Flex justifyContent={'space-between'} mb="8px" alignItems={'center'}>
        <Flex>
          <Text color="readable.tertiary">Fee</Text>
          {transType !== 'send' && (
            <Tips
              containerWidth={'308px'}
              iconSize={'16px'}
              tips={TipContent}
              placement="top"
              gaShowName={gaShowTipsName}
            ></Tips>
          )}
        </Flex>

        <Text
          color={'readable.normal'}
          fontWeight="500"
          textAlign={'right'}
          fontSize={'14px'}
          lineHeight="28px"
        >
          {isGasLoading ? '--' : TotalFeeContent}
        </Text>
      </Flex>
      <Flex mb={'40px'} justifyContent={'space-between'} alignItems="flex-start" gap={'24px'}>
        <Text color="readable.tertiary">Total amount</Text>
        <Text
          color={'readable.normal'}
          textAlign="right"
          fontWeight="500"
          fontSize={'14px'}
          lineHeight="28px"
          wordBreak={'break-all'}
        >
          {isGasLoading ? '--' : TotalAmountContent}
        </Text>
      </Flex>
    </>
  );
};
