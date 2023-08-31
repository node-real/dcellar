// reference:
// https://github.com/pancakeswap/pancake-frontend/blob/38b13fd3c183851a02497330cec7efc0da2af091/packages/wagmi/connectors/trustWallet/trustWallet.ts#L49

import { getClient } from '@wagmi/core'
import { getAddress } from 'ethers/lib/utils.js'
import { InjectedConnector } from 'wagmi/connectors/injected'
import {
  Address,
  ConnectorNotFoundError,
  ResourceUnavailableError,
  RpcError,
  UserRejectedRequestError,
  Chain,
} from 'wagmi'

export type TrustWalletConnectorOptions = {
  shimDisconnect?: boolean
  shimChainChangedDisconnect?: boolean;
}


export class TrustWalletConnector extends InjectedConnector {
  readonly id = 'trust'
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
      shimDisconnect: _options?.shimDisconnect ?? false,
      shimChainChangedDisconnect: _options?.shimChainChangedDisconnect ?? true,
    }

    super({
      chains,
      options,
    })
  }

  private handleFailedConnect(error: Error): never {
    if (this.isUserRejectedRequestError(error)) {
      throw new UserRejectedRequestError(error)
    }

    if ((error as RpcError).code === -32002) {
      throw new ResourceUnavailableError(error)
    }

    throw error
  }

  async connect({ chainId }: { chainId?: number } = {}) {
    try {
      const provider = await this.getProvider()
      if (!provider) {
        throw new ConnectorNotFoundError()
      }

      if (provider.on) {
        provider.on('accountsChanged', this.onAccountsChanged)
        provider.on('chainChanged', this.onChainChanged)
        provider.on('disconnect', this.onDisconnect)
      }

      this.emit('message', { type: 'connecting' })

      // Attempt to show wallet select prompt with `wallet_requestPermissions` when
      // `shimDisconnect` is active and account is in disconnected state (flag in storage)
      let account: Address | null = null

      if (this.options?.shimDisconnect && !getClient().storage?.getItem(this.shimDisconnectKey)) {
        account = await this.getAccount().catch(() => null)
        const isConnected = !!account
        if (isConnected) {
          // Attempt to show another prompt for selecting wallet if already connected
          try {
            await provider.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }],
            })
            // User may have selected a different account so we will need to revalidate here.
            account = await this.getAccount()
          } catch (error) {
            // Only bubble up error if user rejects request
            if (this.isUserRejectedRequestError(error)) {
              throw new UserRejectedRequestError(error as Error)
            }
          }
        }
      }

      if (!account) {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        })
        account = getAddress(accounts[0] as Address)
      }

      // Switch to chain if provided
      let id = await this.getChainId()
      let unsupported = this.isChainUnsupported(id)
      if (chainId && id !== chainId) {
        const chain = await this.switchChain(chainId)
        id = chain.id
        unsupported = this.isChainUnsupported(id)
      }

      if (this.options?.shimDisconnect) {
        getClient().storage?.setItem(this.shimDisconnectKey, true)
      }

      return { account, chain: { id, unsupported }, provider }
    } catch (error) {
      this.handleFailedConnect(error as Error)
    }
  }

  async disconnect() {
    const provider: any = await this.getProvider()
    if (!provider?.off) return

    provider.off('accountsChanged', this.onAccountsChanged)
    provider.off('chainChanged', this.onChainChanged)
    provider.off('disconnect', this.onDisconnect)

    if (this.options.shimDisconnect) {
      getClient().storage?.removeItem(this.shimDisconnectKey)
    }
  }

  async getProvider() {
    return getTrustWalletProvider()
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
