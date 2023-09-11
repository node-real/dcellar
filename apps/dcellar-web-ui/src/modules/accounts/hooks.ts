import { useAppSelector } from "@/store";
import { selectStoreFeeParams } from '@/store/slices/global';
import { selectLocateBucket } from '@/store/slices/object';
import { selectAccount } from '@/store/slices/accounts';
import { BN } from "@/utils/BigNumber";
import { isEmpty } from "lodash-es";
import { useMemo } from "react";
import { getTimestampInSeconds } from "@/utils/time";

export const BUFFER_TIME = 24 * 60 * 60;

export const useUnFreezeAmount = (address: string) => {
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const account = useAppSelector(selectAccount(address));
  if (isEmpty(storeFeeParams) || isEmpty(account)) return '--';

  return BN(storeFeeParams.reserveTime).times(BN(account.frozenNetflowRate || account.netflowRate)).toString();
}

// 这边是同理，应该通过bucket算出netflowRate * reserveTime，因为已经冻结了
export const useBucketSettlementAmount = () => {
  const bucket = useAppSelector(selectLocateBucket);
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const { reserveTime = 0 } = storeFeeParams;
  const payStoreFeeAccount = useAppSelector(selectAccount(bucket.PaymentAddress));

  const settlementAmount = useMemo(() => {
    if (isEmpty(storeFeeParams) || isEmpty(payStoreFeeAccount) || isEmpty(bucket)) return '--'
    const { netflowRate, bufferBalance, crudTimestamp } = payStoreFeeAccount;
    const curTimestamp = getTimestampInSeconds();
    const totalFee = BN(netflowRate).times(BN(reserveTime)).abs();
    const costedFee = BN(netflowRate).times(BN(curTimestamp).minus(crudTimestamp));
    const bufferFee = BN(bufferBalance);
    const settlementFee = totalFee.minus(bufferFee.plus(costedFee));

    return settlementFee.toString();
  }, [bucket, payStoreFeeAccount, storeFeeParams, reserveTime]);

  return { settlementAmount };
}

// 冻结了之后，不能用settleTime来算了，应该是frozenNetflowRate * reserveTime
export const useAccountSettlementAmount = (address: string) => {
  const payStoreFeeAccount = useAppSelector(selectAccount(address));
  const settlementAmount = useMemo(() => {
    if (isEmpty(payStoreFeeAccount) || !address) return '--';
    const curTimestamp = getTimestampInSeconds();
    const { netflowRate, crudTimestamp } = payStoreFeeAccount;

    const amount = BN(netflowRate).times(BN(curTimestamp).minus(BN(crudTimestamp)))

    return amount.toString();
  }, [address, payStoreFeeAccount]);

  return {
    settlementAmount
  }
}