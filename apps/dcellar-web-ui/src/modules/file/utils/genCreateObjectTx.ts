import { client } from "@/base/client";
import { memorize } from "@/base/http/utils/memorize";
import { GET_APPROVAL_INTERVAL } from "@/constants/common";
import { TCreateObject } from "@bnb-chain/greenfield-chain-sdk";

export const genCreateObjectTx = memorize({
  fn: async (configParam: TCreateObject) => {
    const createBucketTx = await client.object.createObject(configParam);

    return createBucketTx;
  },
  expirationMs: GET_APPROVAL_INTERVAL
})
