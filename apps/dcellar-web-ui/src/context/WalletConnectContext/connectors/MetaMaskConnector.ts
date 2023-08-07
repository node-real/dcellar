import { getTrustWalletProvider } from '@/context/WalletConnectContext/connectors/TrustWalletConnector';
import { MetaMaskConnector as WagmiMetaMaskConnector  } from 'wagmi/connectors/metaMask';


export class MetaMaskConnector extends WagmiMetaMaskConnector {
  async getProvider() {
    const provider = await super.getProvider()

    if (provider?.isTrust) {
      return getTrustWalletProvider()
    }

    return provider
  }
}