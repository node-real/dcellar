import { WagmiConfig, createClient } from 'wagmi';
import { provider, webSocketProvider } from '@/context/WalletConnectContext/config/chains';
import { connectors } from '@/context/WalletConnectContext/config/connectors';

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
