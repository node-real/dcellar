import { IQuotaProps } from '@bnb-chain/greenfield-chain-sdk/dist/esm/types/storage';
import BigNumber from 'bignumber.js';
import { getClient } from '@/base/client';
import { QueryHeadBucketResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { getDomain } from '@/utils/getDomain';
import { commonFault, ErrorResponse } from '@/facade/error';
import { resolve } from '@/facade/common';
import { BucketProps } from '@bnb-chain/greenfield-chain-sdk/dist/cjs/types';
import { IObjectResultType } from '@bnb-chain/greenfield-chain-sdk';

export const quotaRemains = (quota: IQuotaProps, payload: string) => {
  const { freeQuota, readQuota, consumedQuota } = quota;
  return !BigNumber(freeQuota).plus(readQuota).minus(consumedQuota).minus(payload).isNegative();
};

export const headBucket = async (bucketName: string) => {
  const client = await getClient();
  const { bucketInfo } = await client.bucket
    .headBucket(bucketName)
    .catch(() => ({} as QueryHeadBucketResponse));
  return bucketInfo || null;
};

export const getUserBuckets = async (
  address: string,
  endpoint: string,
  seedString: string,
): Promise<ErrorResponse | [IObjectResultType<BucketProps[]>, null]> => {
  const domain = getDomain();
  const client = await getClient();
  const [res, error] = await client.bucket
    .getUserBuckets({ address, endpoint, domain, seedString })
    .then(resolve, commonFault);
  if (error) return [null, error];
  return [res!, null];
};

export const getBucketReadQuota = async (
  bucketName: string,
  endpoint: string,
): Promise<IQuotaProps | null> => {
  const client = await getClient();
  const { body } = await client.bucket
    .getBucketReadQuota({ bucketName, endpoint })
    .catch(() => ({} as IObjectResultType<IQuotaProps>));
  return body || null;
};
