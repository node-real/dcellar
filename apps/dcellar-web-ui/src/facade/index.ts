import {
  GREENFIELD_CHAIN_ID,
  GREENFIELD_CHAIN_RPC_URL,
  GREENFIELD_MAINNET_ID,
  GREENFIELD_MAINNET_RPC_URL,
} from '@/base/env';
import { Client } from '@bnb-chain/greenfield-js-sdk';

export const getSingleton = function () {
  let client: Client | null;
  let mainnetClient: Client | null;
  return async function (env?: 'mainnet' | 'testnet'): Promise<Client> {
    if (!client) {
      const { Client } = await import('@bnb-chain/greenfield-js-sdk');
      client = Client.create(GREENFIELD_CHAIN_RPC_URL, String(GREENFIELD_CHAIN_ID));
    }

    if (env === 'mainnet' && !mainnetClient) {
      const { Client } = await import('@bnb-chain/greenfield-js-sdk');
      mainnetClient = Client.create(GREENFIELD_MAINNET_RPC_URL, String(GREENFIELD_MAINNET_ID));
    }

    return env === 'mainnet' ? (mainnetClient as Client) : (client as Client);
  };
};

export const getClient = getSingleton();
