import { WagmiConfig, createClient } from 'wagmi';
import { provider, webSocketProvider } from '@/modules/wallet-connect/config/chains';
import { connectors } from '@/modules/wallet-connect/config/connectors';

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
  connectors,
});

export interface WalletConnectProviderProps {
  children: React.ReactNode;
}

export function WalletConnectProvider(props: WalletConnectProviderProps) {
  const { children } = props;

  return <WagmiConfig client={client}>{children}</WagmiConfig>;
}
