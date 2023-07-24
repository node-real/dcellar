import { chains } from '@/context/WalletConnectContext/config/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

function getMetaMaskConnector() {
  // If trust wallet is already set as the default wallet, force using trustwallet
  if (typeof window !== 'undefined' && window.ethereum?.isTrustWallet) {
    return new InjectedConnector({
      chains,
      options: {
        name: 'MetaMask',
        shimDisconnect: true,
        getProvider: () => {
          if (typeof window === 'undefined') {
            return;
          }
          return window.trustwallet ?? window.ethereum
        }
      },
    });
  }

  return new MetaMaskConnector({ chains })
}

const trustWalletConnector = new InjectedConnector({
  chains,
  options: {
    name: 'Trust Wallet',
    shimDisconnect: true,
    getProvider: () => (typeof window !== 'undefined' ? window.trustwallet : undefined),
  },
});

const metaMaskConnector = getMetaMaskConnector()

export const connectors = [trustWalletConnector, metaMaskConnector] as InjectedConnector[];
