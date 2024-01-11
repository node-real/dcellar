import { QueryHeadObjectResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { Long, TxResponse } from '@bnb-chain/greenfield-js-sdk';
import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { get } from '@/base/http';
import { broadcastFault, commonFault, ErrorMsg, ErrorResponse, simulateFault } from '@/facade/error';
import { IQuotaProps, SpResponse } from '@bnb-chain/greenfield-js-sdk';
import { getClient } from '@/facade/index';
import { signTypedDataCallback } from './wallet';
import { UNKNOWN_ERROR } from '@/modules/object/constant';
import { TTmpAccount } from '@/store/slices/global';
import { Connector } from 'wagmi';

export const resolve = <R>(r: R): [R, null] => [r, null];

export type DeliverTxResponse = Awaited<ReturnType<TxResponse['broadcast']>>;

export const getObjectInfoAndBucketQuota = async ({
  bucketName,
  objectName,
  address,
  seedString,
  endpoint,
}: {
  bucketName: string;
  objectName: string;
  endpoint?: string;
  address: string;
  seedString: string;
}): Promise<[ObjectInfo | null, IQuotaProps | null, ErrorMsg?]> => {
  const client = await getClient();
  const [{ objectInfo }, { body, message }] = await Promise.all([
    client.object.headObject(bucketName, objectName).catch(() => ({} as QueryHeadObjectResponse)),
    client.bucket
      .getBucketReadQuota(
        {
          bucketName,
          endpoint,
        },
        {
          type: 'EDDSA',
          seed: seedString,
          domain: window.location.origin,
          address,
        },
      )
      .catch((e) => {
        return {} as SpResponse<IQuotaProps>;
      }),
  ]);

  return [objectInfo || null, body || null, message];
};

export type BnbPriceInfo = { price: string; symbol: string };

export const getDefaultBnbInfo = () => ({ price: '300', symbol: 'BNBUSDT' });

export const getBnbPrice = async (): Promise<BnbPriceInfo> => {
  const [res, error] = await get({
    url: 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT',
    customOptions: { needNotify: false },
  }).then(resolve, commonFault);

  if (error) return getDefaultBnbInfo();
  return res as BnbPriceInfo;
};

export const getGasFees = async (network?: 'mainnet') => {
  const client = await getClient(network);
  return await client.gashub.getMsgGasParams({
    msgTypeUrls: [],
    pagination: {
      countTotal: true,
      key: Uint8Array.from([]),
      limit: Long.fromInt(1000),
      offset: Long.fromInt(0),
      reverse: false,
    },
  }).then(resolve, commonFault);
}

export type BroadcastTx = {
  tx: TxResponse,
  address: string,
  connector: Connector,
}

export const broadcastTx = async ({
  tx,
  address,
  connector
}: BroadcastTx): Promise<ErrorResponse | [DeliverTxResponse, null]> => {
  if (!tx) {
    return [null, 'tx is null'];
  }
  const [simulateInfo, simulateError] = await tx
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);
  if (simulateInfo === null || simulateError) return [null, simulateError];
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: address,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  const [res, error] = await tx.broadcast(broadcastPayload).then(resolve, broadcastFault);

  if (!res || (res && res.code !== 0) || error) {
    return [null, error || UNKNOWN_ERROR];
  }

  return [res, error];
};

export type BroadcastMultiTx = {
  txs: TxResponse[],
  address: string,
  connector: Connector,
}
export const broadcastMulTxs = async ({
  txs,
  address,
  connector,
}: BroadcastMultiTx): Promise<ErrorResponse | [DeliverTxResponse, null]> => {
  const client = await getClient()
  const multiTxs = await client.txClient.multiTx(txs);
  const [simulateInfo, simulateError] = await multiTxs
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);

  if (simulateInfo === null || simulateError) return [null, simulateError];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo.gasLimit),
    gasPrice: simulateInfo.gasPrice,
    payer: address,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };
  const [res, error] = await multiTxs.broadcast(payload).then(resolve, broadcastFault);

  if (!res || (res && res.code !== 0) || error) {
    return [null, error || UNKNOWN_ERROR];
  }

  return [res, null];
};

export type BroadcastMultiTxByTmpAccount = {
  txs: TxResponse[],
  tmpAccount: TTmpAccount,
  address: string,
}
export const broadcastMultiTxByTmpAccount = async ({
  txs,
  tmpAccount,
  address
}: BroadcastMultiTxByTmpAccount): Promise<ErrorResponse | [DeliverTxResponse, null]> => {
  if (!txs) {
    return [null, 'txs is null'];
  }
  const client = await getClient();
  const multiTxs = await client.txClient.multiTx(txs);
  const [simulateInfo, simulateError] = await multiTxs
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);
  if (simulateInfo === null || simulateError) return [null, simulateError];
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: tmpAccount.address,
    granter: address,
    privateKey: tmpAccount.privateKey,
  };

  const [res, error] = await multiTxs.broadcast(broadcastPayload).then(resolve, broadcastFault);

  if (!res || (res && res.code !== 0) || error) {
    return [null, error || UNKNOWN_ERROR];
  }

  return [res, error];
};
