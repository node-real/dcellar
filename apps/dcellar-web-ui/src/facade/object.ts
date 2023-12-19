import {
  generateUrlByBucketName,
  GRNToString,
  IQuotaProps,
  ISimulateGasFee,
  ListObjectsByBucketNameRequest,
  ListObjectsByBucketNameResponse,
  newBucketGRN,
  newObjectGRN,
  PermissionTypes,
  SpResponse,
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
import { signTypedDataCallback } from '@/facade/wallet';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { quotaRemains } from '@/facade/bucket';
import { ObjectInfo, ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { encodeObjectName } from '@/utils/string';
import axios from 'axios';
import { SpItem } from '@/store/slices/sp';
import {
  QueryHeadObjectResponse,
  QueryLockFeeRequest,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import {
  ActionType,
  Principal,
  PrincipalType,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/common';
import { XMLParser } from 'fast-xml-parser';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { getClient } from '@/facade/index';
import { generateGetObjectOptions } from '@/modules/object/utils/generateGetObjectOptions';
import { batchDownload, directlyDownload } from '@/modules/object/utils';
import { GROUP_ID } from '@/constants/legacy';

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

  if (objectName.endsWith('/')) {
    // todo lack of verify api
    return client.bucket
      .getVerifyPermission(bucketName, loginAccount, PermissionTypes.ActionType.ACTION_GET_OBJECT)
      .catch(() => ({
        effect: PermissionTypes.Effect.EFFECT_DENY,
      }));
  }

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
  const [info, quota, error] = await getObjectInfoAndBucketQuota(params);
  if (['bad signature', 'invalid signature', 'user public key is expired'].includes(error || '')) {
    return [false, E_OFF_CHAIN_AUTH];
  }
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

  // only own can get bucket quota
  if (loginAccount === info.owner) {
    if (!quota) return [false, E_UNKNOWN];
    if (!quotaRemains(quota, size)) return [false, E_NO_QUOTA, undefined, quota];
  }
  return [true, '', info, quota!];
};

export type DownloadPreviewParams = {
  objectInfo: { bucketName: string; objectName: string; visibility: number };
  primarySp: SpItem;
  address: string;
};

export const getAuthorizedLink = async (
  params: DownloadPreviewParams,
  seedString: string,
  view?: '0' | '1',
): Promise<[null, ErrorMsg] | [string]> => {
  const { address, objectInfo, primarySp } = params;
  const { bucketName, objectName } = objectInfo;
  const [url, error] = await generateGetObjectOptions({
    bucketName,
    objectName,
    address,
    view,
    seedString,
    endpoint: primarySp.endpoint,
  }).then(resolve, commonFault);
  if (!url) return [null, error!];
  return [url];
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

  const [url, error] = await getAuthorizedLink(params, seedString, '0');
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

export const getListObjects = async (
  params: ListObjectsByBucketNameRequest,
): Promise<[SpResponse<ListObjectsByBucketNameResponse>, null] | ErrorResponse> => {
  const client = await getClient();
  const [res, error] = await client.object.listObjects(params).then(resolve, commonFault);
  if (!res || error) return [null, error];

  return [res, null];
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

export const deleteObjectPolicy = async (
  connector: Connector,
  bucketName: string,
  objectName: string,
  operator: string,
  principalAddrs: string[],
): Promise<ErrorResponse | [DeliverResponse, null]> => {
  const client = await getClient();

  const resource = objectName.endsWith('/')
    ? GRNToString(newBucketGRN(bucketName))
    : GRNToString(newObjectGRN(bucketName, objectName));

  const principals: Principal[] = principalAddrs.map((principalAddr) => {
    return {
      type: principalAddr.match(GROUP_ID)
        ? PrincipalType.PRINCIPAL_TYPE_GNFD_GROUP
        : PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
      value: principalAddr,
    };
  });

  const tasks = await Promise.all(
    principals.map((principal) =>
      client.storage
        .deletePolicy({
          resource,
          principal,
          operator,
        })
        .then(resolve, createTxFault),
    ),
  );

  for (const [opt, error] of tasks) {
    if (!!error) return [null, error];
  }

  const _tasks = tasks.map((task) => task[0] as TxResponse);

  const txs = await client.txClient.multiTx(_tasks);

  const [simulateInfo, simulateError] = await txs
    .simulate({ denom: 'BNB' })
    .then(resolve, simulateFault);

  if (!simulateInfo) return [null, simulateError];

  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };
  return txs.broadcast(broadcastPayload).then(resolve, broadcastFault);
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

  for (const [opt, error] of opts) {
    if (!!error) return [null, error];
  }

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

  const txs = await client.txClient.multiTx(_opts);
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

export const putBucketPolicies = async (
  connector: Connector,
  bucketName: string,
  srcMsg: Omit<MsgPutPolicy, 'resource' | 'expirationTime'>[],
  deleted: { p: Principal; r: string }[],
  operator: string,
): Promise<ErrorResponse | [DeliverResponse, null] | [null, null, string[]]> => {
  const client = await getClient();

  const opts = await Promise.all(
    srcMsg.map((msg) =>
      client.bucket.putBucketPolicy(bucketName, msg).then(resolve, createTxFault),
    ),
  );

  for (const [opt, error] of opts) {
    if (!!error) return [null, error];
  }

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

  // todo need delete legacy policy
  const deleteTasks = await Promise.all(
    deleted.map(({ p, r }) =>
      client.storage
        .deletePolicy({
          resource: r,
          principal: p,
          operator,
        })
        .then(resolve, createTxFault),
    ),
  );

  for (const [opt3, error3] of deleteTasks) {
    if (!!error3) return [null, error3];
  }

  const _tasks = deleteTasks.map((task) => task[0] as TxResponse);

  const txs = await client.txClient.multiTx([..._tasks, ..._opts]);
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

export const legacyGetObjectMeta = async (
  bucketName: string,
  objectName: string,
  endpoint: string,
) => {
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

export const xmlParser = new XMLParser({
  numberParseOptions: {
    hex: false,
    leadingZeros: true,
    eNotation: false,
  },
});

export const getObjectMeta = async (
  bucketName: string,
  objectName: string,
  endpoint: string,
): Promise<[ObjectMeta, null] | [null, { code: number; message: string }]> => {
  const url = `${generateUrlByBucketName(endpoint, bucketName)}/${encodeObjectName(
    objectName,
  )}?object-meta`;

  return axios.get(url).then(
    (e) => {
      const data = xmlParser.parse(e.data)?.GfSpGetObjectMetaResponse.Object as ObjectMeta;
      return [data, null];
    },
    (e) => {
      const { response } = e;
      if (!response) return [null, { code: 500, message: 'Oops, something went wrong' }];

      const error =
        response?.status === 429
          ? { code: response.status, message: 'SP not available. Try later.' }
          : { message: xmlParser.parse(response.data)?.Error?.Message, code: response.status };
      return [null, error];
    },
  );
};

export const updateObjectTags = async ({ address, bucketName, objectName, tags }: { address: string; bucketName: string; objectName: string; tags: ResourceTags_Tag[] }) => {
  const client = await getClient();
  const resource = GRNToString(newObjectGRN(bucketName, objectName));
  const [tx, error1] = await client.storage.setTag({
    operator: address,
    resource,
    tags: {
      tags: tags
    }
  }).then(resolve, createTxFault);
  if (!tx) return [null, error1];

  const [simulate, error2] = await tx.simulate({ denom: 'BNB' }).then(resolve, simulateFault);
  if (!simulate) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulate.gasLimit),
    gasPrice: simulate.gasPrice,
    payer: address,
    granter: ''
  };

  return tx.broadcast(payload).then(resolve, broadcastFault);
}