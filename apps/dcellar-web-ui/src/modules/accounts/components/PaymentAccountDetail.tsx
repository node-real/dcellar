import { DCButton } from '@/components/common/DCButton';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount, setEditPaymentDetail, setupAccountDetail } from '@/store/slices/accounts';
import { Flex, QDrawerFooter } from '@totejs/uikit';
import { useAsyncEffect, useInterval } from 'ahooks';
import React, { useEffect } from 'react';
import { AccountDetail } from './AccountDetail';
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';
import { getTimestampInSeconds } from '@/utils/time';

export const PaymentAccountDetail = () => {
  const dispatch = useAppDispatch();
  const [availableBalance, setAvailableBalance] = React.useState('0');
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { editPaymentDetail, isLoadingDetail } = useAppSelector((state) => state.accounts);
  const paymentAccount = useAppSelector(selectAccount(editPaymentDetail));
  const isOpen = !!editPaymentDetail;
  const router = useRouter();
  const isNonRefundable = paymentAccount.refundable;
  const isFrozen = paymentAccount.status === 1;
  const onClose = () => {
    dispatch(setEditPaymentDetail(''));
  };
  useAsyncEffect(async () => {
    if (!editPaymentDetail) return;
    dispatch(setupAccountDetail(editPaymentDetail));
  }, [editPaymentDetail]);
  const onAction = (e: string) => {
    if (e === 'withdraw') {
      return router.push(`/wallet?type=send&from=${editPaymentDetail}`);
    }
    if (e === 'deposit') {
      return router.push(`/wallet?type=send&from=${loginAccount}&to=${editPaymentDetail}`);
    }
    // if (e === 'set_non-refundable') {
    //   return dispatch(setEditDisablePaymentAccount(editPaymentDetail));
    // }
  };

  const clear = useInterval(() => {
    if (!paymentAccount) return;
    const { netflowRate, staticBalance, crudTimestamp } = paymentAccount;
    const ts = getTimestampInSeconds();
    const needSettleRate = BigNumber(netflowRate || 0).times(BigNumber(ts - crudTimestamp));
    const availableBalance = BigNumber(staticBalance).plus(needSettleRate).toString();
    setAvailableBalance(availableBalance);
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
        loading={!!isLoadingDetail}
        title="Account Detail"
        accountDetail={paymentAccount}
        availableBalance={availableBalance}
      />
      <QDrawerFooter>
        <Flex w={'100%'} gap={16}>
          {!isLoadingDetail && (
            <DCButton
              variant={'dcPrimary'}
              flex={1}
              borderColor="#e6e8ea"
              gaClickName="dc.file.f_detail_pop.download.click"
              onClick={() => onAction('deposit')}
            >
              Deposit
            </DCButton>
          )}
          {!isLoadingDetail && isNonRefundable && !isFrozen && (
            <DCButton
              variant={!isNonRefundable || isFrozen ? 'dcPrimary' : 'dcGhost'}
              flex={1}
              gaClickName="dc.file.f_detail_pop.share.click"
              onClick={() => onAction('withdraw')}
            >
              Withdraw
            </DCButton>
          )}
          {/* {!isLoadingDetail && isNonRefundable && (
            <DCButton
              variant={'dcGhost'}
              width={'170px'}
              paddingX={0}
              mr={'16px'}
              borderColor="#e6e8ea"
              gaClickName="dc.file.f_detail_pop.share.click"
              onClick={() => onAction('set_non-refundable')}
            >
              Set non-refundable
            </DCButton>
          )} */}
        </Flex>
      </QDrawerFooter>
    </DCDrawer>
  );
};
