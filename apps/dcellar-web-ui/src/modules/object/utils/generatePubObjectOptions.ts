import {
  AuthType,
  METHOD_PUT,
  PutObjectRequest,
  SpMetaInfo,
  isValidBucketName,
  isValidObjectName,
} from '@bnb-chain/greenfield-js-sdk';

import { getClient } from '@/facade';

export type TMakePutObjectHeaders = PutObjectRequest & {
  endpoint: string;
};
export const makePutObjectHeaders = async (
  configParam: TMakePutObjectHeaders,
  authType: AuthType,
) => {
  const client = await getClient();
  const { bucketName, objectName, txnHash, body, endpoint } = configParam;
  if (!isValidBucketName(bucketName)) {
    throw new Error('Error bucket name');
  }
  if (!isValidObjectName(objectName)) {
    throw new Error('Error object name');
  }
  if (!txnHash) {
    throw new Error('Transaction hash is empty, please check.');
  }
  const method = METHOD_PUT;
  const params = new URLSearchParams();
  const payload = {
    objectName,
    bucketName,
    txnHash,
    contentType: body.type || 'text/plain',
    body,
  };
  const { reqMeta, url } = await SpMetaInfo.getPutObjectMetaInfo(endpoint, payload);
  const headers = await client.spClient.signHeaders(reqMeta, authType);

  return {
    url,
    headers,
    method,
    params,
  };
};
