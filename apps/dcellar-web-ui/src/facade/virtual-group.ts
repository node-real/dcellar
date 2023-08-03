import { getClient } from "@/base/client";
import {
  QueryGlobalVirtualGroupFamilyRequest,
  QueryGlobalVirtualGroupFamilyResponse
} from "@bnb-chain/greenfield-cosmos-types/greenfield/virtualgroup/query";
import { resolve } from "./common";
import { ErrorResponse, commonFault } from "./error";

export const getVirtualGroupFamily = async (params: QueryGlobalVirtualGroupFamilyRequest): Promise<ErrorResponse | [QueryGlobalVirtualGroupFamilyResponse, null]> => {
  const client = await getClient();
  return await client.virtualGroup.getGlobalVirtualGroupFamily(params).then(resolve, commonFault)
}

export const getSpUrlByBucketName = async (bucketName: string): Promise<ErrorResponse | [string, null]> => {
  const client = await getClient();

  return await client.sp.getSPUrlByBucket(bucketName).then(resolve, commonFault)
}