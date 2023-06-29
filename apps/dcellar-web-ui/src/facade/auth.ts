import { checkSpOffChainDataAvailable, getSpOffChainData } from '@/modules/off-chain-auth/utils';

export const authDataValid = async (address: string, spAddress: string) => {
  const data = await getSpOffChainData({ address, spAddress });
  return checkSpOffChainDataAvailable(data);
};
