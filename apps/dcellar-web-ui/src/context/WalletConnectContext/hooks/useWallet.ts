import { connectErrorHandler } from '@/context/WalletConnectContext/error/connectErrorHandler';
import { useWalletSwitchNetWork } from '@/context/WalletConnectContext';
import { useState } from 'react';
import { Connector, useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi';

export interface UseWalletProps {
  chainId?: number;
  onSuccess?: () => void;
}

export function useWallet(props: UseWalletProps) {
  const { onSuccess, chainId } = props;

  const { chain } = useNetwork();
  const { disconnect } = useDisconnect();
  const { isConnecting } = useAccount();
  const [connector, setConnector] = useState<Connector>();

  const maybeSwitchNetwork = () => {
    if (chain?.id === chainId) {
      onSuccess?.();
    } else {
      switchNetwork?.(chainId);
    }
  };

  const { connect, connectors } = useConnect({
    onSuccess: maybeSwitchNetwork,
    onError: connectErrorHandler(),
  });

  const { switchNetwork, isLoading } = useWalletSwitchNetWork();

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
