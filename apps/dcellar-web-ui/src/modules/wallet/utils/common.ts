import { BN } from '@/utils/math';
import { TFeeData, TWalletFromValues } from '../type';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '../constants';
import { UseFormSetValue } from 'react-hook-form';

export const setMaxAmount = (balance: string, feeData: TFeeData, setValue: UseFormSetValue<TWalletFromValues>) => {
  const availableBalance = BN(balance)
    .minus(feeData.gasFee)
    .minus(feeData.relayerFee)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
    .toNumber();

  const availableStr = availableBalance < 0 ? '0' : availableBalance.toString();
  setValue('amount', availableStr, { shouldValidate: true });
}