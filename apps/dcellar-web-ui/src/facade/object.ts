import {
  generateUrlByBucketName,
  IObjectResponse,
  IObjectResultType,
  IQuotaProps,
  ISimulateGasFee,
  PermissionTypes,
  TListObjects,
  TxResponse,
} from '@bnb-chain/greenfield-js-sdk';
import {
  broadcastFault,
  commonFault,
  createTxFault,
  E_NO_QUOTA,
  E_NOT_FOUND,
  E_OFF_CHAIN_AUTH,
  E_PERMISSION_DENIED,
  E_UNKNOWN,
  ErrorMsg,
  ErrorResponse,
  queryLockFeeFault,
  simulateFault,
} from '@/facade/error';
import { getObjectInfoAndBucketQuota, resolve } from '@/facade/common';
import {
  MsgPutPolicy,
  MsgUpdateObjectInfo,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { Connector } from 'wagmi';
import { getClient } from '@/base/client';
import { signTypedDataCallback } from '@/facade/wallet';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { quotaRemains } from '@/facade/bucket';
import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { encodeObjectName } from '@/utils/string';
import axios from 'axios';
import { SpItem } from '@/store/slices/sp';
import {
  QueryHeadObjectResponse,
  QueryLockFeeRequest,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { getDomain } from '@/utils/getDomain';
import { generateGetObjectOptions } from '@/modules/file/utils/generateGetObjectOptions';
import { batchDownload, directlyDownload } from '@/modules/file/utils';
import {
  ActionType,
  PrincipalType,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/common';
import { GROUP_ID } from '@/utils/regex';

export type DeliverResponse = Awaited<ReturnType<TxResponse['broadcast']>>;

export type BroadcastResponse = Promise<ErrorResponse | [DeliverResponse, null]>;

export const updateObjectInfo = async (
  msg: MsgUpdateObjectInfo,
  connector: Connector,
): BroadcastResponse => {
  const client = await getClient();
  const updateInfoTx = await client.object.updateObjectInfo(msg);

  const [simulateInfo, simulateError] = await updateInfoTx
    .simulate({ denom: 'BNB' })
    .then(resolve, simulateFault);
  if (simulateError) return [null, simulateError];

  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: msg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return updateInfoTx.broadcast(broadcastPayload).then(resolve, broadcastFault);
};

export const hasObjectPermission = async (
  bucketName: string,
  objectName: string,
  actionType: ActionType,
  loginAccount: string,
) => {
  const client = await getClient();
  return client.object
    .isObjectPermissionAllowed(bucketName, objectName, actionType, loginAccount)
    .catch(() => ({
      effect: PermissionTypes.Effect.EFFECT_DENY,
    }));
};

export const getCanObjectAccess = async (
  bucketName: string,
  objectName: string,
  endpoint: string,
  loginAccount: string,
  seedString: string,
): Promise<[boolean, ErrorMsg?, ObjectInfo?, IQuotaProps?]> => {
  const params = {
    bucketName,
    objectName,
    endpoint,
    address: loginAccount,
    seedString,
  };
  const [info, quota] = await getObjectInfoAndBucketQuota(params);
  if (!info) return [false, E_NOT_FOUND];

  const size = info.payloadSize.toString();
  // ACTION_GET_OBJECT
  const res = await hasObjectPermission(
    bucketName,
    objectName,
    PermissionTypes.ActionType.ACTION_GET_OBJECT,
    loginAccount,
  );
  if (
    info.visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE &&
    loginAccount !== info.owner &&
    res.effect !== PermissionTypes.Effect.EFFECT_ALLOW
  )
    return [false, E_PERMISSION_DENIED];

  if (!quota) return [false, E_UNKNOWN];
  if (!quotaRemains(quota, size)) return [false, E_NO_QUOTA];
  return [true, '', info, quota];
};

export type DownloadPreviewParams = {
  objectInfo: { bucketName: string; objectName: string; visibility: number };
  primarySp: SpItem;
  address: string;
};

export const getAuthorizedLink = async (
  params: DownloadPreviewParams,
  seedString: string,
  view = 1,
): Promise<[null, ErrorMsg] | [string]> => {
  const { address, primarySp, objectInfo } = params;
  const { bucketName, objectName } = objectInfo;
  const domain = getDomain();
  const [options, error] = await generateGetObjectOptions({
    bucketName,
    objectName,
    endpoint: primarySp.endpoint,
    userAddress: address,
    domain,
    seedString,
  }).then(resolve, commonFault);
  if (error) return [null, error];
  const { url, params: _params } = options!;
  return [`${url}?${_params}&view=${view}`];
};

export const downloadObject = async (
  params: DownloadPreviewParams,
  seedString: string,
  batch = false,
): Promise<[boolean, ErrorMsg?]> => {
  const { primarySp, objectInfo } = params;
  const { endpoint } = primarySp;
  const { visibility, bucketName, objectName } = objectInfo;

  const isPrivate = visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE;
  const link = `${endpoint}/download/${bucketName}/${encodeObjectName(objectName)}`;

  if (!isPrivate) {
    if (batch) batchDownload(link);
    else window.location.href = link;
    return [true];
  }

  const [url, error] = await getAuthorizedLink(params, seedString, 0);
  if (!url) return [false, error];

  if (batch) batchDownload(url);
  else window.location.href = url;
  return [true];
};

export const previewObject = async (
  params: DownloadPreviewParams,
  seedString: string,
): Promise<[boolean, ErrorMsg?]> => {
  const { primarySp, objectInfo } = params;
  const { endpoint } = primarySp;
  const { visibility, bucketName, objectName } = objectInfo;

  const isPrivate = visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE;
  const link = `${endpoint}/view/${bucketName}/${encodeObjectName(objectName)}`;
  if (!isPrivate) {
    directlyDownload(link, '_blank');
    return [true];
  }

  const [url, error] = await getAuthorizedLink(params, seedString);
  if (!url) return [false, error];

  directlyDownload(url, '_blank');
  return [true];
};

export type ListObjectsParams = {
  address: string;
  bucketName: string;
  endpoint: string;
  seedString: string;
  query: URLSearchParams;
};

export type IObjectList = {
  objects: IObjectResponse[];
  key_count: string;
  max_keys: string;
  is_truncated: boolean;
  next_continuation_token: string;
  name: string;
  prefix: string;
  delimiter: string;
  common_prefixes: string[];
  continuation_token: number;
};

export const getListObjects = async (
  params: TListObjects,
): Promise<[IObjectResultType<IObjectList>, null] | ErrorResponse> => {
  const client = await getClient();
  const [list, error] = (await client.object.listObjects(params).then(resolve, commonFault)) as any;
  if (error) return [null, error];
  return [list! as IObjectResultType<IObjectList>, null];
};

export type CancelDeleteParams = {
  bucketName: string;
  objectName: string;
  loginAccount?: string;
  operator: string;
  connector: Connector;
  privateKey?: string;
};

export const deleteObject = async ({
  bucketName,
  objectName,
  operator,
  loginAccount = '',
  connector,
  privateKey,
}: CancelDeleteParams): BroadcastResponse => {
  const client = await getClient();
  const [delObjTx, error1] = await client.object
    .deleteObject({ bucketName, objectName, operator })
    .then(resolve, createTxFault);
  if (!delObjTx) return [null, error1];

  const [simulateInfo, error2] = await delObjTx
    .simulate({ denom: 'BNB' })
    .then(resolve, simulateFault);
  if (!simulateInfo) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: operator,
    granter: privateKey ? loginAccount : '', // currently only grant to login user,
    privateKey,
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return delObjTx.broadcast(payload).then(resolve, broadcastFault);
};

export const cancelCreateObject = async ({
  bucketName,
  objectName,
  loginAccount = '',
  operator,
  connector,
  privateKey,
}: CancelDeleteParams): BroadcastResponse => {
  const client = await getClient();
  const [cancelObjectTx, error1] = await client.object
    .cancelCreateObject({ bucketName, objectName, operator })
    .then(resolve, createTxFault);
  if (!cancelObjectTx) return [null, error1];

  const [simulateInfo, error2] = await cancelObjectTx
    .simulate({ denom: 'BNB' })
    .then(resolve, simulateFault);
  if (!simulateInfo) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: operator,
    granter: privateKey ? loginAccount : '', // currently only grant to login user
    privateKey,
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return cancelObjectTx.broadcast(payload).then(resolve, broadcastFault);
};

export const queryLockFee = async (params: QueryLockFeeRequest) => {
  const client = await getClient();
  return await client.storage.queryLockFee(params).then(resolve, queryLockFeeFault);
};

export const headObject = async (bucketName: string, objectName: string) => {
  const client = await getClient();
  const { objectInfo } = await client.object
    .headObject(bucketName, objectName)
    .catch(() => ({} as QueryHeadObjectResponse));
  return objectInfo || null;
};

export const putObjectPolicy = async (
  connector: Connector,
  bucketName: string,
  objectName: string,
  srcMsg: Omit<MsgPutPolicy, 'resource' | 'expirationTime'>,
): BroadcastResponse => {
  const client = await getClient();
  const tx = await client.object.putObjectPolicy(bucketName, objectName, srcMsg);
  const [simulateInfo, simulateError] = await tx
    .simulate({ denom: 'BNB' })
    .then(resolve, simulateFault);
  if (simulateError) return [null, simulateError];
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: srcMsg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };
  return tx.broadcast(broadcastPayload).then(resolve, broadcastFault);
};

export const putObjectPolicies = async (
  connector: Connector,
  bucketName: string,
  objectName: string,
  srcMsg: Omit<MsgPutPolicy, 'resource' | 'expirationTime'>[],
): Promise<ErrorResponse | [DeliverResponse, null] | [null, null, string[]]> => {
  const client = await getClient();

  const opts = await Promise.all(
    srcMsg.map((msg) =>
      client.object.putObjectPolicy(bucketName, objectName, msg).then(resolve, createTxFault),
    ),
  );

  if (opts.some(([opt, error]) => !!error)) return [null, E_OFF_CHAIN_AUTH];
  const _opts = opts.map((opt) => opt[0] as TxResponse);

  const groups = srcMsg
    .map((i, index) => ({
      type: i.principal!.type,
      value: i.principal!.value,
      index,
      tx: _opts[index],
    }))
    .filter((i) => i.type === PrincipalType.PRINCIPAL_TYPE_GNFD_GROUP);

  const ids = [];

  // todo
  for await (const group of groups) {
    if (!group.value.match(GROUP_ID)) {
      ids.push(group.value);
      continue;
    }
    const [s, e] = await group.tx.simulate({ denom: 'BNB' }).then(resolve, simulateFault);
    if (e?.includes('No such group')) {
      ids.push(group.value);
    }
  }

  if (ids.length) {
    return [null, null, ids];
  }

  const txs = await client.basic.multiTx(_opts);
  const [simulateInfo, simulateError] = await txs
    .simulate({ denom: 'BNB' })
    .then(resolve, simulateFault);
  if (simulateError) return [null, simulateError];
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: srcMsg[0].operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };
  return txs.broadcast(broadcastPayload).then(resolve, broadcastFault);
};

export const preExecDeleteObject = async (
  bucketName: string,
  objectName: string,
  address: string,
): Promise<ErrorResponse | [ISimulateGasFee, null]> => {
  const client = await getClient();
  const deleteBucketTx = await client.object.deleteObject({
    bucketName,
    objectName,
    operator: address,
  });
  const [data, error] = await deleteBucketTx
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);

  if (error) return [null, error];
  return [data!, null];
};

export const getObjectMeta = async (bucketName: string, objectName: string, endpoint: string) => {
  const url = `${generateUrlByBucketName(endpoint, bucketName)}/${encodeObjectName(
    objectName,
  )}?object-meta`;

  const errorHandle = async () => {
    return axios.get(url).catch(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(errorHandle());
        }, 1000);
      });
    });
  };

  return axios.get(url).catch(errorHandle);
};
