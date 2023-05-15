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
