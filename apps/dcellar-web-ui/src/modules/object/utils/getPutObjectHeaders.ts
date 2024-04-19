import {
  AuthType,
  DelegatedPubObjectRequest,
  METHOD_PUT,
  PutObjectRequest,
  SpMetaInfo,
  verifyBucketName,
  verifyObjectName,
} from '@bnb-chain/greenfield-js-sdk';

import { getClient } from '@/facade';

/**
 * Generate headers for PUT object request.
 * @param putObjectRequest PUT object request data.
 * @param authType Authentication type.
 * @param endpoint API endpoint.
 * @returns Headers, URL, method, and params for the request.
 */
export const makePutObjectHeaders = async (
  { bucketName, objectName, txnHash, body }: PutObjectRequest,
  authType: AuthType,
  endpoint: string,
) => {
  const client = await getClient();

  verifyBucketName(bucketName);
  verifyObjectName(objectName);

  if (!txnHash) {
    throw new Error('Transaction hash is empty, please check.');
  }

  const method = METHOD_PUT;
  const params = new URLSearchParams();
  const contentType = body?.type || 'text/plain';
  const payload = { objectName, bucketName, txnHash, contentType, body };
  const { reqMeta, url } = await SpMetaInfo.getPutObjectMetaInfo(endpoint, payload);
  const headers = await client.spClient.signHeaders(reqMeta, authType);

  return { url, headers, method, params };
};

/**
 * Generate headers for delegated PUT object request.
 * @param delegatedPubObjectRequest Delegated PUT object request data.
 * @param authType Authentication type.
 * @param endpoint API endpoint.
 * @returns Headers, URL, method, and params for the request.
 */
export const makeDelegatePutObjectHeaders = async (
  { bucketName, objectName, body, delegatedOpts }: DelegatedPubObjectRequest,
  authType: AuthType,
  endpoint: string,
) => {
  const client = await getClient();

  verifyBucketName(bucketName);
  verifyObjectName(objectName);

  const method = METHOD_PUT;
  const params = new URLSearchParams();
  const contentType = body?.type || 'text/plain';
  const payload = { objectName, bucketName, contentType, body, delegatedOpts };
  const { reqMeta, url } = await SpMetaInfo.getPutObjectMetaInfo(endpoint, payload);
  const headers = await client.spClient.signHeaders(reqMeta, authType);

  return { url, headers, method, params };
};
