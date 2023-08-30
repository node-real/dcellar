import { DCButton } from '@/components/common/DCButton';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount, setEditPaymentDetail, setupAccountsInfo } from '@/store/slices/accounts';
import { Flex, QDrawerFooter } from '@totejs/uikit';
import { useAsyncEffect, useInterval } from 'ahooks';
import React, { useEffect } from 'react';
import { AccountDetail } from './AccountDetail';
import { useRouter } from 'next/router';
import { getUtcZeroTimestamp } from '@bnb-chain/greenfield-js-sdk';
import BigNumber from 'bignumber.js';

export const PaymentAccountDetail = () => {
  const dispatch = useAppDispatch();
  const [lockFee, setLockFee] = React.useState('0');
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { editPaymentDetail, isLoadingDetail } = useAppSelector(
    (state) => state.accounts,
  );
  const paymentAccount = useAppSelector(selectAccount(editPaymentDetail));
  const isOpen = !!editPaymentDetail;
  const router = useRouter();
  const onClose = () => {
    dispatch(setEditPaymentDetail(''));
  };
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

  const clear = useInterval(() => {
    if (!paymentAccount) return;
    const { netflowRate, bufferBalance, crudTimestamp } = paymentAccount;
    const ts = Math.floor(getUtcZeroTimestamp() / 1000);
    const costLockFee = BigNumber(netflowRate || 0).times(BigNumber(ts - crudTimestamp));
    const lockFee = BigNumber(bufferBalance).plus(costLockFee).toString();
    setLockFee(lockFee);
  }, 1000);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  return (
    <DCDrawer
      isOpen={isOpen}
      onClose={onClose}
      gaShowName="dc.payment-accounts.detail.show"
      gaClickCloseName="dc.payment-accounts.detail.close.click"
    >
      <AccountDetail
        loading={isLoadingDetail}
        title="Payment account detail"
        accountDetail={paymentAccount}
        lockFee={lockFee}
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
