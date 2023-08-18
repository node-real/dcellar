import { getClient } from '@/base/client';
import {
  GRNToString,
  MsgCreateObjectTypeUrl,
  MsgDeleteObjectTypeUrl,
  PermissionTypes,
  newBucketGRN,
  newObjectGRN,
} from '@bnb-chain/greenfield-js-sdk';
import { Coin } from '@bnb-chain/greenfield-cosmos-types/cosmos/base/v1beta1/coin';
import { Wallet, ethers } from 'ethers';
import { parseEther } from 'ethers/lib/utils.js';
import { resolve } from './common';
import { ErrorResponse, broadcastFault, simulateFault, createTxFault, commonFault } from './error';
import { UNKNOWN_ERROR } from '@/modules/file/constant';
import { TTmpAccount } from '@/store/slices/global';
import { signTypedDataV4 } from '@/utils/signDataV4';
import { signTypedDataCallback } from './wallet';
import { QueryGetPaymentAccountResponse, QueryGetPaymentAccountsByOwnerResponse, QueryGetStreamRecordResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/query';
import { Connector } from 'wagmi';

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

export const createTmpAccount = async ({
  address,
  bucketName,
  amount,
  connector,
  actionType,
}: any): Promise<ErrorResponse | [TTmpAccount, null]> => {
  //messages and resources are different for create and delete
  const isDelete = actionType === 'delete';

  const grantAllowedMessage = isDelete ? [MsgDeleteObjectTypeUrl] : [MsgCreateObjectTypeUrl];
  const statementAction = isDelete
    ? [PermissionTypes.ActionType.ACTION_DELETE_OBJECT]
    : [PermissionTypes.ActionType.ACTION_CREATE_OBJECT];

  // 1. create temporary account
  const wallet = Wallet.createRandom();

  // 2. allow temporary account to submit specified tx and amount
  const client = await getClient();
  // MsgGrantAllowanceTypeUrl
  const [grantAllowanceTx, allowError] = await client.feegrant
    .grantAllowance({
      granter: address,
      grantee: wallet.address,
      allowedMessages: grantAllowedMessage,
      amount: parseEther(amount <= 0 ? '0.1' : amount).toString(),
      denom: 'BNB',
    })
    .then(resolve, createTxFault);

  if (allowError) return [null, allowError];

  const resources = isDelete
    ? [GRNToString(newObjectGRN(bucketName, '*'))]
    : [GRNToString(newBucketGRN(bucketName))];
  // 3. Put bucket policy so that the temporary account can create objects within this bucket
  const statement: PermissionTypes.Statement = {
    effect: PermissionTypes.Effect.EFFECT_ALLOW,
    actions: statementAction,
    resources: resources,
  };

  const [putPolicyTx, createTxError] = await client.bucket
    .putBucketPolicy(bucketName, {
      operator: address,
      statements: [statement],
      principal: {
        type: PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
        value: wallet.address,
      },
    })
    .then(resolve, createTxFault);

  if (createTxError) return [null, createTxError];

  // 4. broadcast txs include 2 msg
  const txs = await client.basic.multiTx([grantAllowanceTx!, putPolicyTx!]);

  const [simulateInfo, simulateError] = await txs
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);

  if (simulateError) return [null, simulateError];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(210000),
    gasPrice: '5000000000',
    payer: address,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };
  const payloadParam = isDelete
    ? {
        ...payload,
        signTypedDataCallback: async (addr: string, message: string) => {
          const provider = await connector?.getProvider();
          return await signTypedDataV4(provider, addr, message);
        },
      }
    : payload;
  const [res, error] = await txs.broadcast(payloadParam).then(resolve, broadcastFault);

  if ((res && res.code !== 0) || error) {
    return [null, error || UNKNOWN_ERROR];
  }

  return [{
    address: wallet.address,
    privateKey: wallet.privateKey
  }, null];
}

// No stream record data can be accessed when creating a payment account without making any deposits.
export const getAccountStreamRecord = async (address: string): Promise<ErrorResponse | [QueryGetStreamRecordResponse, null]> => {
  const client = await getClient();
  return await client.payment.getStreamRecord(address).then(resolve, commonFault);
}

export const createPaymentAccount = async (address: string, connector: Connector) => {
  const client = await getClient();
  const [tx, txError] = await client.account.createPaymentAccount({
    creator: address,
  }).then(resolve, commonFault);
  if (!tx || txError) {
    return [null, txError];
  }
  const [simulateInfo, error] = await tx.simulate({
    denom: 'BNB',
  }).then(resolve, simulateFault);
  if (error) {
    return [null, error];
  }
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: address,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };
  const [res, bError] = await tx.broadcast(broadcastPayload).then(resolve, broadcastFault);
  if (bError) {
    return [null, bError];
  }
  if (!res || res.code !== 0) {
    return [null, res && res.rawLog || UNKNOWN_ERROR];
  }

  return [res, null]
}

