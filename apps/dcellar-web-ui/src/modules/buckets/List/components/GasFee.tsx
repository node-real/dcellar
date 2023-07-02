import { Box, Flex } from '@totejs/uikit';
import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import { currencyFormatter } from '@/utils/currencyFormatter';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  DECIMAL_NUMBER,
  FIAT_CURRENCY_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import LoadingIcon from '@/public/images/icons/loading.svg';
import { useAppSelector } from '@/store';
import { selectBalance, selectBnbPrice } from '@/store/slices/global';

type GasFeeProps = {
  gasFee: BigNumber | null;
  isGasLoading: boolean;
  hasError: boolean;
};
export const GasFee = ({ gasFee, hasError, isGasLoading }: GasFeeProps) => {
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { availableBalance } = useAppSelector(selectBalance(address));
  const balance = BigNumber(availableBalance || 0);
  const strGasFee = gasFee && gasFee.dp(8).toString();
  const usdGasFee =
    gasFee &&
    currencyFormatter(
      gasFee.times(bnbPrice).dp(FIAT_CURRENCY_DISPLAY_PRECISION).toString(DECIMAL_NUMBER),
    );

  const strBalance = balance && balance.dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
  const usdBalance =
    balance &&
    currencyFormatter(balance.times(bnbPrice).dp(FIAT_CURRENCY_DISPLAY_PRECISION).toString());
  const feeDisplay = useMemo(() => {
    if (hasError || gasFee === null) {
      return `-- --`;
    } else {
      return `~${strGasFee} BNB (${usdGasFee})`;
    }
  }, [gasFee, hasError, strGasFee, usdGasFee]);

  return (
    <>
      <Flex
        backgroundColor={'#FAFAFA'}
        borderRadius={'8px'}
        padding="14px 16px 12px"
        justifyContent={'space-between'}
        marginTop="32px"
        color="#76808F"
        alignItems="flex-start"
      >
        <Box mt="4px">Gas fee</Box>
        <Box textAlign={'right'}>
          <Flex
            fontSize={'14px'}
            lineHeight={'28px'}
            wordBreak={'break-all'}
            color={'readable.tertiary'}
            justifyContent={'flex-end'}
          >
            {isGasLoading ? (
              <LoadingIcon color={'#76808F'} width={'20px'} height={'20px'} />
            ) : (
              feeDisplay
            )}
          </Flex>
          <Box
            fontSize={'12px'}
            lineHeight={'15px'}
            wordBreak={'break-all'}
            marginTop={'4px'}
            color={'readable.disabled'}
          >
            {`Available balance: ${strBalance} BNB (${usdBalance})`}
          </Box>
        </Box>
      </Flex>
    </>
  );
};
