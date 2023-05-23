import {
  decodeObjectFromHexString,
  getCreateBucketApproval,
  getUserBuckets,
} from '@bnb-chain/greenfield-storage-js-sdk';
import {
  CreateBucketTx,
  DelBucketTx,
  getAccount,
  makeRpcClient,
  ZERO_PUBKEY,
  recoverPk,
  makeCosmsPubKey,
} from '@bnb-chain/gnfd-js-sdk';
import Long from 'long';
import { QueryClientImpl as spQueryClientImpl } from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/query';
import { QueryClientImpl as storageQueryClientImpl } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';

import { IApprovalCreateBucket } from '@/modules/buckets/type';
import { getGasFeeBySimulate } from '@/modules/wallet/utils/simulate';
import { parseError } from '../utils/parseError';
import { GRPC_URL } from '@/base/env';

// TODO temp
export const pollingCreateAsync =
  <T extends any[], U extends any>(fn: (...args: T) => Promise<U>, interval = 500) =>
  async (...args: T): Promise<any> => {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      try {
        const { bucketName } = args[0] as any;
        const result = (await fn(...args)) as any;
        if (result.code === 0) {
          const theNewBucket = (result.body || []).find(
            (item: any) => item.bucket_info.bucket_name === bucketName,
          );
          if (theNewBucket !== undefined) {
            return;
          }
          // continue
        } else {
          return;
        }

        // continue
      } catch (e: any) {
        const { code } = parseError(e?.message);
        if (+code !== 6) {
          throw e;
        }
        // continue
      }
    }
  };

export const pollingDeleteAsync =
  <T extends any[], U extends any>(fn: (...args: T) => Promise<U>, interval = 500) =>
  async (...args: T): Promise<any> => {
    await new Promise((resolve) => setTimeout(resolve, interval));
    while (true) {
      try {
        const { bucketName } = args[0] as any;
        const result = (await fn(...args)) as any;
        if (result.code === 0) {
          const theNewBucket = (result.body || []).find(
            (item: any) => item.bucket_info.bucket_name === bucketName,
          );
          if (theNewBucket === undefined || theNewBucket.removed === true) {
            return;
          }
          // continue
        } else {
          return;
        }
        // continue
      } catch (e: any) {
        const { code, message } = parseError(e?.message);
        if (code === -1 && message === 'Address is empty, please check.') {
          return;
        } else {
          throw e;
        }
        // if (+code === 6) {
        //   // end loop
        //   return;
        // } else {
        //   throw e;
        // }
      }
    }
  };

export const getBucketInfo = async (bucketName: string): Promise<any> => {
  const rpcClient = await makeRpcClient(GRPC_URL);
  const rpc = new storageQueryClientImpl(rpcClient);
  const bucketInfoRes = await rpc.HeadBucket({
    bucketName,
  });

  const bucketId = bucketInfoRes?.bucketInfo?.id;
  if (!bucketId) throw new Error('no such bucket');

  return await rpc.HeadBucketById({
    bucketId,
  });
};

// export const confirmBucketCreateSync = async (bucketName: string) => {
//   const bucketInfo = await getBucketInfo(bucketName);
//   const listBucket = await getBucketList();
//   const bucket = listBucket.find((b) => b.name === bucketName);
//   if (!bucket) throw new Error('no such bucket');
//   if (bucketInfo?.bucketInfo?.id !== bucket.id) throw new Error('bucket id not match');
// };
// TODO This is a temp solution
export const pollingGetBucket = pollingCreateAsync(getUserBuckets, 500);
export const pollingDeleteBucket = pollingDeleteAsync(getUserBuckets, 500);

