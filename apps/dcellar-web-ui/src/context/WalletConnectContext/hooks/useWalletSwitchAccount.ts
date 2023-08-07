import { useSaveFuncRef } from '@/hooks/useSaveFuncRef';
import { useAsyncEffect } from 'ahooks';
import { useEffect } from 'react';
import { ConnectorData, useAccount } from 'wagmi';

export type WalletSwitchAccountHandler = (data: ConnectorData) => void;

export function useWalletSwitchAccount(handler: WalletSwitchAccountHandler) {
  const {address, connector } = useAccount();

  const handlerRef = useSaveFuncRef(handler);

  console.log(connector, '===')

  useEffect(() => {
    const onChange = (data: ConnectorData) => {
      console.log('useWalletSwitchAccount change', 'address: ', address, 'data: ', data)

      if (data.account && data.account !== address) {
        handlerRef.current?.(data);
      }
    };

    connector?.on('change', onChange);
    return () => {
      connector?.off('change', onChange);
    };
  }, [address, connector, handlerRef]);
}
