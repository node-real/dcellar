import { chains } from '@/context/WalletConnectContext/config/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

const trustWalletConnector = new InjectedConnector({
  chains,
  options: {
    name: 'Trust Wallet',
    shimDisconnect: true,
    getProvider: () => {
      try {
        if (typeof window !== 'undefined' && typeof window?.trustWallet !== 'undefined') {
          Object.defineProperty(window.trustWallet, 'removeListener', {
            value: window.trustWallet.off,
          });
          return window?.trustWallet;
        } else {
          return null;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Trust Wallet Provider Error:', e);
      }
    },
  },
});

const metaMaskConnector = new MetaMaskConnector({ chains });

export const connectors = [trustWalletConnector, metaMaskConnector];
