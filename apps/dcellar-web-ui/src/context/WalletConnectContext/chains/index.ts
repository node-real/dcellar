import { Chain, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import {
  BSC_CHAIN_ID,
  BSC_RPC_URL,
  GREENFIELD_CHAIN_RPC_URL,
  GREENFIELD_CHAIN_ID,
  GREENFIELD_CHAIN_EXPLORER_URL,
  BSC_EXPLORER_URL,
} from '@/base/env';
import { CHAIN_NAMES } from '@/utils/constant';

const greenFieldChain: Chain = {
  id: GREENFIELD_CHAIN_ID,
  name: CHAIN_NAMES[GREENFIELD_CHAIN_ID],
  network: CHAIN_NAMES[GREENFIELD_CHAIN_ID],
  nativeCurrency: {
    name: GREENFIELD_CHAIN_ID === 920 ? 'BNB' : 'tBNB',
    symbol: GREENFIELD_CHAIN_ID === 920 ? 'BNB' : 'tBNB',
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

const bscMainnet = BSC_CHAIN_ID === 56;

const bscChain: Chain = {
  id: BSC_CHAIN_ID,
  name: `BNB Smart Chain ${bscMainnet ? 'Mainnet' : 'Testnet'}`,
  network: `BNB Smart Chain ${bscMainnet ? 'Mainnet' : 'Testnet'}`,
  nativeCurrency: {
    name: bscMainnet ? 'BNB' : 'tBNB',
    symbol: bscMainnet ? 'BNB' : 'tBNB',
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
      name: `BNB Smart Chain ${bscMainnet ? 'Mainnet' : 'Testnet'} Scan`,
      url: BSC_EXPLORER_URL,
    },
    default: {
      name: `BNB Smart Chain ${bscMainnet ? 'Mainnet' : 'Testnet'} Scan`,
      url: BSC_EXPLORER_URL,
    },
  },
};

export const { chains, provider, webSocketProvider } = configureChains(
  [bscChain, greenFieldChain],
  [publicProvider()],
);
