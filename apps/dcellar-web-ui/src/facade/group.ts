import { getClient } from '@/base/client';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import {
  broadcastFault,
  commonFault,
  createTxFault,
  ErrorResponse,
  simulateFault,
} from '@/facade/error';
import { resolve } from '@/facade/common';
import {
  MsgCreateGroup,
  MsgDeleteGroup,
  MsgUpdateGroupExtra,
  MsgUpdateGroupMember,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { BroadcastResponse, DeliverResponse } from '@/facade/object';
import { signTypedDataCallback } from '@/facade/wallet';
import { Connector } from 'wagmi';

export const getGroups = async (account: string): Promise<ErrorResponse | [GroupInfo[], null]> => {
  const client = await getClient();
  const [res, error] = await client.group
    .listGroup({
      groupOwner: account,
    })
    .then(resolve, commonFault);
  if (!res) return [null, error];
  return [res.groupInfos, null];
};

export const createGroup = async (msg: MsgCreateGroup, connector: Connector): BroadcastResponse => {
  const client = await getClient();
  const [tx, error1] = await client.group.createGroup(msg).then(resolve, createTxFault);
  if (!tx) return [null, error1];

  const [simulate, error2] = await tx.simulate({ denom: 'BNB' }).then(resolve, simulateFault);
  if (!simulate) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulate.gasLimit),
    gasPrice: simulate.gasPrice || '5000000000',
    payer: msg.creator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return tx.broadcast(payload).then(resolve, broadcastFault);
};

export const updateGroupExtra = async (
  msg: MsgUpdateGroupExtra,
  connector: Connector,
): BroadcastResponse => {
  const client = await getClient();
  const [tx, error1] = await client.group.updateGroupExtra(msg).then(resolve, createTxFault);
  if (!tx) return [null, error1];

  const [simulate, error2] = await tx.simulate({ denom: 'BNB' }).then(resolve, simulateFault);
  if (!simulate) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulate.gasLimit),
    gasPrice: simulate.gasPrice || '5000000000',
    payer: msg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return tx.broadcast(payload).then(resolve, broadcastFault);
};

export const addMemberToGroup = async (
  msg: MsgUpdateGroupMember,
  connector: Connector,
): BroadcastResponse => {
  const client = await getClient();

  const members = [];
  // todo fix it
  for await (const member of msg.membersToAdd) {
    const [res, error] = await client.group
      .headGroupMember(msg.groupName, msg.groupOwner, member)
      .then(resolve, commonFault);
    if (!res) {
      members.push(member);
    }
  }
  if (!members.length) return [{ code: 0 } as DeliverResponse, null];

  const [tx, error1] = await client.group
    .updateGroupMember({ ...msg, membersToAdd: members })
    .then(resolve, createTxFault);
  if (!tx) return [null, error1];

  const [simulate, error2] = await tx.simulate({ denom: 'BNB' }).then(resolve, simulateFault);
  if (!simulate) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulate.gasLimit),
    gasPrice: simulate.gasPrice || '5000000000',
    payer: msg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return tx.broadcast(payload).then(resolve, broadcastFault);
};

export const removeMemberFromGroup = async (
  msg: MsgUpdateGroupMember,
  connector: Connector,
): BroadcastResponse => {
  const client = await getClient();

  const members = [];
  // todo fix it
  for await (const member of msg.membersToDelete) {
    const [res, error] = await client.group
      .headGroupMember(msg.groupName, msg.groupOwner, member)
      .then(resolve, commonFault);
    if (res && member !== msg.groupOwner) {
      members.push(member);
    }
  }
  if (!members.length) return [{ code: 0 } as DeliverResponse, null];

  const [tx, error1] = await client.group
    .updateGroupMember({ ...msg, membersToDelete: members })
    .then(resolve, createTxFault);
  if (!tx) return [null, error1];

  const [simulate, error2] = await tx.simulate({ denom: 'BNB' }).then(resolve, simulateFault);
  if (!simulate) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulate.gasLimit),
    gasPrice: simulate.gasPrice || '5000000000',
    payer: msg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return tx.broadcast(payload).then(resolve, broadcastFault);
};

export const deleteGroup = async (msg: MsgDeleteGroup, connector: Connector): BroadcastResponse => {
  const client = await getClient();
  const [tx, error1] = await client.group.deleteGroup(msg).then(resolve, createTxFault);
  if (!tx) return [null, error1];

  const [simulate, error2] = await tx.simulate({ denom: 'BNB' }).then(resolve, simulateFault);
  if (!simulate) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulate.gasLimit),
    gasPrice: simulate.gasPrice || '5000000000',
    payer: msg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return tx.broadcast(payload).then(resolve, broadcastFault);
};
