import { getClient } from '@/base/client';
import { QueryGetStreamRecordResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/query';
import BigNumber from 'bignumber.js';
import { getUtcZeroTimestamp } from '@/utils/time';

const nToString = (num: BigNumber) => {
  return num.dividedBy(10 ** 18).toString();
};

export const getStreamRecord = async (address: string) => {
  let useMetamaskValue = false;

  const client = await getClient();
  const { streamRecord } = await client.payment.getStreamRecord(address).catch((error: any) => {
    if (error.message.includes('key not found')) useMetamaskValue = true;
    return {} as QueryGetStreamRecordResponse;
  });
  const ts = Math.floor(getUtcZeroTimestamp() / 1000);

  const {
    netflowRate = '0',
    staticBalance = '0',
    crudTimestamp = BigNumber(ts),
    bufferBalance = '0',
    lockBalance = '0',
  } = streamRecord!;

  const _netflowRate = BigNumber(netflowRate);
  const _staticBalance = BigNumber(staticBalance);
  const _crudTimestamp = crudTimestamp.toNumber();
  const _bufferBalance = BigNumber(bufferBalance);
  const _lockBalance = BigNumber(lockBalance);

  const latestStaticBalance = nToString(
    _staticBalance.plus(_netflowRate.times(ts - _crudTimestamp)),
  );

  const lockFee = nToString(
    _lockBalance.plus(_bufferBalance).plus(BigNumber.min(0, latestStaticBalance)),
  );

  return {
    netflowRate: nToString(_netflowRate),
    latestStaticBalance,
    lockFee,
    useMetamaskValue,
  };
};
