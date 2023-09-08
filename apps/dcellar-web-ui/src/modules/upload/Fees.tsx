import {
  renderPaymentInsufficientBalance,
} from '@/modules/file/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  MsgCreateObjectTypeUrl,
  MsgGrantAllowanceTypeUrl,
  MsgPutPolicyTypeUrl,
} from '@bnb-chain/greenfield-js-sdk';
import { Text } from '@totejs/uikit';
import React, { useEffect, useMemo } from 'react';
import { useAsyncEffect, useMount } from 'ahooks';
import { WaitFile, setupStoreFeeParams, setupTmpAvailableBalance } from '@/store/slices/global';
import { isEmpty } from 'lodash-es';
import { selectLocateBucket, setEditUpload } from '@/store/slices/object';
import { selectAccount, selectAvailableBalance } from '@/store/slices/accounts';
import { DECIMAL_NUMBER } from '../wallet/constants';
import { getNetflowRate } from '@/utils/payment';
import { BN } from '@/utils/BigNumber';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { TotalFees } from '../object/components/TotalFees';

export const Fees = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee: singleTxGasFee } = gasObjects?.[MsgCreateObjectTypeUrl] || {};
  const { waitQueue, storeFeeParams } = useAppSelector((root) => root.global);
  const bucket = useAppSelector(selectLocateBucket);
  const payStoreFeeAccount = useAppSelector(selectAccount(bucket.PaymentAddress));
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const isOwnerAccount = payStoreFeeAccount.address === loginAccount;
  const availableBalance = useAppSelector(selectAvailableBalance(payStoreFeeAccount.address));
  const isChecking = waitQueue.some((item) => item.status === 'CHECK') || isEmpty(storeFeeParams);
  const { settlementFee } = useSettlementFee(bucket.PaymentAddress);
  useAsyncEffect(async () => {
    if (isEmpty(storeFeeParams)) {
      return await dispatch(setupStoreFeeParams());
    }
  }, [storeFeeParams]);

  const createTmpAccountGasFee = useMemo(() => {
    const grantAllowTxFee = BN(gasObjects[MsgGrantAllowanceTypeUrl].gasFee).plus(
      BN(gasObjects[MsgGrantAllowanceTypeUrl].perItemFee).times(1),
    );
    const putPolicyTxFee = BN(gasObjects[MsgPutPolicyTypeUrl].gasFee);

    return grantAllowTxFee.plus(putPolicyTxFee).toString(DECIMAL_NUMBER);
  }, [gasObjects]);

  const storeFee = useMemo(() => {
    if (isEmpty(storeFeeParams) || isChecking) {
      return '-1';
    }
    const calRes = waitQueue
      .filter((item) => item.status !== 'ERROR')
      .reduce(
        (sum, obj) =>
          sum.plus(
            BN(getNetflowRate(obj.size || 0, storeFeeParams)).times(storeFeeParams.reserveTime),
          ),
        BN(0),
      )
      .dividedBy(10 ** 18)
      .toString();

    return calRes;
  }, [waitQueue, isChecking, storeFeeParams]);

  const gasFee = isChecking
    ? -1
    : BN(waitQueue.filter((item: WaitFile) => item.status !== 'ERROR').length)
        .times(singleTxGasFee)
        .plus(BN(createTmpAccountGasFee).toString(DECIMAL_NUMBER))
        .toString(DECIMAL_NUMBER);
  const isBalanceAvailable = useMemo(() => {
    if (isOwnerAccount) {
      return (
        BN(bankBalance).minus(BN(gasFee)).isPositive() &&
        BN(bankBalance)
          .minus(BN(gasFee))
          .plus(payStoreFeeAccount.staticBalance)
          .minus(BN(storeFee || 0))
          .isPositive()
      );
    } else {
      return (
        BN(bankBalance).minus(BN(gasFee)).isPositive() &&
        BN(payStoreFeeAccount.staticBalance)
          .minus(BN(storeFee || 0))
          .isPositive()
      );
    }
  }, [bankBalance, gasFee, isOwnerAccount, storeFee, payStoreFeeAccount?.staticBalance]);

  useEffect(() => {
    if (gasFee && storeFee) {
      dispatch(
        setEditUpload({
          gasFee: BN(gasFee).toString(DECIMAL_NUMBER),
          preLockFee: BN(storeFee).toString(DECIMAL_NUMBER),
          totalFee: BN(gasFee).plus(BN(storeFee)).plus(settlementFee).toString(DECIMAL_NUMBER),
          isBalanceAvailable: isBalanceAvailable,
        }),
      );
    }
  }, [availableBalance, dispatch, gasFee, isBalanceAvailable, settlementFee, storeFee]);
  useMount(() => {
    dispatch(setupTmpAvailableBalance(loginAccount));
  });

  return (
    <>
      <TotalFees
        payStoreFeeAddress={bucket.PaymentAddress}
        prepaidFee={storeFee}
        settlementFee={settlementFee}
        gasFee={gasFee}
      />
      <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
        {!isChecking &&
          renderPaymentInsufficientBalance({
            gasFee: gasFee + '',
            storeFee,
            settlementFee: settlementFee,
            refundFee: '0',
            payGasFeeBalance: bankBalance,
            payStoreFeeBalance: payStoreFeeAccount.staticBalance,
            payAccount: payStoreFeeAccount.address,
            ownerAccount: loginAccount,
          })}
      </Text>
    </>
  );
};
