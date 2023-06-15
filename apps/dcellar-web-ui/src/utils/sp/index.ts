import { getClient } from '@/base/client';

const getStorageProviders = async () => {
  const client = await getClient();
  const sps = await client.sp.getStorageProviders();

  return sps;
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

export { getStorageProviders, getBucketInfo, getObjectInfo, getSpInfo };
