import { getStreamRecord } from '@/facade/account';
import { BN } from '../BigNumber';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { TStoreFeeParams } from '@/store/slices/global';
import { getTimestampInSeconds } from '../time';

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

export const getStoreNetflowRate = (size: number, storeFeeParams: TStoreFeeParams) => {
  const {
    primarySpStorePrice,
    secondarySpStorePrice,
    redundantDataChunkNum,
    redundantParityChunkNum,
    minChargeSize,
    validatorTaxRate,
  } = storeFeeParams;
  const chargeSize = size >= minChargeSize ? size : minChargeSize;
  const primarySpRate = BN(primarySpStorePrice).dividedBy(Math.pow(10, 18)).times(BN(chargeSize));
  const secondarySpNum = redundantDataChunkNum + redundantParityChunkNum;
  let secondarySpRate = BN(secondarySpStorePrice).dividedBy(Math.pow(10, 18)).times(BN(chargeSize));
  secondarySpRate = secondarySpRate.times(secondarySpNum);
  const validatorTax = BN(validatorTaxRate)
    .dividedBy(Math.pow(10, 18))
    .times(primarySpRate.plus(secondarySpRate));
  const netflowRate = primarySpRate.plus(secondarySpRate).plus(validatorTax);

  return netflowRate.toString();
};

export const getQuotaNetflowRate = (size: number, storeFeeParams: TStoreFeeParams) => {
  const { validatorTaxRate, readPrice } = storeFeeParams;
  const primaryQuotaRate = BN(readPrice)
    .dividedBy(10 ** 18)
    .times(size);
  const taxRate = BN(validatorTaxRate)
    .dividedBy(10 ** 18)
    .times(primaryQuotaRate);
  return primaryQuotaRate.plus(taxRate).toString();
};

export const getClientFrozen = (settleTime: number, bufferTime: number) => {
  if (String(settleTime).length !== 13) {
    return false;
  }
  const curTime = getTimestampInSeconds();
  return curTime + bufferTime > settleTime;
};
