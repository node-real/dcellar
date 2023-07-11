import { ObjectItem } from "@/store/slices/object";
import { VisibilityType } from "@bnb-chain/greenfield-cosmos-types/greenfield/storage/common";

export type TKey = keyof typeof VisibilityType;
export type TReverseVisibilityType = {
  [K in number]: TKey;
};

export const duplicateName = (name: string, objects: ObjectItem[]) => {
  return objects.some((item) => item.name === name);
}

const StringIsNumber = (value: string) => isNaN(Number(value)) === false;

export const convertVisibility = () => {
  const reverseVisibilityType: any = {} as TReverseVisibilityType;
  Object.keys(VisibilityType)
    .filter(StringIsNumber)
    .forEach((item: any) => {
      reverseVisibilityType[item] = VisibilityType[item];
    });

  return reverseVisibilityType;
}

export const formatLockFee = (lockFee: string | undefined) => {
  return String(Number(lockFee || '') / Math.pow(10, 19));
};