import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { useAppSelector } from '@/store';
import { selectAccount } from '@/store/slices/accounts';
import { selectGnfdGasFeesConfig, selectStoreFeeParams } from '@/store/slices/global';
import { BN } from '@/utils/math';
import { getQuotaNetflowRate, getStoreNetflowRate } from '@/utils/payment';
import { MsgUpdateBucketInfoTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { useMemo } from 'react';
import { useSettlementFee } from './useSettlementFee';
import { isEmpty } from 'lodash-es';

type ChangePaymentAccountFee = {
  loading: boolean;
  fromSettlementFee: string;
  toSettlementFee: string;
  storeFee: string;
  quotaFee: string;
  gasFee: string;
};

export const useChangePaymentAccountFee = ({
  from,
  to,
  storageSize,
  readQuota,
}: {
  from: string;
  to: string;
  storageSize: number;
  readQuota: number;
}): ChangePaymentAccountFee => {
  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);

  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const { settlementFee: fromSettlementFee, loading: loading1 } = useSettlementFee(from);
  const { settlementFee: toSettlementFee, loading: loading2 } = useSettlementFee(to);

  const { gasFee } = gnfdGasFeesConfig?.[MsgUpdateBucketInfoTypeUrl] ?? {};
  const storeFee = BN(getStoreNetflowRate(storageSize, storeFeeParams, true))
    .times(storeFeeParams.reserveTime)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    .toString();

  const quotaFee = BN(getQuotaNetflowRate(readQuota, storeFeeParams))
    .times(storeFeeParams.reserveTime)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    .toString();

  return {
    loading: loading1 || loading2,
    fromSettlementFee,
    toSettlementFee,
    storeFee,
    quotaFee,
    gasFee: String(gasFee),
  };
};

export const useValidateChangePaymentFee = ({
  from,
  to,
  fromSettlementFee,
  toSettlementFee,
  storeFee,
  quotaFee,
  gasFee,
  toSponsor,
  fromSponsor,
}: Omit<ChangePaymentAccountFee, 'loading'> & {
  from: string;
  to: string;
  toSponsor: boolean;
  fromSponsor: boolean;
}) => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const fromAccountDetail = useAppSelector(selectAccount(from));
  const toAccountDetail = useAppSelector(selectAccount(to));

  const validFrom = useMemo(() => {
    const isOwnerAccount = loginAccount === from;
    const remainingBankBalance = BN(bankBalance).minus(gasFee);
    const gasFeeEnough = remainingBankBalance.isGreaterThanOrEqualTo(0);
    if (isOwnerAccount) {
      const storeFeeEnough = remainingBankBalance
        .plus(fromAccountDetail.staticBalance)
        .minus(fromSettlementFee)
        .isGreaterThanOrEqualTo(0);

      return gasFeeEnough && storeFeeEnough;
    }

    const storeFeeEnough =
      fromSponsor ||
      BN(fromAccountDetail.staticBalance).minus(fromSettlementFee).isGreaterThanOrEqualTo(0);

    return gasFeeEnough && storeFeeEnough;
  }, [
    bankBalance,
    from,
    fromSponsor,
    fromAccountDetail.staticBalance,
    fromSettlementFee,
    gasFee,
    loginAccount,
  ]);

  const validTo = useMemo(() => {
    const isOwnerAccount = loginAccount === to;
    const remainingBankBalance = BN(bankBalance).minus(gasFee);
    const gasFeeEnough = remainingBankBalance.isGreaterThanOrEqualTo(0);
    if (isOwnerAccount) {
      const storeFeeEnough = remainingBankBalance
        .plus(toAccountDetail.staticBalance)
        .minus(toSettlementFee)
        .isGreaterThanOrEqualTo(0);

      return gasFeeEnough && storeFeeEnough;
    }

    const storeFeeEnough =
      toSponsor ||
      BN(toAccountDetail.staticBalance)
        .minus(toSettlementFee)
        .minus(storeFee)
        .minus(quotaFee)
        .isGreaterThanOrEqualTo(0);

    return gasFeeEnough && storeFeeEnough;
  }, [
    toSponsor,
    bankBalance,
    gasFee,
    loginAccount,
    storeFee,
    quotaFee,
    to,
    toAccountDetail.staticBalance,
    toSettlementFee,
  ]);

  return { validFrom, validTo };
};
