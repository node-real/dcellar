import { getClient } from '@/base/client';
import { GRNToString, MsgCreateObjectTypeUrl, MsgDeleteObjectTypeUrl, PermissionTypes, newBucketGRN } from '@bnb-chain/greenfield-chain-sdk';
import { Coin } from '@bnb-chain/greenfield-cosmos-types/cosmos/base/v1beta1/coin';
import { Wallet } from 'ethers';
import { parseEther } from 'ethers/lib/utils.js';
import { resolve } from './common';
import { ErrorResponse, broadcastFault, commonFault, simulateFault } from './error';
import { UNKNOWN_ERROR } from '@/modules/file/constant';
import { TTmpAccount } from '@/store/slices/global';

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

export const createTmpAccount = async ({address, bucketName, amount}: any): Promise<ErrorResponse | [TTmpAccount, null]> => {
  // 1. create temporary account
  const wallet = Wallet.createRandom();
  console.log('wallet', wallet.address, wallet.privateKey);

  // 2. allow temporary account to submit specified tx and amount
  const client = await getClient();
  const grantAllowanceTx = await client.feegrant.grantAllowance({
  granter: address,
  grantee: wallet.address,
  allowedMessages: [MsgCreateObjectTypeUrl],
  amount: parseEther(amount || '0.1').toString(),
  denom: 'BNB',
  });

  // 3. Put bucket policy so that the temporary account can create objects within this bucket
  const statement: PermissionTypes.Statement = {
    effect: PermissionTypes.Effect.EFFECT_ALLOW,
    actions: [PermissionTypes.ActionType.ACTION_CREATE_OBJECT],
    resources: [GRNToString(newBucketGRN(bucketName))],
  };
  const [putPolicyTx, putPolicyError] = await client.bucket.putBucketPolicy(bucketName, {
    operator: address,
    statements: [statement],
    principal: {
      type: PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
      value: wallet.address,
    },
  }).then(resolve, commonFault);
  if (!putPolicyTx) {
    return [null, putPolicyError];
  }

   // 4. broadcast txs include 2 msg
   const txs = await client.basic.multiTx([grantAllowanceTx, putPolicyTx]);
   const [simulateInfo, simulateError] = await txs.simulate({
     denom: 'BNB',
   }).then(resolve, simulateFault);
  if (simulateError) {
    return [null, simulateError];
  }

  console.log('simuluateInfo', simulateInfo);
  const payload = {
    denom: 'BNB',
    gasLimit: Number(210000),
    gasPrice: '5000000000',
    payer: address,
    granter: '',
  }
  console.log('payload', payload)
  const [res, error] = await txs.broadcast(payload).then(resolve, broadcastFault);

  if (res && res.code !== 0 || error) {
    return [null, error || UNKNOWN_ERROR];
  }

  return [{
    address: wallet.address,
    privateKey: wallet.privateKey
  }, null];
}