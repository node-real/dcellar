import { chains } from '@/context/WalletConnectContext/config/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';

const metaMaskConnector = new InjectedConnector({
  chains,
  options: {
    name: 'MetaMask',
    shimDisconnect: true,
    getProvider: () => {
      if (typeof window === 'undefined') {
        return;
      }
      // If trust wallet is already set as the default wallet, force using trustwallet
      if (window.ethereum?.isTrustWallet) {
        return window.trustwallet
      }
      return window.ethereum
    }
  },
});

const trustWalletConnector = new InjectedConnector({
  chains,
  options: {
    name: 'Trust Wallet',
    shimDisconnect: true,
    getProvider: () => {
      if (typeof window === 'undefined') {
        return;
      }
      if (window.trustwallet) {
        Object.defineProperty(window.trustwallet, 'removeListener', {
          value: window.trustwallet.off,
        });
      }
      return window.trustwallet
    }
  },
});

export const connectors = [trustWalletConnector, metaMaskConnector];
