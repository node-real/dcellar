import { makeRpcClient } from '@bnb-chain/gnfd-js-sdk';
import { QueryClientImpl as storageQueryClientImpl } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { QueryClientImpl as spQueryClientImpl } from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/query';

import { GREENFIELD_CHAIN_RPC_URL } from '@/base/env';

const getStorageProviders = async () => {
  const rpcClient = await makeRpcClient(GREENFIELD_CHAIN_RPC_URL);
  const rpc = new spQueryClientImpl(rpcClient);
  const res = await rpc.StorageProviders({
    pagination: undefined,
  });
  return res;
};

const getBucketInfo = async (bucketName: string): Promise<any> => {
  const rpcClient = await makeRpcClient(GREENFIELD_CHAIN_RPC_URL);
  const rpc = new storageQueryClientImpl(rpcClient);
  const bucketInfoRes = await rpc.HeadBucket({
    bucketName,
  });
  const bucketId = bucketInfoRes?.bucketInfo?.id;
  if (!bucketId) throw new Error('no such bucket');
  const result = await rpc.HeadBucketById({
    bucketId,
  });
  return result?.bucketInfo ?? {};
};

const getObjectInfo = async (bucketName: string, objectName: string): Promise<any> => {
  const rpcClient = await makeRpcClient(GREENFIELD_CHAIN_RPC_URL);
  const rpc = new storageQueryClientImpl(rpcClient);
  const result = await rpc.HeadObject({
    bucketName,
    objectName,
  });
  return result?.objectInfo ?? {};
};

const getSpInfo = async (spAddress: string): Promise<any> => {
  const rpcClient = await makeRpcClient(GREENFIELD_CHAIN_RPC_URL);
  const rpc = new spQueryClientImpl(rpcClient);
  const result = await rpc.StorageProvider({
    spAddress,
  });
  return result?.storageProvider ?? {};
};

export { getStorageProviders, getBucketInfo, getObjectInfo, getSpInfo };
