import { TCreateObject } from "@bnb-chain/greenfield-js-sdk";

export type TCreateObjectData = { CreateObjectTx: any; configParam: TCreateObject };

// Same as VisibilityType in @bnb-chain/greenfield-cosmos-types/greenfield/storage/common
export enum VisibilityType {
  VISIBILITY_TYPE_UNSPECIFIED = 0,
  VISIBILITY_TYPE_PUBLIC_READ = 1,
  VISIBILITY_TYPE_PRIVATE = 2,
  VISIBILITY_TYPE_INHERIT = 3,
  UNRECOGNIZED = -1,
}

export enum ChainVisibilityEnum {
  VISIBILITY_TYPE_UNSPECIFIED = 'VISIBILITY_TYPE_UNSPECIFIED',
  VISIBILITY_TYPE_PUBLIC_READ = 'VISIBILITY_TYPE_PUBLIC_READ',
  VISIBILITY_TYPE_PRIVATE = 'VISIBILITY_TYPE_PRIVATE',
  VISIBILITY_TYPE_INHERIT = 'VISIBILITY_TYPE_INHERIT',
  UNRECOGNIZED = 'UNRECOGNIZED',
}
