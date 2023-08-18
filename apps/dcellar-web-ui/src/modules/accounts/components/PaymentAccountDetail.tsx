import { DCButton } from '@/components/common/DCButton';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setEditPaymentDetail,
  setupAccountsInfo,
} from '@/store/slices/accounts';
import { Flex, QDrawerFooter } from '@totejs/uikit';
import { useAsyncEffect } from 'ahooks';
import React from 'react';
import { AccountDetail } from './AccountDetail';
import { useRouter } from 'next/router';

export const PaymentAccountDetail = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { editPaymentDetail, isLoadingDetail, accountsInfo, PAList, ownerAccount } = useAppSelector(
    (state) => state.accounts,
  );
  const allAccounts = [...PAList, ownerAccount];
  const isOpen = !!editPaymentDetail;
  const router = useRouter();
  const onClose = () => {
    dispatch(setEditPaymentDetail(''));
  };
  const paymentAccount = accountsInfo[editPaymentDetail];
  useAsyncEffect(async () => {
    if (!editPaymentDetail) return;
    dispatch(setupAccountsInfo(editPaymentDetail));
  }, [editPaymentDetail]);
  const onAction = (e: string) => {
    if (e === 'withdraw') {
      return router.push(`/wallet?type=send&from=${editPaymentDetail}`);
    }
    if (e === 'deposit') {
      return router.push(`/wallet?type=send&from=${loginAccount}&to=${editPaymentDetail}`);
    }
  };
  return (
    <DCDrawer
      isOpen={isOpen}
      onClose={onClose}
      gaShowName="dc.payment-accounts.detail.show"
      gaClickCloseName="dc.payment-accounts.detail.close.click"
    >
      <AccountDetail
        loading={isLoadingDetail}
        title="Payment Account Detail"
        accountDetail={paymentAccount}
      />
      <QDrawerFooter>
        <Flex w={'100%'}>
          <DCButton
            variant={'dcGhost'}
            flex={1}
            mr={'16px'}
            borderColor={'readable.normal'}
            gaClickName="dc.file.f_detail_pop.share.click"
            onClick={() => onAction('withdraw')}
          >
            Withdraw
          </DCButton>
          <DCButton
            variant={'dcPrimary'}
            flex={1}
            gaClickName="dc.file.f_detail_pop.download.click"
            onClick={() => onAction('deposit')}
          >
            Deposit
          </DCButton>
        </Flex>
      </QDrawerFooter>
    </DCDrawer>
  );
};
