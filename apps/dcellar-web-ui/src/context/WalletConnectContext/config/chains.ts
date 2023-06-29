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
import { CHAIN_NAMES } from '../constant';

const greenFieldChain: Chain = {
  id: GREENFIELD_CHAIN_ID,
  name: CHAIN_NAMES[GREENFIELD_CHAIN_ID],
  network: 'greenfield',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
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
    etherscan: { name: 'Greenfield Scan', url: GREENFIELD_CHAIN_EXPLORER_URL },
    default: { name: 'Greenfield Scan', url: GREENFIELD_CHAIN_EXPLORER_URL },
  },
};

const bscChain: Chain = {
  id: BSC_CHAIN_ID,
  network: 'BNB Smart Chain Testnet',
  name: CHAIN_NAMES[BSC_CHAIN_ID],
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
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
    etherscan: { name: 'BSC Scan', url: BSC_EXPLORER_URL },
    default: { name: 'BSC Scan', url: BSC_EXPLORER_URL },
  },
};

export const { chains, provider, webSocketProvider } = configureChains(
  [bscChain, greenFieldChain],
  [publicProvider()],
);
