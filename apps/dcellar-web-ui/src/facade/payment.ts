import { getClient } from '@/facade/index';
import { getTimestampInSeconds } from '@/utils/time';
import { QueryGetStreamRecordResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/query';
import { AuthType, Long } from '@bnb-chain/greenfield-js-sdk';
import { SpConfig } from '@bnb-chain/greenfield-js-sdk/dist/esm/api/config';
import { ListUserPaymentAccountsResquest } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/ListUserPaymentAccounts';
import BigNumber from 'bignumber.js';
import { resolve } from './common';
import { commonFault } from './error';

const nToString = (num: BigNumber) => {
  return num.dividedBy(10 ** 18).toString();
};

export const getStreamRecord = async (address: string) => {
  let useMetamaskValue = false;

  const client = await getClient();
  const { streamRecord } = await client.payment.getStreamRecord(address).catch((error: any) => {
    if (error.message.includes('key not found')) useMetamaskValue = true;
    return { streamRecord: {} } as QueryGetStreamRecordResponse;
  });
  const ts = getTimestampInSeconds();

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

export const getStoreFeeParams = async (props: { time?: number; network?: 'mainnet' }) => {
  const { time = undefined, network } = props || {};
  const client = await getClient(network);
  const now = getTimestampInSeconds();
  const [globalSpStoragePrice, { params: storageParams }, { params: paymentParams }] =
    await Promise.all([
      client.sp.getQueryGlobalSpStorePriceByTime({ timestamp: Long.fromNumber(time || now) }),
      client.storage.params(),
      client.payment.params(),
    ]);

  const {
    minChargeSize = new Long(0),
    redundantDataChunkNum = 0,
    redundantParityChunkNum = 0,
  } = (storageParams && storageParams.versionedParams) || {};

  const { reserveTime, validatorTaxRate } = paymentParams?.versionedParams || {};

  return {
    primarySpStorePrice: globalSpStoragePrice?.globalSpStorePrice.primaryStorePrice || '',
    readPrice: globalSpStoragePrice?.globalSpStorePrice.readPrice || '',
    secondarySpStorePrice: globalSpStoragePrice?.globalSpStorePrice.secondaryStorePrice || '',
    validatorTaxRate: validatorTaxRate || '',
    minChargeSize: minChargeSize.toNumber(),
    redundantDataChunkNum,
    redundantParityChunkNum,
    reserveTime: reserveTime?.toString() || '',
  };
};

export const listUserPaymentAccounts = async (
  params: ListUserPaymentAccountsResquest,
  authType: AuthType,
  spConfig?: SpConfig,
) => {
  const client = await getClient();
  return await client.payment
    .listUserPaymentAccounts(params, authType, spConfig)
    .then(resolve, commonFault);
};
