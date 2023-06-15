import { GREENFIELD_CHAIN_ID, GREENFIELD_CHAIN_RPC_URL } from '../env';
import { Client } from '@bnb-chain/greenfield-chain-sdk';

export const getSingleton = function () {
  let client: Client | null;
  return async function () {
    if (!client) {
      const { Client } = await import('@bnb-chain/greenfield-chain-sdk');
      client = Client.create(GREENFIELD_CHAIN_RPC_URL, String(GREENFIELD_CHAIN_ID));
    }
    return client;
  }
};

export const getClient = getSingleton();