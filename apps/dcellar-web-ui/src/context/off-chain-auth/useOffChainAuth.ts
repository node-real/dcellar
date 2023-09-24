import { useContext } from 'react';
import { OffChainAuthContext } from '@/context/off-chain-auth/OffChainAuthContext';

export const useOffChainAuth = () => {
  return useContext(OffChainAuthContext);
};
