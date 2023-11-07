import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { TX_TYPE_MAP } from '../constant';

export type TKey = keyof typeof VisibilityType;
export type TReverseVisibilityType = {
  [K in number]: TKey;
};

const StringIsNumber = (value: string) => !isNaN(Number(value));

export const convertVisibility = () => {
  const reverseVisibilityType: any = {} as TReverseVisibilityType;
  Object.keys(VisibilityType)
    .filter(StringIsNumber)
    .forEach((item: any) => {
      reverseVisibilityType[item] = VisibilityType[item];
    });

  return reverseVisibilityType;
};

export const formatLockFee = (lockFee: string | undefined) => {
  return String(Number(lockFee || '') / Math.pow(10, 18));
};

export function formatTxType(inputType = '') {
  const mappedTxType = TX_TYPE_MAP[inputType];

  if (mappedTxType) {
    return mappedTxType;
  }

  const result = inputType?.match(/\.Msg(.*)/);
  const txType = result?.[1]?.split(/(?=[A-Z])/)?.join(' ');

  return txType ?? '';
}