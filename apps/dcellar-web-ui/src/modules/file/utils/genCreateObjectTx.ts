import { client } from "@/base/client";
import { TCreateObject } from "@bnb-chain/greenfield-chain-sdk";

export const genCreateObjectTx = async (configParam: TCreateObject) => {
  const createBucketTx = await client.object.createObject(configParam);

  return createBucketTx;
}