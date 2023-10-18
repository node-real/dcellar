import { resolve } from '@/facade/common';
import { commonFault } from '@/facade/error';
import axios from 'axios';
import { SpMeta } from '@/store/slices/sp';
import { getClient } from '@/facade/index';

export const getStorageProviders = async (network?: 'mainnet') => {
  const client = await getClient(network);
  const [sps, error] = await client.sp.getStorageProviders().then(resolve, commonFault);
  return (sps || []).filter((sp) => sp.endpoint.startsWith('https'));
};

export const getSpMeta = async (network?: 'mainnet') => {
  const baseUrl = '/api/sp-meta';
  const url = network ? `${baseUrl}?network=${network}` : baseUrl;
  const { data } = await axios.get<Array<SpMeta>>(url);
  return data;
};
