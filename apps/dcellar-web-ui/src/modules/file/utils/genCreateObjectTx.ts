import { getClient } from "@/base/client";
import { TCreateObject } from "@bnb-chain/greenfield-chain-sdk";

export const genCreateObjectTx = async (configParam: TCreateObject) => {
  const client = await getClient();
  const createObjectTx = await client.object.createObject(configParam);

  return createObjectTx;
}