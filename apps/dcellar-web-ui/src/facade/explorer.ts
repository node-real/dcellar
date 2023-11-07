import { get } from '@/base/http';
import { ErrorResponse, commonFault } from './error';
import { chunkNum } from '@/utils/common';

export type GetTxListByObjectIdParams = {
  page: number;
  per_page: number;
  id: string;
  max_height?: number;
}
export type TxItem = {
  hash: string;
  height: number;
  index: number;
  time: string;
  tx: string;
  tx_type: string;
  tx_result: {
    code: number;
    fee: string;
    gas_used: number;
    gas_wanted: number;
    log: string;
    messages: string;
    type: string;
  };
  proof: {
    data: string[];
    proof: {
      aunts: string[][];
      index: 0;
      leaf_hash: string;
      total: string;
    };
    root_hash: string[];
  };
}
export type GetTxListByObjectIdResponse = TxItem[];

export const getTxListByObjectId = (params: GetTxListByObjectIdParams): Promise<ErrorResponse | [GetTxListByObjectIdResponse, null]> => {
  const url = `/api/tx/list/by_object/${params.id}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null]
  }, commonFault);
}

export const getTxListCountByObjectId = (id: string): Promise<[number, null] | ErrorResponse> => {
  const url = `/api/tx/count/by_object/${id}`;

  return get({ url }).then((e) => {
    return [e.result, null]
  }, commonFault);
}
