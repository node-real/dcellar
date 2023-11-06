import { WagmiConfig, createClient } from 'wagmi';
import { bscChain, greenFieldChain } from '@/context/WalletConnectContext/chains';
import {
  ConnectWalletOptions,
  ConnectWalletProvider,
  getDefaultConfig,
  metaMask,
  SwitchNetworkModal,
  trust,
} from '@totejs/connect-wallet';
import { GREENFIELD_CHAIN_ID } from '@/base/env';

const client = createClient(
  getDefaultConfig({
    chains: [bscChain, greenFieldChain],
    appName: 'Connect a Wallet',
    autoConnect: true,
    /* WC 2.0 requires a project ID (get one here: https://cloud.walletconnect.com/sign-in) */
    walletConnectProjectId: '7c6812d64a55a1438dce3c5b650dca8c',
    connectors: [trust(), metaMask()],
  }),
);

const connectWalletOptions: ConnectWalletOptions = {
  initialChainId: GREENFIELD_CHAIN_ID,
};

export interface WalletConnectProviderProps {
  children: React.ReactNode;
}

export function WalletConnectProvider(props: WalletConnectProviderProps) {
  const { children } = props;

  return (
    <WagmiConfig client={client}>
      <ConnectWalletProvider options={connectWalletOptions}>
        {children}
        <SwitchNetworkModal />
      </ConnectWalletProvider>
    </WagmiConfig>
  );
}
