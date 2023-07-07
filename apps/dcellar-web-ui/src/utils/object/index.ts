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
  const reverseVisibilityType: TReverseVisibilityType = {} as TReverseVisibilityType;
  Object.keys(VisibilityType)
    .filter(StringIsNumber)
    // @ts-ignore
    .forEach((item: TKey) => {
      reverseVisibilityType[item] = VisibilityType[item];
    });

  return reverseVisibilityType;
}