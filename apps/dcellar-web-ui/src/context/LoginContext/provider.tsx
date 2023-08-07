import { PropsWithChildren, useCallback, useEffect, useMemo } from 'react';

import { LoginContext } from '@/context/LoginContext/index';

import { useAccount, useDisconnect } from 'wagmi';
import { useLoginGuard } from '@/context/LoginContext/useLoginGuard';
import { useWalletSwitchAccount } from '@/context/WalletConnectContext';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { checkSpOffChainMayExpired, setLogout } from '@/store/slices/persist';
import { useAsyncEffect } from 'ahooks';
import { resetUploadQueue } from '@/store/slices/global';

export interface LoginContextProviderProps {
  inline?: boolean; // for in page connect button
}

export function LoginContextProvider(props: PropsWithChildren<LoginContextProviderProps>) {
  const dispatch = useAppDispatch();
  const { children, inline = false } = props;
  const { loginAccount } = useAppSelector((root) => root.persist);
  

  const { disconnect } = useDisconnect();

  const logout = useCallback(
    (removeSpAuth = true) => {
      console.log('logout === ')

      dispatch(resetUploadQueue({loginAccount}))
      dispatch(setLogout(removeSpAuth));
      disconnect();
    },
    [disconnect, dispatch, loginAccount],
  );

  const value = useMemo(() => {
    return {
      logout,
    };
  }, [logout]);

  useWalletSwitchAccount(() => {
    logout();
  });

  const { pathname } = useRouter();
  const { address: walletAddress, connector } = useAccount();

  console.log('=======================')
  console.log('wallet:', walletAddress)
  console.log('login:', loginAccount)
  console.log('connector', connector)

  useEffect(() => {
    if (pathname === '/' || inline) return;

    if (!walletAddress || loginAccount !== walletAddress) {
      logout();
    }

    // Once the wallet is connected, we can get the address
    // but if wallet is locked, we can't get the connector from wagmi
    // to avoid errors when using the connector, we treat this situation as logout.
    const timer = setTimeout(() => {
      if (!connector) {
        logout()
      }
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [connector, inline, loginAccount, logout, pathname, walletAddress])

  useAsyncEffect(async () => {
    if (loginAccount === walletAddress) {
      // expire date less than 24h，remove sp auth & logout
      const spMayExpired = await dispatch(checkSpOffChainMayExpired(walletAddress));
      if (spMayExpired) logout(true);
    }
  }, [walletAddress]);

  const { pass } = useLoginGuard(inline);

  if (!pass) {
    return null;
  }

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}
