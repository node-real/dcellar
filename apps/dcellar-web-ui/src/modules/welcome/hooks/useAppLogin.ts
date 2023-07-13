import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { useAccount, useNetwork } from 'wagmi';
import { useAppDispatch } from '@/store';
import { checkOffChainDataAvailable, setLogin } from '@/store/slices/persist';
import { useAsyncEffect } from 'ahooks';

export function useAppLogin(address?: string) {
  const dispatch = useAppDispatch();
  const { chain } = useNetwork();
  const { isConnected } = useAccount();
  const { isAuthPending, onOffChainAuth } = useOffChainAuth();

  useAsyncEffect(async () => {
    if (isConnected && chain?.id === GREENFIELD_CHAIN_ID && address) {
      const isAvailable = await dispatch(checkOffChainDataAvailable(address));

      if (!isAvailable) {
        const res = await onOffChainAuth(address);
        if (res.code !== 0) return;
        dispatch(setLogin(address));
      } else {
        dispatch(setLogin(address));
      }
    }
  }, [address, chain?.id, isConnected, onOffChainAuth, dispatch]);

  return { isAuthPending };
}
