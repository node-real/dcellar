import { Box } from '@totejs/uikit';
import { OwnerAccount } from './components/OwnerAccount';
import { PaymentAccounts } from './components/PaymentAccounts';
import { NonRefundableModal } from './components/NonRefundableModal';
import { setupOAList, setupPaymentAccounts } from '@/store/slices/accounts';
import { useAppDispatch } from '@/store';
import { useMount } from 'ahooks';
import { AccountOperations } from '@/modules/accounts/components/AccountOperations';

export const Accounts = () => {
  const dispatch = useAppDispatch();

  useMount(() => {
    dispatch(setupOAList());
    dispatch(setupPaymentAccounts());
  });

  return (
    <>
      <NonRefundableModal />
      <AccountOperations />
      <>
        <Box mt={8} as="h2" fontWeight={700} fontSize={24} marginBottom={16}>
          Accounts
        </Box>
        <OwnerAccount />
        <PaymentAccounts />
      </>
    </>
  );
};
