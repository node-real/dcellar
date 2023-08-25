import { ChainVisibilityEnum } from "../file/type";

export type TNameFieldValue = {
  bucketName: string;
};
export type TCreateBucketFromValues = TNameFieldValue;

export interface IApprovalCreateBucket {
  BucketName: string;
  creator: string;
  visibility: ChainVisibilityEnum;
  PrimarySpAddress: string;
  primary_sp_approval: {
    expired_height: string;
    sig: string;
  };
  ChargedReadQuota: number;
  RedundancyType: string;
}

export interface IRawSPInfo {
  approvalAddress: string;
  endpoint: string;
  fundingAddress: string;
  gcAddress: string;
  operatorAddress: string;
  sealAddress: string;
  status: number;
  totalDeposit: string;
  description: {
    details: string;
    identity: string;
    moniker: string;
    securityContact: string;
    website: string;
  }
}
