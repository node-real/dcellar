import { getSettlementFee } from '@/utils/payment';
import { useAsyncEffect } from 'ahooks';
import { useState } from 'react';

export const useSettlementFee = (address: string) => {
  const [settlementFee, setSettlementFee] = useState('-1');
  useAsyncEffect(async () => {
    if (!address) return;

    const [fee, error] = await getSettlementFee(address);
    error ? setSettlementFee('0') : setSettlementFee(fee as string);
  }, [address]);

  return {
    loading: settlementFee === '-1',
    settlementFee,
  };
};
