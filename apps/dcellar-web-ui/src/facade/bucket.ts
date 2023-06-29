import { IQuotaProps } from '@bnb-chain/greenfield-chain-sdk/dist/esm/types/storage';
import BigNumber from 'bignumber.js';
import { getClient } from '@/base/client';
import { QueryHeadBucketResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { getSpOffChainData } from '@/modules/off-chain-auth/utils';

export const quotaRemains = (quota: IQuotaProps, payload: string) => {
  const { freeQuota, readQuota, consumedQuota } = quota;
  return !BigNumber(freeQuota).plus(readQuota).minus(consumedQuota).minus(payload).isNegative();
};

export const headObject = async (bucketName: string) => {
  const client = await getClient();
  const { bucketInfo } = await client.bucket
    .headBucket(bucketName)
    .catch(() => ({} as QueryHeadBucketResponse));
  return bucketInfo || null;
};

export const getUserBuckets = async (address: string, operator: string) => {
  // const { seed } = await getSpOffChainData({ address, spAddress: operator })
};
