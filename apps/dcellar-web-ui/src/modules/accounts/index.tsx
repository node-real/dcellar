import { Box } from '@totejs/uikit';
import React from 'react';
import { OwnerAccount } from './components/OwnerAccount';
import { PaymentAccounts } from './components/PaymentAccounts';
import { PaymentAccountDetail } from './components/PaymentAccountDetail';
import { OwnerAccountDetail } from './components/OwnerAccountDetail';
import { NonRefundableModal } from './components/NonRefundableModal';

import { setupPaymentAccounts } from '@/store/slices/accounts';
import { useAppDispatch, useAppSelector } from '@/store';
import { useMount } from 'ahooks';
import BigNumber from 'bignumber.js';
import { MIN_AMOUNT } from '../wallet/constants';
import { useRouter } from 'next/router';

export const Accounts = () => {
  const dispatch = useAppDispatch();
  const { bankBalance, editPaymentDetail, editOwnerDetail } = useAppSelector(
    (state) => state.accounts,
  );
  const router = useRouter();

  const refreshPAList = () => {
    dispatch(setupPaymentAccounts(true));
  };

  useMount(() => {
    dispatch(setupPaymentAccounts());
  });

  const hasBankBalance = BigNumber(bankBalance).gt(BigNumber(MIN_AMOUNT));

  return (
    <>
      <NonRefundableModal refreshList={refreshPAList} />
      {editOwnerDetail && <OwnerAccountDetail />}
      {editPaymentDetail && <PaymentAccountDetail />}
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
