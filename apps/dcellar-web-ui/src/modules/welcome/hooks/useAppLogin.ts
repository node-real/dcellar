import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useLogin } from '@/hooks/useLogin';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { checkOffChainDataAvailable, getOffChainList } from '@/modules/off-chain-auth/utils';
import { useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';

export function useAppLogin(address?: string) {
  const { chain } = useNetwork();
  const { isConnected } = useAccount();

  const { loginDispatch } = useLogin();
  const { isAuthPending, onOffChainAuth } = useOffChainAuth();

  useEffect(() => {
    if (isConnected && chain?.id === GREENFIELD_CHAIN_ID && address) {
      const offChainList = getOffChainList({ address });
      const isAvailable = checkOffChainDataAvailable(offChainList);

      if (!isAvailable) {
        onOffChainAuth(address).then((res: any) => {
          if (res.code === 0) {
            loginDispatch({
              type: 'LOGIN',
              payload: {
                address,
              },
            });
          }
        });
      } else {
        loginDispatch({
          type: 'LOGIN',
          payload: {
            address,
          },
        });
      }
    }
  }, [address, chain?.id, isConnected, loginDispatch, onOffChainAuth]);

  return {
    isAuthPending,
  };
}
