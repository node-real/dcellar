import { Box } from '@totejs/uikit';
import { OwnerAccount } from './components/OwnerAccount';
import { PaymentAccounts } from './components/PaymentAccounts';
import { PaymentAccountDetail } from './components/PaymentAccountDetail';
import { OwnerAccountDetail } from './components/OwnerAccountDetail';
import { NonRefundableModal } from './components/NonRefundableModal';
import { setupOAList, setupPaymentAccounts } from '@/store/slices/accounts';
import { useAppDispatch, useAppSelector } from '@/store';
import { useMount } from 'ahooks';

export const Accounts = () => {
  const dispatch = useAppDispatch();
  const { editPaymentDetail, editOwnerDetail } = useAppSelector((state) => state.accounts);

  const refreshPAList = () => {
    dispatch(setupPaymentAccounts(true));
  };

  useMount(() => {
    dispatch(setupOAList());
    dispatch(setupPaymentAccounts());
  });

  return (
    <>
      <NonRefundableModal refreshList={refreshPAList} />
      {editOwnerDetail && <OwnerAccountDetail />}
      {editPaymentDetail && <PaymentAccountDetail />}
      <Box>
        <Box as="h2" fontWeight={700} fontSize={24} marginBottom={16}>
          Accounts
        </Box>
        <OwnerAccount />
        <PaymentAccounts />
      </Box>
    </>
  );
};
