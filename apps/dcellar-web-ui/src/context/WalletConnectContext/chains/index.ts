import { Chain, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import {
  BSC_CHAIN_ID,
  BSC_RPC_URL,
  GREENFIELD_CHAIN_RPC_URL,
  GREENFIELD_CHAIN_ID,
  runtimeEnv,
  GREENFIELD_CHAIN_EXPLORER_URL,
  BSC_EXPLORER_URL,
} from '@/base/env';
import { CHAIN_NAMES } from '@/utils/constant';

const greenFieldChain: Chain = {
  id: GREENFIELD_CHAIN_ID,
  name: CHAIN_NAMES[GREENFIELD_CHAIN_ID],
  network: 'greenfield',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [GREENFIELD_CHAIN_RPC_URL],
    },
    public: {
      http: [GREENFIELD_CHAIN_RPC_URL],
    },
  },
  blockExplorers: {
    etherscan: { name: 'Greenfield Mekong Testnet Scan', url: GREENFIELD_CHAIN_EXPLORER_URL },
    default: { name: 'Greenfield Mekong Testnet Scan', url: GREENFIELD_CHAIN_EXPLORER_URL },
  },
};

const bscChain: Chain = {
  id: BSC_CHAIN_ID,
  name: 'BNB Smart Chain Testnet',
  network: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [BSC_RPC_URL],
    },
    public: {
      http: [BSC_RPC_URL],
    },
  },
  blockExplorers: {
    etherscan: { name: 'BNB Smart Chain Testnet Scan', url: BSC_EXPLORER_URL },
    default: { name: 'BNB Smart Chain Testnet Scan', url: BSC_EXPLORER_URL },
  },
};

export const { chains, provider, webSocketProvider } = configureChains(
  [bscChain, greenFieldChain],
  [publicProvider()],
);
