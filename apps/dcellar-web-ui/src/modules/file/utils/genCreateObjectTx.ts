import { getClient } from '@/base/client';
import { AuthType } from '@bnb-chain/greenfield-js-sdk/dist/esm/clients/spclient/spClient';
import { CreateObjectApprovalRequest } from '@bnb-chain/greenfield-js-sdk';

export const genCreateObjectTx = async (
  configParam: CreateObjectApprovalRequest,
  authType: AuthType,
) => {
  const client = await getClient();
  return client.object.createObject(configParam, authType);
};
