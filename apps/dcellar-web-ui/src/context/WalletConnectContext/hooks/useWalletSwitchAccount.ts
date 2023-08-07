import { useSaveFuncRef } from '@/hooks/useSaveFuncRef';
import { useEffect } from 'react';
import { ConnectorData, useAccount } from 'wagmi';

export type WalletSwitchAccountHandler = (data: ConnectorData) => void;

export function useWalletSwitchAccount(handler: WalletSwitchAccountHandler) {
  const {address, connector } = useAccount();

  const handlerRef = useSaveFuncRef(handler);

  useEffect(() => {
    const handler = (data: ConnectorData) => {
      if (data.account && data.account !== address) {
        handlerRef.current?.(data);
      }
    };

    connector?.on('change', handler);
    return () => {
      connector?.off('change', handler);
    };
  }, [address, connector, handlerRef]);
}
