export interface IBucketItem {
  create_tx_hash: string;
  delete_at: string;
  delete_reason: string;
  operator: string;
  removed: boolean;
  // block height
  update_at: string;
  update_time: string;
  update_tx_hash: string;
  bucket_info: {
    billing_info: {
      price_time: string;
      total_charge_size: number;
      secondary_sp_objects_size: number[];
    }
    bucket_name: string;
    bucket_status: "0" | "1" | "2";
    charged_read_quota: string;
    create_at: string;
    id: string;
    owner: string;
    payment_address: string;
    primary_sp_address: string;
    source_type: number;
    visibility: number;
  };
}

export interface ITableItem {
  id: string;
  bucket_name: string;
  create_at: string;
  originalData: IBucketItem;
}