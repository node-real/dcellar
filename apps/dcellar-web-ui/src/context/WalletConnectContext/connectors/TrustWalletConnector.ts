import { Chain } from 'wagmi'
import { MetaMaskConnector as WagmiMetaMaskConnector  } from 'wagmi/connectors/metaMask';

export function getTrustWalletProvider() {
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

export type TrustWalletConnectorOptions = {
  shimDisconnect?: boolean
}


export class TrustWalletConnector extends WagmiMetaMaskConnector {
  readonly id: any = 'trustWallet'

  constructor({
    chains,
    options: options_,
  }: {
    chains?: Chain[]
    options?: TrustWalletConnectorOptions
  } = {}) {
      
    const options = {
      name: 'Trust Wallet',
      shimDisconnect: true,
      getProvider: getTrustWalletProvider,
      ...options_,
    }

    super({
      chains,
      options,
    })
  }
}