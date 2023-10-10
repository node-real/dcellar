import { useAppSelector } from '@/store';
import { selectStoreFeeParams } from '@/store/slices/global';
import { selectAccount } from '@/store/slices/accounts';
import { isEmpty } from 'lodash-es';
import { BN } from '@/utils/math';

export const useUnFreezeAmount = (address: string) => {
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const account = useAppSelector(selectAccount(address));
  if (isEmpty(storeFeeParams) || isEmpty(account)) return '--';

  return BN(storeFeeParams.reserveTime)
    .times(BN(account.frozenNetflowRate || account.netflowRate))
    .toString();
};
