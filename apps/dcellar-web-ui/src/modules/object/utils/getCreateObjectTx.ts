import { getClient } from '@/facade';
import { MsgCreateObject } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';

/**
 * Get transaction for creating an object.
 * @param msgCreateObject Message for creating an object.
 * @returns Transaction object.
 */
export const getCreateObjectTx = async (msgCreateObject: MsgCreateObject) => {
  const client = await getClient();
  return client.object.createObject(msgCreateObject);
};
