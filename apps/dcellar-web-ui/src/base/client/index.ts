import { Client } from '@bnb-chain/greenfield-chain-sdk';
import { GREENFIELD_CHAIN_ID, GREENFIELD_CHAIN_RPC_URL } from '../env';

export const client = Client.create(GREENFIELD_CHAIN_RPC_URL, String(GREENFIELD_CHAIN_ID));