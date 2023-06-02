export type TNameFieldValue = {
  bucketName: string;
};
export type TCreateBucketFromValues = TNameFieldValue;

export interface IApprovalCreateBucket {
  bucket_name: string;
  creator: string;
  visibility: string;
  primary_sp_address: string;
  primary_sp_approval: {
    expired_height: string;
    sig: string;
  };
  charged_read_quota: number;
  redundancy_type: string;
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
