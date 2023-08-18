import { generateUrlByBucketName, isValidUrl } from '@bnb-chain/greenfield-js-sdk';
import {
  getObjectPropsType,
  requestParamsType,
  validateBucketName,
  validateObjectName,
} from './file';
import { getClient } from '@/base/client';
import { encodeObjectName } from '@/utils/string';

export const generateGetObjectOptions = async (
  configParam: getObjectPropsType,
): Promise<requestParamsType> => {
  const { bucketName, objectName, endpoint, userAddress, domain, seedString } = configParam;
  if (!isValidUrl(endpoint)) {
    throw new Error('Invalid endpoint');
  }
  validateBucketName(bucketName);
  validateObjectName(objectName);
  const url = generateUrlByBucketName(endpoint, bucketName) + '/' + encodeObjectName(objectName);
  const client = await getClient();
  const { code, body } = await client.offchainauth.sign(seedString);
  if (code !== 0) {
    throw new Error('Failed to sign');
  }
  const headers = new Headers({
    Authorization: body?.authorization || '',
    'X-Gnfd-User-Address': userAddress,
    'X-Gnfd-App-Domain': domain,
  });

  const params = new URLSearchParams();
  params.append('authorization', body?.authorization || '');
  params.append('user-address', userAddress);
  params.append('app-domain', domain);

  return {
    url,
    headers,
    method: 'get',
    params,
  };
};
