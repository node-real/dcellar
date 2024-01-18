import { ObjectActionValueType } from '@/modules/object/components/ObjectList';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';

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

export const pickAction = (actions: ObjectActionValueType[], values: ObjectActionValueType[]) => {
  return actions.filter(item => values.includes(item))
}

export const removeAction = (actions: ObjectActionValueType[], values: ObjectActionValueType[]) => {
  return actions.filter(item => !values.includes(item))
}
