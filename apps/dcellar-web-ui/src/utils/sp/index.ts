import { getClient } from '@/base/client';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { IReturnOffChainAuthKeyPairAndUpload, getUtcZeroTimestamp } from '@bnb-chain/greenfield-chain-sdk';

const getStorageProviders = async () => {
  const client = await getClient();
  const sps = await client.sp.getStorageProviders();
  return sps.filter((sp) => sp.endpoint.startsWith('https'));
};

const getBucketInfo = async (bucketName: string): Promise<any> => {
  const client = await getClient();
  const result = await client.bucket.headBucket(bucketName);

  return result?.bucketInfo ?? {};
};

const getObjectInfo = async (bucketName: string, objectName: string): Promise<any> => {
  const client = await getClient();
  return await client.object.headObject(bucketName, objectName);
};

const getSpInfo = async (spAddress: string): Promise<any> => {
  const client = await getClient();
  return await client.sp.getStorageProviderInfo(spAddress);
};

const filterAuthSps = ({ address, sps }: { address: string; sps: any[]; }) => {
  const curTime = getUtcZeroTimestamp();
  const key = `${address}-${GREENFIELD_CHAIN_ID}`;
  const localData = localStorage.getItem(key);
  const parseLocalData = localData && JSON.parse(localData) || [];
  const compatibleOldData = Array.isArray(parseLocalData) ? parseLocalData : [parseLocalData];

  const offChainSps = compatibleOldData.filter((item: IReturnOffChainAuthKeyPairAndUpload) => {
    return item.expirationTime > curTime;
  }).map(item => item.spAddresses).flat();

  const filterSps = sps.filter((sp) => {
    return offChainSps.includes(sp.operatorAddress);
  });


  return filterSps;
}

export { getStorageProviders, getBucketInfo, getObjectInfo, getSpInfo, filterAuthSps };
