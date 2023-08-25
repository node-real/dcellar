import { getClient } from '@/base/client';
import { resolve } from '@/facade/common';
import { commonFault } from '@/facade/error';
import axios from 'axios';
import { SpMeta } from '@/store/slices/sp';

export const getStorageProviders = async () => {
  const client = await getClient();
  const start = performance.now();
  const [sps, error] = await client.sp.getStorageProviders().then(resolve, commonFault);
  return (sps || []).filter((sp) => sp.endpoint.startsWith('https'));
};

export const getSpMeta = async () => {
  const { data } = await axios.get<Array<SpMeta>>('/api/sp-meta');
  return data;
};
