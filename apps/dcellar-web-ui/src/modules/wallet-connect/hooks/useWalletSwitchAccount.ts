import { useEffect, useRef } from 'react';
import { ConnectorData, useAccount } from 'wagmi';

export type WalletSwitchAccountHandler = (data: ConnectorData) => void;

export function useWalletSwitchAccount(handler: WalletSwitchAccountHandler) {
  const { connector, address } = useAccount();

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const handler = (data: ConnectorData) => {
      if (address && data.account && address !== data.account) {
        handlerRef.current?.(data);
      }
    };

    connector?.on('change', handler);
    return () => {
      connector?.off('change', handler);
    };
  }, [connector, address]);
}
