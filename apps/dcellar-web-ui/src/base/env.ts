import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
const {
  NEXT_PUBLIC_ENV,
  NEXT_PUBLIC_STATIC_HOST,
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  NEXT_PUBLIC_BSC_CHAIN_ID,
  NEXT_PUBLIC_GREENFIELD_CHAIN_ID,
  NEXT_PUBLIC_BSC_RPC_URL,
  NEXT_PUBLIC_GREENFIELD_CHAIN_RPC_URL,
  NEXT_PUBLIC_GREENFIELD_CHAIN_EXPLORER_URL,
  NEXT_PUBLIC_BSC_EXPLORER_URL,
  NEXT_PUBLIC_GREENFIELD_CHAIN_MAINNET_ID,
  NEXT_PUBLIC_GREENFIELD_CHAIN_MAINNET_RPC_URL,
} = publicRuntimeConfig || {};

export type TRuntimeEnv = 'development' | 'qa' | 'testnet' | 'mainnet';

export const NODE_ENV = process.env.NODE_ENV;
export const runtimeEnv: TRuntimeEnv = NEXT_PUBLIC_ENV || 'qa';

export const assetPrefix = NEXT_PUBLIC_STATIC_HOST || '';
export const GA_ID = NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
// This default values for compatible wagmi build error.
export const GREENFIELD_CHAIN_ID = +NEXT_PUBLIC_GREENFIELD_CHAIN_ID || 5600;
export const BSC_CHAIN_ID = +NEXT_PUBLIC_BSC_CHAIN_ID || 97;
export const GREENFIELD_CHAIN_RPC_URL =
  NEXT_PUBLIC_GREENFIELD_CHAIN_RPC_URL || 'https://gnfd-testnet-ethapi-us.bnbchain.org';
export const BSC_RPC_URL =
  NEXT_PUBLIC_BSC_RPC_URL || 'https://gnfd-bsc-testnet-dataseed1.bnbchain.org';
export const GREENFIELD_CHAIN_EXPLORER_URL = NEXT_PUBLIC_GREENFIELD_CHAIN_EXPLORER_URL;
export const BSC_EXPLORER_URL = NEXT_PUBLIC_BSC_EXPLORER_URL;
export const GREENFIELD_MAINNET_ID = NEXT_PUBLIC_GREENFIELD_CHAIN_MAINNET_ID;
export const GREENFIELD_MAINNET_RPC_URL = NEXT_PUBLIC_GREENFIELD_CHAIN_MAINNET_RPC_URL;