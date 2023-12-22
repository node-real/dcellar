import { Chain, configureChains } from 'wagmi';
import { publicProvider } from "wagmi/providers/public";

import {
  BSC_CHAIN_ID,
  BSC_RPC_URL,
  GREENFIELD_CHAIN_RPC_URL,
  GREENFIELD_CHAIN_ID,
  GREENFIELD_CHAIN_EXPLORER_URL,
  BSC_EXPLORER_URL,
} from '@/base/env';
import { CHAIN_NAMES } from '@/constants/wallet';

const isGnfdMainnet = GREENFIELD_CHAIN_ID === 1017;

export const greenFieldChain: Chain = {
  id: GREENFIELD_CHAIN_ID,
  name: CHAIN_NAMES[GREENFIELD_CHAIN_ID],
  network: CHAIN_NAMES[GREENFIELD_CHAIN_ID],
  nativeCurrency: {
    name: isGnfdMainnet ? 'BNB' : 'tBNB',
    symbol: isGnfdMainnet ? 'BNB' : 'tBNB',
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
    etherscan: {
      name: `${CHAIN_NAMES[GREENFIELD_CHAIN_ID]} Scan`,
      url: GREENFIELD_CHAIN_EXPLORER_URL,
    },
    default: {
      name: `${CHAIN_NAMES[GREENFIELD_CHAIN_ID]} Scan`,
      url: GREENFIELD_CHAIN_EXPLORER_URL,
    },
  },
};

const isBscMainnet = BSC_CHAIN_ID === 56;

export const bscChain: Chain = {
  id: BSC_CHAIN_ID,
  name: CHAIN_NAMES[BSC_CHAIN_ID],
  network: CHAIN_NAMES[BSC_CHAIN_ID],
  nativeCurrency: {
    name: isBscMainnet ? 'BNB' : 'tBNB',
    symbol: isBscMainnet ? 'BNB' : 'tBNB',
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
    etherscan: {
      name: `${CHAIN_NAMES[BSC_CHAIN_ID]} Scan`,
      url: BSC_EXPLORER_URL,
    },
    default: {
      name: `${CHAIN_NAMES[BSC_CHAIN_ID]} Scan`,
      url: BSC_EXPLORER_URL,
    },
  },
};

export const { chains } = configureChains([bscChain, greenFieldChain], [publicProvider()]);