export const disablePaymentAccountRefund = async ({ address, paymentAccount }: { address: string; paymentAccount: string }, connector: Connector): Promise<ErrorResponse | [any, null]> => {
  const client = await getClient();
  const [tx, tError] = await client.payment.disableRefund({
    owner: address,
    addr: paymentAccount,
  }).then(resolve, commonFault);
  if (!tx || tError) {
    return [null, tError];
  }
  const [simulateInfo, sError] = await tx.simulate({
    denom: 'BNB',
  }).then(resolve, simulateFault);
  if (sError) {
    return [null, sError];
  }

  const [res, bError] = await tx.broadcast({
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: address,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  }).then(resolve, broadcastFault);
  if (bError) {
    return [null, bError];
  }
  if (!res || res.code !== 0) {
    return [null, res && res.rawLog || UNKNOWN_ERROR];
  }

  return [res, null];
}

export const getPaymentAccountsByOwner = async (address: string): Promise<ErrorResponse | [QueryGetPaymentAccountsByOwnerResponse, null]> => {
  const client = await getClient();
  return await client.payment.getPaymentAccountsByOwner({
    owner: address,
  }).then(resolve, commonFault);
}

export const sendToOwnerAccount = async ({ fromAddress, toAddress, amount }: { fromAddress: string; toAddress: string; amount: string }, connector: Connector): Promise<ErrorResponse | [any, null]> => {
  const client = await getClient();
  const [tx, txError] = await client.account.transfer({
    fromAddress,
    toAddress,
    amount: [
      {
        denom: 'BNB',
        amount: ethers.utils.parseEther(amount).toString(),
      },
    ],
  }).then(resolve, commonFault);
  if (!tx || txError) {
    return [null, txError];
  }
  const [simulateInfo, error] = await tx.simulate({
    denom: 'BNB',
  }).then(resolve, simulateFault);
  if (!simulateInfo || error) {
    return [null, error];
  }
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo.gasLimit),
    gasPrice: simulateInfo.gasPrice,
    payer: fromAddress,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  }
  const [res, bError] = await tx.broadcast(broadcastPayload).then(resolve, broadcastFault);

  if (bError) {
    return [null, bError];
  }
  if (!res || res.code !== 0) {
    return [null, res && res.rawLog || UNKNOWN_ERROR];
  }

  return [res, null];
}
export const depositToPaymentAccount = async ({ fromAddress, toAddress, amount }: { fromAddress: string; toAddress: string; amount: string }, connector: Connector): Promise<ErrorResponse | [any, null]> => {
  const client = await getClient();
  const [tx, txError] = await client.payment.deposit({
    creator: fromAddress,
    to: toAddress,
    amount: parseEther(amount).toString(),
  }).then(resolve, commonFault);
  if (!tx || txError) {
    return [null, txError];
  }
  const [simulateInfo, error] = await tx.simulate({
    denom: 'BNB',
  }).then(resolve, simulateFault);
  if (error) {
    return [null, error];
  }
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: fromAddress,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };
  const [res, bError] = await tx.broadcast(broadcastPayload).then(resolve, broadcastFault);
  if (bError) {
    return [null, bError];
  }
  if (!res || res.code !== 0) {
    return [null, res && res.rawLog || UNKNOWN_ERROR];
  }

  return [res, null];
}

export const withdrawFromPaymentAccount = async ({ creator, fromAddress, amount }: { creator: string; fromAddress: string; amount: string }, connector: Connector): Promise<ErrorResponse | [any, null]> => {
  const client = await getClient();
  const [tx, txError] = await client.payment.withdraw({
    creator,
    from: fromAddress,
    amount: parseEther(amount).toString(),
  }).then(resolve, commonFault);
  if (!tx || txError) {
    return [null, txError];
  }
  const [simulateInfo, error] = await tx.simulate({
    denom: 'BNB',
  }).then(resolve, simulateFault);
  if (error) {
    return [null, error];
  }
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: creator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  const [res, bError] = await tx.broadcast(broadcastPayload).then(resolve, broadcastFault);
  if (bError) {
    return [null, bError];
  }
  if (!res || res.code !== 0) {
    return [null, res && res.rawLog || UNKNOWN_ERROR];
  }

  return [res, null];
}

export const getPaymentAccount = async (address: string): Promise<ErrorResponse | [QueryGetPaymentAccountResponse, null]> => {
  const client = await getClient();
  return await client.payment.paymentAccount({addr: address}).then(resolve, commonFault);
}
