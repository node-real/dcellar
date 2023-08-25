import { getClient } from "@/base/client";
import { TCreateObject } from "@bnb-chain/greenfield-js-sdk";
import { AuthType } from "@bnb-chain/greenfield-js-sdk/dist/esm/api/spclient";

export const genCreateObjectTx = async (configParam: TCreateObject, authType: AuthType) => {
  const client = await getClient();
  const createObjectTx = await client.object.createObject(configParam, authType);

  return createObjectTx;
};
