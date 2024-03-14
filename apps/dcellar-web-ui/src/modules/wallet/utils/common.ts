import { UseFormSetValue } from 'react-hook-form';

import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '../constants';
import { TFeeData, TWalletFromValues } from '../type';

import { BN } from '@/utils/math';

// When logging in through TW and using the "max" functionality for the "transfer in" operation, please be aware that the gas fee calculated in the TW wallet interface may be higher than the actual fee. Therefore, we have included a safety value to ensure successful transactions. If you prefer to use the max functionality with a more accurate gas fee estimation, we recommend using MetaMask.
const TW_GAS_FEE_SAFETY_MULTIPLIER = 1.6;
export const setMaxAmount = (
  balance: string,
  feeData: TFeeData,
  setValue: UseFormSetValue<TWalletFromValues>,
  isTwTransferMax?: boolean,
) => {
  const gasFee = isTwTransferMax
    ? BN(feeData.gasFee).times(TW_GAS_FEE_SAFETY_MULTIPLIER)
    : feeData.gasFee;
  const availableBalance = BN(balance)
    .minus(gasFee)
    .minus(feeData.relayerFee)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
    .toNumber();

  const availableStr = availableBalance < 0 ? '0' : availableBalance.toString();
  setValue('amount', availableStr, { shouldValidate: true });
};
