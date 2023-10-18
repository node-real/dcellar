import { Box, toast } from '@totejs/uikit';
import { OwnerAccount } from './components/OwnerAccount';
import { PaymentAccounts } from './components/PaymentAccounts';
import { NonRefundableModal } from './components/NonRefundableModal';
import { setupOwnerAccount, setupPaymentAccounts } from '@/store/slices/accounts';
import { useAppDispatch } from '@/store';
import { useMount } from 'ahooks';
import { AccountOperations } from '@/modules/accounts/components/AccountOperations';
import Head from 'next/head';
import { networkTag } from '@/utils/common';
import { runtimeEnv } from '@/base/env';

export const Accounts = () => {
  const dispatch = useAppDispatch();

  useMount(async () => {
    dispatch(setupOwnerAccount());
    const error = await dispatch(setupPaymentAccounts());
    if (error) {
      toast.error({
        description: error,
      });
    }
  });

  return (
    <>
      <Head>
        <title>Groups - DCellar{networkTag(runtimeEnv)}</title>
      </Head>
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
