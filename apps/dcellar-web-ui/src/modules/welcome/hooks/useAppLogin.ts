import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useLogin } from '@/hooks/useLogin';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { checkOffChainDataAvailable, getOffChainData } from '@/modules/off-chain-auth/utils';
import { useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';

export function useAppLogin() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { isAuthPending, onOffChainAuth } = useOffChainAuth();
  const { loginDispatch } = useLogin();

  useEffect(() => {
    if (isConnected && address && chain?.id === GREENFIELD_CHAIN_ID) {
      const offChainData = getOffChainData(address);
      const isAvailable = checkOffChainDataAvailable(offChainData);

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
