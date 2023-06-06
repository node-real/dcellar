import { client } from "@/base/client";
import { GET_APPROVAL_INTERVAL } from "@/constants/common";
import { TCreateObject } from "@bnb-chain/greenfield-chain-sdk";

export const genCreateObjectTx = async (configParam: TCreateObject) => {
  const createBucketTx = await client.object.createObject(configParam);

  return createBucketTx;
}