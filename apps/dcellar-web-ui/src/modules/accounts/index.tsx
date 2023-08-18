import { Box } from '@totejs/uikit';
import React from 'react';
import { OwnerAccount } from './components/OwnerAccount';
import { PaymentAccounts } from './components/PaymentAccounts';
import { PaymentAccountDetail } from './components/PaymentAccountDetail';
import { OwnerAccountDetail } from './components/OwnerAccountDetail';
import { NonRefundableModal } from './components/NonRefundableModal';

import { setupPAList } from '@/store/slices/accounts';
import { useAppDispatch } from '@/store';

export const Accounts = () => {
  const dispatch = useAppDispatch();
  const refreshPAList = () => {
    dispatch(setupPAList());
  }
  return (
    <>
      <NonRefundableModal refreshList={refreshPAList} />
      <OwnerAccountDetail />
      <PaymentAccountDetail />
      <Box marginBottom={32} p={24}>
        <Box as="h2" fontWeight={700} fontSize={24} marginBottom={16}>
          Accounts
        </Box>
        <OwnerAccount />
        <PaymentAccounts />
      </Box>
    </>
  );
};
