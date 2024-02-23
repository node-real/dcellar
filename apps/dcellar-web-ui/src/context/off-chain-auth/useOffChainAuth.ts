import { OffChainAuthContext } from '@/context/off-chain-auth/OffChainAuthContext';
import { useContext } from 'react';

export const useOffChainAuth = () => {
  return useContext(OffChainAuthContext);
};
