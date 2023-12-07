import { get } from '@/base/http';
import { ErrorResponse, commonFault } from './error';
import { NFTMetaDataType } from '@/store/slices/toolbox';

export const getMetadata = (url: string): Promise<[NFTMetaDataType, null] | ErrorResponse> => {
  return get({ url }).then(res => {
    return [res, null]
  }, commonFault)
}