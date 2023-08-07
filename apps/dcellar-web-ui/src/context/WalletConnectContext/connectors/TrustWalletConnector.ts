import { Chain } from 'wagmi'
import { MetaMaskConnector as WagmiMetaMaskConnector  } from 'wagmi/connectors/metaMask';

export type TrustWalletConnectorOptions = {
  id?: string;
  name?: string;
  shimDisconnect?: boolean
}

export class TrustWalletConnector extends WagmiMetaMaskConnector {
  readonly id: any = 'trustWallet';
  readonly name: string = ''
  protected shimDisconnectKey = `${this.id}.shimDisconnect`

  constructor({
    chains,
    options: _options,
  }: {
    chains?: Chain[]
    options?: TrustWalletConnectorOptions
  } = {}) {

    const options = {
      name: 'Trust Wallet',
      shimDisconnect: true,
      UNSTABLE_shimOnConnectSelectAccount: true,
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
      ..._options,
    }

    super({
      chains,
      options,
    })

    this.name = options.name || this.name
    this.id = options.id || this.id
    this.shimDisconnectKey = `${this.id}.shimDisconnect`
  }
}