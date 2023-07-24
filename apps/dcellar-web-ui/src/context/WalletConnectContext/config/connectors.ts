import { chains } from '@/context/WalletConnectContext/config/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

const trustWalletConnector = new InjectedConnector({
  chains,
  options: {
    name: 'Trust Wallet',
    shimDisconnect: true,
    getProvider: () => (typeof window !== 'undefined' ? window.trustwallet : undefined),
  },
});

const metalMaskConnector = new MetaMaskConnector({ chains });

export const connectors = [trustWalletConnector, metalMaskConnector];
