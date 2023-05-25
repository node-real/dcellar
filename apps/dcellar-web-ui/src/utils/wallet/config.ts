import { Chain, configureChains } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { publicProvider } from 'wagmi/providers/public';

import {
  BSC_CHAIN_ID,
  BSC_RPC_URL,
  GREENFIELD_CHAIN_RPC_URL,
  GREENFIELD_CHAIN_ID,
  runtimeEnv,
} from '@/base/env';

const greenFieldChain: Chain = {
  id: GREENFIELD_CHAIN_ID,
  network: 'greenfield',
  rpcUrls: {
    default: {
      http: [GREENFIELD_CHAIN_RPC_URL],
    },
    public: {
      http: [GREENFIELD_CHAIN_RPC_URL],
    },
  },
  name: runtimeEnv === 'prod' ? 'greenfield testnet' : `${runtimeEnv} - greenfield`,
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
};

const bscChain: Chain = {
  id: BSC_CHAIN_ID,
  network: 'greenfield bsc',
  rpcUrls: {
    default: {
      http: [BSC_RPC_URL],
    },
    public: {
      http: [BSC_RPC_URL],
    },
  },
  name: runtimeEnv === 'prod' ? 'greenfield bsc testnet' : `${runtimeEnv} - greenfield bsc`,
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
};

const { chains, provider, webSocketProvider } = configureChains(
  [bscChain, greenFieldChain],
  [publicProvider()],
);

const trustWalletConnector = new InjectedConnector({
  chains,
  options: {
    name: 'Trust Wallet',
    shimDisconnect: true,
    getProvider: () => (typeof window !== 'undefined' ? window.trustwallet : undefined),
  },
});

const metaMaskWalletConnector = new MetaMaskConnector({ chains });

export { provider, webSocketProvider, chains, metaMaskWalletConnector, trustWalletConnector };
