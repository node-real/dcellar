import React, { createContext, useEffect, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import Long from 'long';
import { toast } from '@totejs/uikit';
import { useBalance, useNetwork } from 'wagmi';

import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useLogin } from '@/hooks/useLogin';
import { client } from '@/base/client';
import { getUtcZeroTimestamp } from '@/utils/time';

const MINIUM_ALLOWED_CHANGED_BALANCE = '0.000005';

type TChainBalance = {
  chainId: number | null;
  availableBalance: string | null;
  lockFee: string | null;
  isLoading: boolean;
  isError: boolean;
};
const initialState = {
  chainId: null,
  availableBalance: null,
  lockFee: null,
  isLoading: false,
  isError: false,
};

export const BalanceContext = createContext<TChainBalance>(initialState);

function ChainBalanceContextProvider(props: any) {
  const loginData = useLogin();
  const { loginState = {} } = loginData;
  const { address } = loginState as any;
  const { chain } = useNetwork();
  const intervalRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentAvailableBalance, setCurrentAvailableBalance] = useState<string | null>(null);
  const [currentLockFee, setCurrentLockFee] = useState<string | null>(null);
  const [currentLatestStaticBalance, setCurrentLatestStaticBalance] = useState<BigNumber>(
    BigNumber(0),
  );
  const [currentNetflowRate, setCurrentNetflowRate] = useState<BigNumber>(BigNumber(0));
  const [useMetamaskValue, setUseMetamaskValue] = useState(false);
  const { data: greenfieldBalanceData } = useBalance({
    address: address as any,
    chainId: GREENFIELD_CHAIN_ID,
    // TODO
    watch: false,
  });

  const resetAllStatus = () => {
    setCurrentAvailableBalance(null);
    setCurrentLockFee(null);
    setIsLoading(false);
    setIsError(false);
    setCurrentLatestStaticBalance(BigNumber(0));
    setCurrentNetflowRate(BigNumber(0));
  };

  const fetchBalance = (address?: string) => {
    if (address) {
      getGnfdBalance(address);
    } else {
      resetAllStatus();
    }
  };

  const getGnfdBalance = async (address: string) => {
    try {
      setIsLoading(true);
      setUseMetamaskValue(false);
      const { balance } = await client.account.getAccountBalance({
        address,
        denom: 'BNB',
      })
      const { amount = '0' } = balance ?? {};
      try {
        const { streamRecord } = await client.payment.getStreamRecord(address);
        const { netflowRate, staticBalance, crudTimestamp, bufferBalance, lockBalance } =
          streamRecord ?? {};
        setCurrentNetflowRate(BigNumber(netflowRate ?? '0').dividedBy(Math.pow(10, 18)));
        const latestStaticBalance = BigNumber(staticBalance as string)
          .plus(
            BigNumber(netflowRate as string).times(
              Math.floor(getUtcZeroTimestamp()/1000) - (crudTimestamp as Long).toNumber(),
            ),
          )
          .dividedBy(Math.pow(10, 18));
        setCurrentLatestStaticBalance(latestStaticBalance);
        const availableBalance = BigNumber(amount)
          .plus(BigNumber.max(0, latestStaticBalance))
          .dividedBy(Math.pow(10, 18));
        setCurrentAvailableBalance(availableBalance.toString());
        let lockFee = BigNumber(lockBalance as string).plus(BigNumber(bufferBalance as string));
        let finalLockFee = latestStaticBalance.isLessThan(0)
          ? lockFee.plus(latestStaticBalance)
          : lockFee;
        setCurrentLockFee(finalLockFee.dividedBy(Math.pow(10, 18)).toString());
        setIsLoading(false);
      } catch (error: any) {
        if (error.message.includes('key not found')) {
          const availableBalance = BigNumber(amount).dividedBy(Math.pow(10, 18));
          setCurrentAvailableBalance(availableBalance.toString());
          setCurrentLockFee(null);
          setCurrentLatestStaticBalance(BigNumber(0));
          setCurrentNetflowRate(BigNumber(0));
          setIsLoading(false);
        } else {
          throw new Error(error);
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      setIsError(true);
      // This account didn't register in greenfield chain
      if (error.message.includes('key not found')) {
        setCurrentAvailableBalance(greenfieldBalanceData?.formatted || null);
        setUseMetamaskValue(true);
        setCurrentLockFee(null);
      } else {
        setUseMetamaskValue(false);
        toast.error({
          description: 'Get balance and lock fee error. Please try again later.',
        });
      }
      // eslint-disable-next-line no-console
      console.error('Get balance and lock fee error', error);
    }
  };

  // get greenfield chain balance
  useEffect(() => {
    fetchBalance(address);
  }, [address]);
  useEffect(() => {
    // If net flow rate is 0, then don't start the interval progress
    if (currentNetflowRate.toNumber() !== 0) {
      intervalRef.current = setInterval(() => {
        setCurrentLatestStaticBalance((currentLatestStaticBalance) =>
          currentLatestStaticBalance.plus(currentNetflowRate),
        );
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, [currentNetflowRate]);

  useEffect(() => {
    if (currentLatestStaticBalance.isGreaterThan(0)) {
      const newAvailableBalance = BigNumber(currentAvailableBalance || 0)
        .plus(currentNetflowRate)
        .toString();
      setCurrentAvailableBalance(newAvailableBalance);
    } else {
      const newLockFee = BigNumber(currentLockFee || 0)
        .plus(currentNetflowRate)
        .toString();
      setCurrentLockFee(newLockFee);
    }
  }, [currentLatestStaticBalance, currentNetflowRate]);
  useEffect(() => {
    if (useMetamaskValue) {
      // directly use metamask value and change whenever metamask is changing
      setCurrentAvailableBalance(greenfieldBalanceData?.formatted || null);
      return;
    }
    const metamaskBalance = BigNumber(greenfieldBalanceData?.formatted ?? '0');
    // Fetch balance again if metamask value is too much lower or higher than current available balance
    if (
      BigNumber(metamaskBalance)
        .minus(BigNumber(currentAvailableBalance ?? '0'))
        .abs() >= BigNumber(MINIUM_ALLOWED_CHANGED_BALANCE)
    ) {
      fetchBalance(address);
    }
  }, [greenfieldBalanceData?.formatted]);
  return (
    <BalanceContext.Provider
      value={{
        isLoading,
        isError,
        chainId: chain?.id || null,
        availableBalance: currentAvailableBalance,
        lockFee: currentLockFee,
      }}
    >
      {props.children}
    </BalanceContext.Provider>
  );
}

export default ChainBalanceContextProvider;
