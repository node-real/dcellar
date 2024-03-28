import {
  MsgCreateObjectTypeUrl,
  MsgGrantAllowanceTypeUrl,
  MsgPutPolicyTypeUrl,
} from '@bnb-chain/greenfield-js-sdk';
import { Text } from '@node-real/uikit';
import { useAsyncEffect } from 'ahooks';
import { isEmpty } from 'lodash-es';
import { memo, useEffect, useMemo } from 'react';
import { TotalFees } from '../object/components/TotalFees';
import { DECIMAL_NUMBER } from '../wallet/constants';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { renderPaymentInsufficientBalance } from '@/modules/object/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount, selectAvailableBalance } from '@/store/slices/accounts';
import { selectGnfdGasFeesConfig, setupStoreFeeParams, WaitObject } from '@/store/slices/global';
import { selectLocateBucket, setObjectOperation } from '@/store/slices/object';
import { BN } from '@/utils/math';
import { getStoreNetflowRate } from '@/utils/payment';

interface FeesProps {
  delegateUpload: boolean;
}

export const UploadObjectsFees = memo<FeesProps>(function Fees({ delegateUpload }) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);
  const objectWaitQueue = useAppSelector((root) => root.global.objectWaitQueue);
  const storeFeeParams = useAppSelector((root) => root.global.storeFeeParams);
  const objectOperation = useAppSelector((root) => root.object.objectOperation);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const bucket = useAppSelector(selectLocateBucket);
  const payStoreFeeAccount = useAppSelector(selectAccount(bucket.PaymentAddress));
  const availableBalance = useAppSelector(selectAvailableBalance(payStoreFeeAccount.address));
  const { settlementFee } = useSettlementFee(bucket.PaymentAddress);

  const { gasFee: singleTxGasFee } = gnfdGasFeesConfig?.[MsgCreateObjectTypeUrl] || {};
  const isOwnerAccount = payStoreFeeAccount.address === loginAccount;
  const isChecking =
    objectWaitQueue.some((item) => item.status === 'CHECK') || isEmpty(storeFeeParams);
  const operationName = objectOperation[0][1];

  const createTmpAccountGasFee = useMemo(() => {
    const grantAllowTxFee = BN(gnfdGasFeesConfig[MsgGrantAllowanceTypeUrl].gasFee).plus(
      BN(gnfdGasFeesConfig[MsgGrantAllowanceTypeUrl].perItemFee).times(1),
    );
    const putPolicyTxFee = BN(gnfdGasFeesConfig[MsgPutPolicyTypeUrl].gasFee);

    return grantAllowTxFee.plus(putPolicyTxFee).toString(DECIMAL_NUMBER);
  }, [gnfdGasFeesConfig]);

  const storeFee = useMemo(() => {
    if (isEmpty(storeFeeParams) || isChecking) {
      return '-1';
    }
    return objectWaitQueue
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
  }, [objectWaitQueue, isChecking, storeFeeParams]);

  // delegateUpload：the gas fee will be paid by primarySp
  const gasFee = useMemo(() => {
    if (delegateUpload) return '0';

    if (isChecking) return -1;
    const waitUploadCount = objectWaitQueue.filter(
      (item: WaitObject) => item.status !== 'ERROR',
    ).length;
    if (waitUploadCount === 1) {
      return singleTxGasFee;
    }

    return BN(waitUploadCount)
      .times(singleTxGasFee)
      .plus(BN(createTmpAccountGasFee).toString(DECIMAL_NUMBER))
      .toString(DECIMAL_NUMBER);
  }, [delegateUpload, isChecking, objectWaitQueue, singleTxGasFee, createTmpAccountGasFee]);

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

  useAsyncEffect(async () => {
    if (isEmpty(storeFeeParams)) {
      return await dispatch(setupStoreFeeParams());
    }
  }, [storeFeeParams]);

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
});
