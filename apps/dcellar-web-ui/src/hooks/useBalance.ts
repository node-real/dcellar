import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { FetchBalanceResult, fetchBalance } from '@wagmi/core';
import { useCallback, useEffect, useState } from 'react';
import { SetIntervalAsyncTimer, clearIntervalAsync, setIntervalAsync } from 'set-interval-async';

type Timer = { [key: string]: SetIntervalAsyncTimer<[]> | null };
export const useBalance = ({
  address,
  chainId = GREENFIELD_CHAIN_ID,
  intervalMs = 2000,
}: {
  address: `0x${string}`;
  chainId: number;
  intervalMs?: number;
}) => {
  const [balance, setBalance] = useState({} as FetchBalanceResult);
  const [timers, setTimers] = useState<Timer>({});

  const refetch = useCallback(() => {
    if (!address || !chainId) return Promise.resolve({} as FetchBalanceResult);
    return fetchBalance({
      address: address,
      chainId: chainId,
    });
  }, [address, chainId]);

  useEffect(() => {
    if (!address || !chainId) return;
    const key = `${address}_${chainId}`;
    const timer = timers[key];
    if (timer) return;
    Object.values(timers).forEach((timer) => timer && clearIntervalAsync(timer));
    const newTimer = setIntervalAsync(async () => {
      const data = await refetch();
      setBalance(data);
    }, intervalMs);
    timers[key] = newTimer;
    setTimers(timers);

    return () => {
      Object.values(timers).forEach((timer) => timer && clearIntervalAsync(timer));
    };
  }, [address, chainId]);

  return {
    data: balance,
    refetch,
  };
};
