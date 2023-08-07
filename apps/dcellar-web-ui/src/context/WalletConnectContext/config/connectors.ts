import { chains } from '@/context/WalletConnectContext/config/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';


function getTrustWalletProvider() {
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
}

const trustWalletConnector = new InjectedConnector({
  chains,
  options: {
    name: 'Trust Wallet',
    shimDisconnect: true,
    getProvider: getTrustWalletProvider,
  },
});

const metaMaskConnector = new MetaMaskConnector({ chains });

// const metaMaskConnector = new InjectedConnector({
//   chains,
//   options: {
//     name: 'MetaMask',
//     shimDisconnect: true,
//     getProvider: () => {
//       if (typeof window === 'undefined') {
//         return;
//       }

//       // If trust wallet has already set as the default wallet, force using trust wallet
//       if (window.ethereum?.isTrustWallet) {
//         return getTrustWalletProvider()
//       }

//       return window.ethereum
//     }
//   },
// });

export const connectors = [trustWalletConnector, metaMaskConnector];
