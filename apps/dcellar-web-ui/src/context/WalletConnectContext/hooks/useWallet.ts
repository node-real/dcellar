import { connectErrorHandler } from '@/context/WalletConnectContext/error/connectErrorHandler';
import { useWalletSwitchNetWork } from '@/context/WalletConnectContext';
import { useState } from 'react';
import { Connector, useAccount, useConnect, useDisconnect } from 'wagmi';

export interface UseWalletProps {
  chainId?: number;
  onSuccess?: (address?: string) => void;
}

export function useWallet(props: UseWalletProps) {
  const { onSuccess, chainId } = props;

  const { disconnect } = useDisconnect();
  const { isConnecting } = useAccount();

  const [connector, setConnector] = useState<Connector>();
  const [address, setAddress] = useState<string>();

  const { connect, connectors } = useConnect({
    onError: connectErrorHandler(),
    onSuccess: (data) => {
      setAddress(data.account);

      if (data.chain.id === chainId) {
        onSuccess?.(data.account);
      } else {
        switchNetwork?.(chainId);
      }
    },
  });

  const { switchNetwork, isLoading } = useWalletSwitchNetWork({
    onSuccess: () => {
      onSuccess?.(address);
    },
  });

  const onChangeConnector = (connector: Connector) => {
    disconnect();

    setTimeout(() => {
      setConnector(connector);
      connect({
        connector,
      });
    }, 200);
  };

  return {
    isLoading: isConnecting || isLoading,
    connector,
    connectors,
    onChangeConnector,
    disconnect,
  };
}