export const getFee = async ({
  bucketName,
  address,
  chainId,
  primarySpAddress,
  endpoint,
}: {
  address: string;
  bucketName: string;
  chainId: number;
  primarySpAddress: string;
  endpoint: string;
}) => {
  const getApprovalParams = {
    bucketName,
    creator: address,
    primarySpAddress,
    endpoint,
  };
  const res = await getCreateBucketApproval(getApprovalParams);
  const { body: xSPSignedMsg, code } = res;
  if (code !== 0) {
    throw res;
  }
  const { sequence } = await getAccount(GRPC_URL, address);
  const decodedSPMsg = decodeObjectFromHexString(xSPSignedMsg) as IApprovalCreateBucket;
  const createBucketTx = new CreateBucketTx(GRPC_URL!, String(chainId)!);
  const simulateBytes = createBucketTx.getSimulateBytes({
    from: decodedSPMsg.creator,
    bucketName: decodedSPMsg.bucket_name,
    denom: 'BNB',
    paymentAddress: '',
    primarySpAddress: decodedSPMsg.primary_sp_address,
    expiredHeight: decodedSPMsg.primary_sp_approval.expired_height,
    sig: decodedSPMsg.primary_sp_approval.sig,
    chargedReadQuota: decodedSPMsg.charged_read_quota ?? 0,
    visibility: decodedSPMsg.visibility,
  });
  const authInfoBytes = createBucketTx.getAuthInfoBytes({
    // @ts-ignore
    sequence,
    denom: 'BNB',
    gasLimit: 0,
    gasPrice: '0',
    pubKey: makeCosmsPubKey(ZERO_PUBKEY),
  });

  const simulateGas = await createBucketTx.simulateTx(simulateBytes, authInfoBytes);
  const decimalGasFee = getGasFeeBySimulate(simulateGas);

  return decimalGasFee;
};

export const getDeleteBucketFee = async ({ bucketName, address, chainId }: any) => {
  const { sequence } = await getAccount(GRPC_URL!, address!);
  const delBucketTx = new DelBucketTx(GRPC_URL, String(chainId)!);
  const simulateBytes = delBucketTx.getSimulateBytes({
    bucketName,
    from: address,
  });
  const authInfoBytes = delBucketTx.getAuthInfoBytes({
    // @ts-ignore
    sequence,
    denom: 'BNB',
    gasLimit: 0,
    gasPrice: '0',
    pubKey: makeCosmsPubKey(ZERO_PUBKEY),
  });

  const simulateGas = await delBucketTx.simulateTx(simulateBytes, authInfoBytes);

  const decimalGasFee = getGasFeeBySimulate(simulateGas);

  return decimalGasFee;
};

export const createBucketTxUtil = async ({
  address,
  bucketName,
  chainId,
  spAddress,
  spEndpoint,
  provider,
}: {
  address: string;
  bucketName: string;
  chainId: number;
  spAddress: string;
  spEndpoint: string;
  provider: any;
}) => {
  const approvalParams = {
    creator: address,
    bucketName,
    primarySpAddress: spAddress,
    endpoint: spEndpoint,
  };
  //1. Check that the name is not already taken and get the gas limit.
  const res = await getCreateBucketApproval(approvalParams);
  const { body: xSPSignedMsg, code } = res;
  if (code !== 0) {
    throw res;
  }
  const decodedSPMsg = decodeObjectFromHexString(xSPSignedMsg) as IApprovalCreateBucket;
  const createBucketTx = new CreateBucketTx(GRPC_URL, String(chainId)!);
  const { sequence, accountNumber } = await getAccount(GRPC_URL!, address!);
  const simulateBytes = createBucketTx.getSimulateBytes({
    from: decodedSPMsg.creator,
    bucketName: decodedSPMsg.bucket_name,
    denom: 'BNB',
    paymentAddress: '',
    primarySpAddress: decodedSPMsg.primary_sp_address,
    expiredHeight: decodedSPMsg.primary_sp_approval.expired_height,
    sig: decodedSPMsg.primary_sp_approval.sig,
    chargedReadQuota: decodedSPMsg.charged_read_quota ?? 0,
    visibility: decodedSPMsg.visibility,
  });
  const authInfoBytes = createBucketTx.getAuthInfoBytes({
    // @ts-ignore
    sequence,
    denom: 'BNB',
    gasLimit: 0,
    gasPrice: '0',
    pubKey: makeCosmsPubKey(ZERO_PUBKEY),
  });
  const simulateGas = await createBucketTx.simulateTx(simulateBytes, authInfoBytes);
  const gasLimit = simulateGas.gasInfo?.gasUsed.toNumber() || 0;
  const gasPrice = simulateGas.gasInfo?.minGasPrice.replaceAll('BNB', '') || '0';
  // 2. sign
  const signInfo = await createBucketTx.signTx(
    {
      // @ts-ignore
      from: decodedSPMsg.creator,
      bucketName: decodedSPMsg.bucket_name,
      sequence: sequence + '',
      paymentAddress: '',
      accountNumber: accountNumber + '',
      denom: 'BNB',
      gasLimit,
      gasPrice,
      primarySpAddress: decodedSPMsg.primary_sp_address,
      expiredHeight: decodedSPMsg.primary_sp_approval.expired_height,
      sig: decodedSPMsg.primary_sp_approval.sig,
      chargedReadQuota: decodedSPMsg.charged_read_quota ?? 0,
      visibility: decodedSPMsg.visibility,
    },
    provider,
  );
  // 3. broadcast tx
  const pk = recoverPk({
    signature: signInfo.signature,
    messageHash: signInfo.messageHash,
  });
  const pubKey = makeCosmsPubKey(pk);
  const rawBytes = await createBucketTx.getRawTxInfo({
    // @ts-ignore
    bucketName: decodedSPMsg.bucket_name,
    paymentAddress: '',
    denom: 'BNB',
    from: address,
    gasLimit,
    gasPrice,
    primarySpAddress: decodedSPMsg.primary_sp_address,
    pubKey,
    sequence: sequence + '',
    accountNumber: accountNumber + '',
    sign: signInfo.signature,
    expiredHeight: decodedSPMsg.primary_sp_approval.expired_height,
    sig: decodedSPMsg.primary_sp_approval.sig,
    visibility: decodedSPMsg.visibility,
    chargedReadQuota: decodedSPMsg.charged_read_quota,
  });
  const txRes = await createBucketTx.broadcastTx(rawBytes.bytes);
  // await pollingGetBucket(bucketName);
  // @ts-ignore TODO temp
  await pollingGetBucket({ address, endpoint: spEndpoint, bucketName });

  return txRes;
};

