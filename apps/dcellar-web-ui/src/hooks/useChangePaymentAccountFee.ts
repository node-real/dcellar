import { TAccount, selectAccountDetail } from '@/store/slices/accounts'
import { useSettlementFee } from './useSettlementFee'
import { BN } from '@/utils/math';
import { useAppSelector } from '@/store';
import { getStoreNetflowRate } from '@/utils/payment';
import { selectStoreFeeParams } from '@/store/slices/global';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { MsgUpdateBucketInfoTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { useCallback, useMemo } from 'react';

type ChangePaymentAccountFee = {
  loading: boolean;
  fromSettlementFee: string;
  toSettlementFee: string;
  storeFee: string;
  gasFee: string;
}
export const useChangePaymentAccountFee = ({ from, to, storageSize }: { from: string, to: string; storageSize: number }): ChangePaymentAccountFee => {
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee } = gasObjects?.[MsgUpdateBucketInfoTypeUrl];
  const { settlementFee: fromSettlementFee, loading: loading1 } = useSettlementFee(from);
  const { settlementFee: toSettlementFee, loading: loading2 } = useSettlementFee(to);
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const storeFee = BN(getStoreNetflowRate(storageSize, storeFeeParams))
    .times(storeFeeParams.reserveTime)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    .toString();
  return {
    loading: loading1 || loading2,
    fromSettlementFee,
    toSettlementFee,
    storeFee,
    gasFee: String(gasFee),
  }
}

export const useValidateChangePaymentFee = ({ from, to, fromSettlementFee, toSettlementFee, storeFee, gasFee }: Omit<ChangePaymentAccountFee, 'loading'> & { from: string; to: string}) => {
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const fromAccountDetail = useAppSelector(selectAccountDetail(from));
  const toAccountDetail = useAppSelector(selectAccountDetail(to));
  const validFrom = useMemo(() => {
    const isOwnerAccount = loginAccount === from;
    const remainingBankBalance = BN(bankBalance).minus(gasFee);
    const gasFeeEnough = remainingBankBalance.isGreaterThanOrEqualTo(0);
    if (isOwnerAccount) {
      const storeFeeEnough = remainingBankBalance.plus(fromAccountDetail.staticBalance).minus(fromSettlementFee).isGreaterThanOrEqualTo(0);

      return gasFeeEnough && storeFeeEnough;
    }

    const storeFeeEnough = BN(fromAccountDetail.staticBalance).minus(fromSettlementFee).isGreaterThanOrEqualTo(0);

    return gasFeeEnough && storeFeeEnough;
  }, [bankBalance, from, fromAccountDetail.staticBalance, fromSettlementFee, gasFee, loginAccount]);

  const validTo = useMemo(() => {
    const isOwnerAccount = loginAccount === to;
    const remainingBankBalance = BN(bankBalance).minus(gasFee);
    const gasFeeEnough = remainingBankBalance.isGreaterThanOrEqualTo(0);
    if (isOwnerAccount) {
      const storeFeeEnough = remainingBankBalance.plus(toAccountDetail.staticBalance).minus(toSettlementFee).isGreaterThanOrEqualTo(0);

      return gasFeeEnough && storeFeeEnough;
    }

    const storeFeeEnough = BN(toAccountDetail.staticBalance).minus(toSettlementFee).minus(storeFee).isGreaterThanOrEqualTo(0);

    return gasFeeEnough && storeFeeEnough;
  }, [bankBalance, gasFee, loginAccount, storeFee, to, toAccountDetail.staticBalance, toSettlementFee]);

  return {
    validFrom,
    validTo,
  }
}