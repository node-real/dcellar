import BigNumber from 'bignumber.js';

export type TOperation = 'send' | 'transfer_in' | 'transfer_out';

export type TCalculateGas = 'content_value' | 'total_value';

export enum EOperation {
  'send' = 'send',
  'transfer_in' = 'transfer_in',
  'transfer_out' = 'transfer_out',
}

export type TFeeData = {
  gasFee: BigNumber;
  relayerFee: BigNumber;
};

export type TAmountFieldValue = {
  amount: string;
};

export type TAddressFieldValue = {
  address: string;
};

export type TTransferInFromValues = TAmountFieldValue;

export type TTransferOutFromValues = TAmountFieldValue;

export type TSendFromValues = TAmountFieldValue & TAddressFieldValue;

export type TWalletFromValues = TTransferInFromValues | TTransferOutFromValues | TSendFromValues;

export type GetFeeType = ({
  amountIn,
  type,
}: {
  amountIn: string;
  type?: TCalculateGas | undefined;
}) => Promise<void>;

export type TNormalObject = { [key: string]: string };
