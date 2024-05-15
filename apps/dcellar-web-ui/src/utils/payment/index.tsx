import { getTimestampInSeconds } from '../time';

import { getStreamRecord } from '@/facade/account';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { StoreFeeParams } from '@/store/slices/global';
import { BN } from '@/utils/math';

export const getSettlementFee = async (address: string) => {
  const [res, error] = await getStreamRecord(address);
  if (!res || error) return [null, error];
  const { streamRecord } = res;
  const curTime = getTimestampInSeconds();
  const storedTime = curTime - Number(streamRecord.crudTimestamp.low);
  const amount = BN(streamRecord.netflowRate)
    .dividedBy(10 ** 18)
    .times(storedTime)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    .abs()
    .toString();

  return [amount, null];
};

export const getStoreNetflowRate = (
  size: number,
  storeFeeParams: StoreFeeParams,
  isChargeSize = false,
) => {
  const {
    primarySpStorePrice,
    secondarySpStorePrice,
    redundantDataChunkNum,
    redundantParityChunkNum,
    minChargeSize,
    validatorTaxRate,
  } = storeFeeParams;
  const chargeSize = isChargeSize ? size : size >= minChargeSize ? size : minChargeSize;
  const primarySpRate = BN(primarySpStorePrice).times(BN(chargeSize));
  const secondarySpNum = redundantDataChunkNum + redundantParityChunkNum;
  let secondarySpRate = BN(secondarySpStorePrice).times(BN(chargeSize));
  secondarySpRate = secondarySpRate.times(secondarySpNum);
  const validatorTax = BN(validatorTaxRate).times(primarySpRate.plus(secondarySpRate));
  const netflowRate = primarySpRate.plus(secondarySpRate).plus(validatorTax);

  return netflowRate.dividedBy(10 ** 18).toString();
};

export const getQuotaNetflowRate = (size: number, storeFeeParams: StoreFeeParams) => {
  const { validatorTaxRate, readPrice } = storeFeeParams;
  const primaryQuotaRate = BN(readPrice).times(size);
  const taxRate = BN(validatorTaxRate).times(primaryQuotaRate);

  return primaryQuotaRate
    .plus(taxRate)
    .dividedBy(10 ** 18)
    .toString();
};

export const getClientFrozen = (settleTime: number, bufferTime: number) => {
  if (String(settleTime).length !== 13) {
    return false;
  }
  const curTime = getTimestampInSeconds();
  return curTime + bufferTime > settleTime;
};
