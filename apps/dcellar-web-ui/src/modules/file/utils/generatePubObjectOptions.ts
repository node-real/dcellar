import { isValidUrl } from '@bnb-chain/greenfield-chain-sdk';
import {
  generateUrlByBucketName,
  putObjectPropsType,
  requestParamsType,
  validateBucketName,
  validateObjectName,
} from './file';
import { getClient } from '@/base/client';
import { encodeObjectName } from '@/utils/string';

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
