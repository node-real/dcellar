import { useAppSelector } from '@/store';
import { AccountEntity, selectPaymentAccounts } from '@/store/slices/accounts';
import { find } from 'lodash-es';

export const useAccountType = (address: string) => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const ownerAccount = useAppSelector((root) => root.accounts.ownerAccount);
  const paymentAccountList = useAppSelector(selectPaymentAccounts(loginAccount));

  if (!address)
    return {
      pa: {} as AccountEntity,
      oa: false,
      isSponsor: false,
    };

  const pa = find(paymentAccountList, (a) => a.address.toLowerCase() === address.toLowerCase());
  const oa = ownerAccount.address.toLowerCase() === address.toLowerCase();
  const isSponsor = !pa && !oa;

  return {
    pa,
    oa,
    isSponsor,
  };
};
