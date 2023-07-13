import { getClient } from '@/base/client';
import { Coin } from '@bnb-chain/greenfield-cosmos-types/cosmos/base/v1beta1/coin';

export type QueryBalanceRequest = { address: string; denom?: string };

export const getAccountBalance = async ({
  address,
  denom = 'BNB',
}: QueryBalanceRequest): Promise<Coin> => {
  const client = await getClient();
  const { balance } = await client.account
    .getAccountBalance({ address, denom })
    .catch(() => ({ balance: { amount: '0', denom } }));
  return balance!;
};
