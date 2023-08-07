import { Chain, ConnectorNotFoundError, ResourceUnavailableError, RpcError, UserRejectedRequestError } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { Address, getClient } from '@wagmi/core'
import { getAddress } from '@ethersproject/address'

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


export class TrustWalletConnector extends InjectedConnector {
  readonly id = 'trustWallet'

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

      let account: Address | null = null
      if (this.options?.shimDisconnect && !getClient().storage?.getItem(this.shimDisconnectKey)) {
        account = await this.getAccount().catch(() => null)
        const isConnected = !!account
        if (isConnected) {
          try {
            await provider.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }],
            })
            account = await this.getAccount()
          } catch (error) {
            if (this.isUserRejectedRequestError(error)) {
              throw new UserRejectedRequestError(error)
            }
          }
        }
      }

      if (!account) {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        })
        account = getAddress(accounts[0] as string)
      }

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

  async getProvider() {
    return getTrustWalletProvider()
  }
}