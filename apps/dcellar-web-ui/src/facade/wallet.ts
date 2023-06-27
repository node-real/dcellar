import { Connector } from 'wagmi';
import { signTypedDataV4 } from '@/utils/signDataV4';

export const signTypedDataCallback = (connector: Connector) => {
  return async (addr: string, message: string) => {
    const provider = await connector.getProvider();
    return await signTypedDataV4(provider, addr, message);
  };
};