export const getStorageProviders = async () => {
  const rpcClient = await makeRpcClient(GRPC_URL);

  const rpc = new spQueryClientImpl(rpcClient);
  const res = await rpc.StorageProviders({
    pagination: undefined,
  });

  return res;
};

type DeleteBucketProps = {
  address: string;
  chain: any;
  bucketName: string;
  sp: any;
  provider: any;
};
export const deleteBucket = async ({
  address,
  chain,
  bucketName,
  sp,
  provider,
}: DeleteBucketProps) => {
  const delBucketTx = new DelBucketTx(GRPC_URL, String(chain?.id)!);
  const { sequence, accountNumber } = await getAccount(GRPC_URL!, address!);
  // 1. simulate
  const simulateBytes = delBucketTx.getSimulateBytes({
    bucketName,
    from: address,
  });
  const authInfoBytes = delBucketTx.getAuthInfoBytes({
    // @ts-ignore
    sequence,
    denom: 'BNB',
    gasLimit: 0,
    gasPrice: '0',
    pubKey: makeCosmsPubKey(ZERO_PUBKEY),
  });

  const simulateGas = await delBucketTx.simulateTx(simulateBytes, authInfoBytes);
  const gasLimit = simulateGas.gasInfo?.gasUsed.toNumber() || 0;
  const gasPrice = simulateGas.gasInfo?.minGasPrice.replaceAll('BNB', '') || '0';
  // 2. sign

  const signInfo = await delBucketTx.signTx(
    {
      accountNumber: accountNumber + '',
      bucketName,
      from: address,
      sequence: sequence + '',
      gasLimit,
      gasPrice,
      denom: 'BNB',
    },
    provider,
  );
  // 3. broadcast tx
  const pk = recoverPk({
    signature: signInfo.signature,
    messageHash: signInfo.messageHash,
  });
  const pubKey = makeCosmsPubKey(pk);

  const rawBytes = await delBucketTx.getRawTxInfo({
    accountNumber: accountNumber + '',
    bucketName,
    from: address,
    sequence: sequence + '',
    gasLimit,
    gasPrice,
    pubKey,
    sign: signInfo.signature,
    denom: 'BNB',
  });

  const txRes = await delBucketTx.broadcastTx(rawBytes.bytes);
  // @ts-ignore
  await pollingDeleteBucket({ bucketName, address, endpoint: sp.endpoint });

  return txRes;
};

export const getSpStoragePriceByTime = async (spAddress: string) => {
  const rpcClient = await makeRpcClient(GRPC_URL);

  const rpc = new spQueryClientImpl(rpcClient);
  const res = await rpc.QueryGetSpStoragePriceByTime({
    spAddr: spAddress,
    timestamp: Long.fromNumber(1678772331382),
  });

  return res;
};

export const bucketHasFile = async (fileList: any[]) => {
  return fileList.some((items) => items.removed === false);
};
