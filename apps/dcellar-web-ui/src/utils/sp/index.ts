import { client } from '@/base/client';

const getStorageProviders = async () => {
  const sps = await client.sp.getStorageProviders();

  return sps;
};

const getBucketInfo = async (bucketName: string): Promise<any> => {
  const result = await client.bucket.headBucket(bucketName);

  return result?.bucketInfo ?? {};
};

const getObjectInfo = async (bucketName: string, objectName: string): Promise<any> => {

  return await client.object.headObject(bucketName, objectName);
};

const getSpInfo = async (spAddress: string): Promise<any> => {

  return await client.sp.getStorageProviderInfo(spAddress);
};

export { getStorageProviders, getBucketInfo, getObjectInfo, getSpInfo };
