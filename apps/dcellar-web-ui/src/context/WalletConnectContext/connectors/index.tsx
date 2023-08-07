import { chains } from '@/context/WalletConnectContext/chains';
import { MetaMaskConnector } from '@/context/WalletConnectContext/connectors/MetaMaskConnector';
import { TrustWalletConnector } from '@/context/WalletConnectContext/connectors/TrustWalletConnector';

function getMetaMaskConnector() {
  if (typeof window !== 'undefined' && window.ethereum?.isTrustWallet) {
    return new TrustWalletConnector({
      chains,
      options: {
        id: 'metaMask',
        name: 'MetaMask'
      }
    })
  }

  return new MetaMaskConnector({ chains })
}

const trustWalletConnector = new TrustWalletConnector({ chains })
const metaMaskConnector = getMetaMaskConnector()

export const connectors = [trustWalletConnector, metaMaskConnector];
