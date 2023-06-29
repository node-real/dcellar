import { getClient } from '@/base/client';
import { resolve } from '@/facade/common';
import { commonFault } from '@/facade/error';

export const getStorageProviders = async () => {
  const client = await getClient();
  const [sps] = await client.sp.getStorageProviders().then(resolve, commonFault);
  return (sps || []).filter((sp) => sp.endpoint.startsWith('https'));
};
