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
import Head from 'next/head';
import { networkTag } from '@/utils/common';
import { runtimeEnv } from '@/base/env';

export const Accounts = () => {
  const dispatch = useAppDispatch();
  const { editPaymentDetail, editOwnerDetail } = useAppSelector((state) => state.accounts);

  const refreshPAList = () => {
    dispatch(setupPaymentAccounts(true));
  };

  useMount(() => {
    dispatch(setupPaymentAccounts());
  });

  return (
    <>
      <Head>
        <title>Groups - DCellar{networkTag(runtimeEnv)}</title>
      </Head>
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
