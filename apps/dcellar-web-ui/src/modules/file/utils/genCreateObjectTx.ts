import { getClient } from "@/base/client";
import { TBaseGetCreateObject } from "@bnb-chain/greenfield-js-sdk";
import { AuthType } from "@bnb-chain/greenfield-js-sdk/dist/esm/clients/spclient/spClient";

export const genCreateObjectTx = async (configParam: TBaseGetCreateObject, authType: AuthType) => {
  const client = await getClient();
  const createObjectTx = await client.object.createObject(configParam, authType);

  return createObjectTx;
};
