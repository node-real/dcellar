import { EMPTY_STRING_SHA256, METHOD_PUT, ReqMeta, TBasePutObject, isValidBucketName, isValidObjectName, isValidUrl } from '@bnb-chain/greenfield-js-sdk';
import {
  generateUrlByBucketName,
  putObjectPropsType,
  requestParamsType,
  validateBucketName,
  validateObjectName,
} from './file';
import { getClient } from '@/base/client';
import { encodeObjectName } from '@/utils/string';
import { AuthType } from '@bnb-chain/greenfield-js-sdk/dist/esm/api/spclient';


// Function to download object
export const generatePutObjectOptions = async (
  configParam: putObjectPropsType,
): Promise<requestParamsType> => {
  const { bucketName, objectName, txnHash, endpoint, domain, userAddress, seedString } =
    configParam;
  if (!isValidUrl(endpoint)) {
    throw new Error('Invalid endpoint');
  }
  validateBucketName(bucketName);
  validateObjectName(objectName);
  if (!txnHash) {
    throw new Error('Transaction hash is empty, please check.');
  }
  const url = generateUrlByBucketName(endpoint, bucketName) + '/' + encodeObjectName(objectName);
  const client = await getClient();
  const { code, body } = await client.offchainauth.sign(seedString);
  if (code !== 0) {
    throw new Error('Failed to sign');
  }
  const headers = new Headers({
    Authorization: body?.authorization || '',
    'X-Gnfd-Txn-hash': txnHash,
    'X-Gnfd-User-Address': userAddress,
    'X-Gnfd-App-Domain': domain,
  });
  const params = new URLSearchParams();

  return {
    url,
    headers,
    method: 'put',
    params,
  };
};

export type TMakePutObjectHeaders = TBasePutObject & {
  endpoint: string;
}
export const makePutObjectHeaders = async (configParam: TMakePutObjectHeaders, authType: AuthType) => {
  const client = await getClient();
  const { bucketName, objectName, txnHash, body, duration = 30000 } = configParam;
  if (!isValidBucketName(bucketName)) {
    throw new Error('Error bucket name');
  }
  if (!isValidObjectName(objectName)) {
    throw new Error('Error object name');
  }
  if (!txnHash) {
    throw new Error('Transaction hash is empty, please check.');
  }
  const endpoint = await client.sp.getSPUrlByBucket(bucketName);
  const path = `/${objectName}`;
  const query = '';
  const url = generateUrlByBucketName(endpoint, bucketName) + '/' + encodeObjectName(objectName);
  const method = METHOD_PUT;
  const params = new URLSearchParams();
  const reqMeta: Partial<ReqMeta> = {
    contentSHA256: EMPTY_STRING_SHA256,
    txnHash: txnHash,
    method,
    url: {
      hostname: new URL(url).hostname,
      query,
      path,
    },
    contentType: body.type || 'text/plain',
  };
  const headers = await client.spClient.makeHeaders(reqMeta, authType);

  return {
    url,
    headers,
    method,
    params,
  }
}