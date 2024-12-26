import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk';

export const getRemainingQuota = (quotaData: IQuotaProps) => {
  if (!quotaData) return 0;
  const { readQuota, freeQuota, consumedQuota, monthlyFreeQuota, monthlyQuotaConsumedSize } =
    quotaData;
  const remainingQuota =
    freeQuota + readQuota + monthlyFreeQuota - consumedQuota - monthlyQuotaConsumedSize;

  return remainingQuota;
};
