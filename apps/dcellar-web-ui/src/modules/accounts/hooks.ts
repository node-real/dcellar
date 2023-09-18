import { useAppSelector } from "@/store";
import { selectStoreFeeParams } from '@/store/slices/global';
import { selectAccount } from '@/store/slices/accounts';
import { BN } from "@/utils/BigNumber";
import { isEmpty } from "lodash-es";

export const useUnFreezeAmount = (address: string) => {
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const account = useAppSelector(selectAccount(address));
  if (isEmpty(storeFeeParams) || isEmpty(account)) return '--';

  return BN(storeFeeParams.reserveTime).times(BN(account.frozenNetflowRate || account.netflowRate)).toString();
}