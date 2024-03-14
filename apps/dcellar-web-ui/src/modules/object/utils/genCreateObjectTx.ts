import { AuthType, CreateObjectApprovalRequest } from '@bnb-chain/greenfield-js-sdk';

import { getClient } from '@/facade';

export const genCreateObjectTx = async (
  configParam: CreateObjectApprovalRequest,
  authType: AuthType,
) => {
  const client = await getClient();
  return client.object.createObject(configParam, authType);
};
