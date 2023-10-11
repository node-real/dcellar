import { Chain } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

export type TrustWalletConnectorOptions = {
  shimDisconnect?: boolean;
};

export class TrustWalletConnector extends MetaMaskConnector {
  readonly id: any = 'trust';
  protected shimDisconnectKey = `${this.id}.shimDisconnect`;

  constructor({
    chains,
    options: _options,
  }: {
    chains?: Chain[];
    options?: TrustWalletConnectorOptions;
  } = {}) {
    const options = {
      name: 'Trust Wallet',
      shimDisconnect: true,
      UNSTABLE_shimOnConnectSelectAccount: true,
      getProvider: getTrustWalletProvider,
      ..._options,
    };

    super({
      chains,
      options,
    });
  }
}

function getTrustWalletProvider() {
  const isTrustWallet = (ethereum: any) => {
    return !!ethereum.isTrust;
  };

  const injectedProviderExist =
    typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  if (!injectedProviderExist) {
    return;
  }

  if (isTrustWallet(window.ethereum)) {
    return window.ethereum;
  }

  if (window.ethereum?.providers) {
    return window.ethereum.providers.find(isTrustWallet);
  }

  if (window.trustWallet && window.trustWallet.removeListener === undefined) {
    window.trustWallet.removeListener = window.trustWallet.off;
  }

  return window.trustWallet;
}
