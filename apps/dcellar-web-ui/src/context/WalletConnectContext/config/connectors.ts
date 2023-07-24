import { chains } from '@/context/WalletConnectContext/config/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

function getMetaMaskConnector() {
  if (typeof window === 'undefined') {
    return;
  }

  // If trust wallet is already set as the default wallet, force using trustwallet
  if (window.ethereum?.isTrustWallet) {
    console.log('use trust wallet')

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

  console.log('use metamask')

  return new MetaMaskConnector({ chains })
}

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

const metaMaskConnector = getMetaMaskConnector()

export const connectors = [trustWalletConnector, metaMaskConnector] as InjectedConnector[];
