import { OffChainAuthContext } from '@/modules/off-chain-auth/OffChainAuthContext';
import { useContext } from 'react';

export const useOffChainAuth = () => {
  return useContext(OffChainAuthContext);
};
