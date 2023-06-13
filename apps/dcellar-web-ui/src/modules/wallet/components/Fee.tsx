import { Box, Flex, Text } from '@totejs/uikit';
import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { OperationTypeContext } from '..';
import { currencyFormatter } from '@/utils/currencyFormatter';
import { EOperation, TFeeData } from '../type';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  DECIMAL_NUMBER,
  FIAT_CURRENCY_DISPLAY_PRECISION,
  INIT_FEE_DATA,
} from '../constants';
import { Tips } from '@/components/common/Tips';

type FeeProps = {
  amount: string;
  feeData: TFeeData;
  isGasLoading: boolean;
  gaShowTipsName?: string;
};

export const Fee = ({
  amount,
  isGasLoading,
  feeData = INIT_FEE_DATA,
  gaShowTipsName,
}: FeeProps) => {
  const { type, bnbPrice } = React.useContext(OperationTypeContext);
  const { gasFee, relayerFee } = feeData;
  const totalFee = gasFee.plus(relayerFee);
  const feeUsdPrice = bnbPrice && totalFee && totalFee.times(BigNumber(bnbPrice.value || 0));
  const formatFeeUsdPrice =
    feeUsdPrice &&
    currencyFormatter(feeUsdPrice.dp(FIAT_CURRENCY_DISPLAY_PRECISION).toString(DECIMAL_NUMBER));

  const totalAmount = BigNumber(amount || 0)
    .plus(totalFee)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1);
  const totalUsdPrice = bnbPrice && totalAmount.times(BigNumber(bnbPrice.value || 0));
  const formatTotalUsdPrice =
    totalUsdPrice &&
    currencyFormatter(totalUsdPrice.dp(FIAT_CURRENCY_DISPLAY_PRECISION).toString(DECIMAL_NUMBER));

  const TotalFeeContent = `${totalFee
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
    .toString(DECIMAL_NUMBER)} BNB (${formatFeeUsdPrice})`;
  const TotalAmountContent = `${totalAmount} BNB (${formatTotalUsdPrice})`;

  const TipContent = useMemo(() => {
    if (type === EOperation.send) {
      return null;
    }

    return (
      <Box>
        <Text>
          Gas fee: {gasFee.dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1).toString(DECIMAL_NUMBER)} BNB
        </Text>
        <Text>
          Relayer fee: {relayerFee.dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1).toString()} BNB
        </Text>
        <Text>
          BNB Gas fee covers the gas cost for sending your transfer on the destination chain.
        </Text>
        <Text>Relayer fee is paid to relayers for handling cross-chain packets.</Text>
      </Box>
    );
  }, [gasFee, relayerFee, type]);

  return (
    <>
      <Flex justifyContent={'space-between'} mb="8px" alignItems={'center'}>
        <Flex>
          <Text color="readable.tertiary">Fee</Text>
          {type !== 'send' && (
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
