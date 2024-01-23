import { useAppDispatch, useAppSelector } from '@/store';
import {
  MsgCreateObjectTypeUrl,
  MsgGrantAllowanceTypeUrl,
  MsgPutPolicyTypeUrl,
} from '@bnb-chain/greenfield-js-sdk';
import { Text } from '@totejs/uikit';
import React, { useEffect, useMemo } from 'react';
import { useAsyncEffect } from 'ahooks';
import { WaitFile, setupStoreFeeParams } from '@/store/slices/global';
import { isEmpty } from 'lodash-es';
import { selectLocateBucket, setObjectOperation } from '@/store/slices/object';
import { selectAccount, selectAvailableBalance } from '@/store/slices/accounts';
import { DECIMAL_NUMBER } from '../wallet/constants';
import { getStoreNetflowRate } from '@/utils/payment';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { TotalFees } from '../object/components/TotalFees';
import { BN } from '@/utils/math';
import { renderPaymentInsufficientBalance } from '@/modules/object/utils';

export const Fees = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { objectOperation } = useAppSelector((root) => root.object);
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
            BN(getStoreNetflowRate(obj.size || 0, storeFeeParams)).times(
              storeFeeParams.reserveTime,
            ),
          ),
        BN(0),
      )
      .toString();

    return calRes;
  }, [waitQueue, isChecking, storeFeeParams]);

  const gasFee = useMemo(() => {
    if (isChecking) return -1;
    const waitUploadCount = waitQueue.filter((item: WaitFile) => item.status !== 'ERROR').length;
    if (waitUploadCount === 1) {
      return singleTxGasFee;
    }

    return BN(waitUploadCount).times(singleTxGasFee).plus(BN(createTmpAccountGasFee).toString(DECIMAL_NUMBER))
      .toString(DECIMAL_NUMBER);
  }, [createTmpAccountGasFee, isChecking, singleTxGasFee, waitQueue]);

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

  const operationName = objectOperation[0][1];

  useEffect(() => {
    // when drawer unmounted stop update
    if (gasFee && storeFee && operationName === 'upload') {
      dispatch(
        setObjectOperation({
          operation: [
            '',
            'upload',
            {
              gasFee: BN(gasFee).toString(DECIMAL_NUMBER),
              preLockFee: BN(storeFee).toString(DECIMAL_NUMBER),
              totalFee: BN(gasFee).plus(BN(storeFee)).plus(settlementFee).toString(DECIMAL_NUMBER),
              isBalanceAvailable: isBalanceAvailable,
            },
          ],
        }),
      );
    }
  }, [
    availableBalance,
    dispatch,
    gasFee,
    isBalanceAvailable,
    settlementFee,
    storeFee,
    operationName,
  ]);

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
