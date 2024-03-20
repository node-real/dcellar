import { getClient } from '@/facade';
import { MsgCreateObject } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';

export const getCreateObjectTx = async (msgCreateObject: MsgCreateObject) => {
  const client = await getClient();
  return client.object.createObject(msgCreateObject);
};
