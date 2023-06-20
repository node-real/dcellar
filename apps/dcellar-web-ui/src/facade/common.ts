import { getClient } from '@/base/client';
import { QueryHeadObjectResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { IObjectResultType } from '@bnb-chain/greenfield-chain-sdk';
import { IQuotaProps } from '@bnb-chain/greenfield-chain-sdk/dist/esm/types/storage';
import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';

export const resolve = <R>(r: R): [R, null] => [r, null];

export const getObjectInfoAndBucketQuota = async (
  bucketName: string,
  objectName: string,
  endpoint: string,
): Promise<[ObjectInfo | null, IQuotaProps | null]> => {
  const client = await getClient();
  const [{ objectInfo }, { body }] = await Promise.all([
    client.object.headObject(bucketName, objectName).catch(() => ({} as QueryHeadObjectResponse)),
    client.bucket
      .getBucketReadQuota({ bucketName, endpoint })
      .catch(() => ({} as IObjectResultType<IQuotaProps>)),
  ]);

  return [objectInfo || null, body || null];
};
