import { useWalletSwitchNetWork } from '@/context/WalletConnectContext';
import { useState } from 'react';
import { Connector, useAccount, useConnect, useDisconnect } from 'wagmi';
import { handleWalletError } from '@/context/WalletConnectContext/error/handleWalletError';

export interface UseWalletProps {
  chainId?: number;
  onSuccess?: (address?: string) => void;
  onConnectError?: (err: Error, args: any, context: unknown) => void;
  onSwitchNetworkError?: (err: Error, args: any, context: unknown) => void;
}

export function useWallet(props: UseWalletProps) {
  const { onSuccess, onConnectError, onSwitchNetworkError, chainId } = props;

  const { disconnect } = useDisconnect();
  const { isConnecting } = useAccount();

  const [connector, setConnector] = useState<Connector>();
  const [address, setAddress] = useState<string>();

  const { connect, connectors } = useConnect({
    onError: (...params) => {
      handleWalletError(...params);
      onConnectError?.(...params);
    },
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
    onError: (...params) => {
      handleWalletError(...params);
      onSwitchNetworkError?.(...params);
    },
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
