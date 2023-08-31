import { getObjectPropsType } from './file';
import { getClient } from '@/base/client';
import dayjs from 'dayjs';
import { AuthType } from '@bnb-chain/greenfield-js-sdk/dist/esm/clients/spclient/spClient';

export const generateGetObjectOptions = async (
  configParam: getObjectPropsType,
): Promise<string> => {
  const {
    bucketName,
    objectName,
    address,
    seedString,
    view = '1',
    duration = 24 * 60 * 60,
    endpoint,
  } = configParam;
  const client = await getClient();
  const auth: AuthType = {
    type: 'EDDSA',
    address: address,
    domain: window.location.origin,
    seed: seedString,
  };
  const queryMap = {
    view,
    'X-Gnfd-User-Address': address,
    'X-Gnfd-App-Domain': window.location.origin,
    'X-Gnfd-Expiry-Timestamp': dayjs().add(duration, 'second').toISOString(),
  };
  return client.object.getObjectPreviewUrl({ bucketName, objectName, queryMap, endpoint }, auth);
};
