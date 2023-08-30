import { Chain } from 'wagmi'
import { MetaMaskConnector as WagmiMetaMaskConnector  } from 'wagmi/connectors/metaMask';
import {
  getClient,
} from '@wagmi/core'

export type TrustWalletConnectorOptions = {
  shimDisconnect?: boolean
}

export class TrustWalletConnector extends WagmiMetaMaskConnector {
  readonly id: any = 'trust';

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
      getProvider: getTrustWalletProvider,
      ..._options,
    }

    super({
      chains,
      options,
    })
  }

  async disconnect() {
    super.disconnect()

    const provider: any = await this.getProvider()
    if (!provider?.off) return

    provider.off('accountsChanged', this.onAccountsChanged)
    provider.off('chainChanged', this.onChainChanged)
    provider.off('disconnect', this.onDisconnect)

    if (this.options.shimDisconnect) {
      getClient().storage?.removeItem(this.shimDisconnectKey)
    }
  }
}

export function getTrustWalletProvider() {
  const isTrustWallet = (ethereum: any) => {
    return !!ethereum.isTrust
  }

  const injectedProviderExist = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'

  if (!injectedProviderExist) {
    return
  }

  if (isTrustWallet(window.ethereum)) {
    return window.ethereum
  }

  if (window.ethereum?.providers) {
    return window.ethereum.providers.find(isTrustWallet)
  }

  return window.trustWallet
}
