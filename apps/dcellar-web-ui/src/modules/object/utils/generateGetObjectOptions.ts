import dayjs from 'dayjs';
import { AuthType } from '@bnb-chain/greenfield-js-sdk/dist/esm/clients/spclient/spClient';
import { getClient } from '@/facade';

export interface getObjectPropsType {
  bucketName: string;
  objectName: string;
  duration?: number;
  endpoint?: string;
  address: string;
  seedString: string;
  view?: '0' | '1';
}

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
