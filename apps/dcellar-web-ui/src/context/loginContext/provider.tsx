import React, { ReactNode, useReducer, useEffect, useMemo, useCallback } from 'react';

import { LoginReducer, LoginContext, initializer, initialState, LOGIN_STORAGE_KEY } from './index';
import { useRouter } from 'next/router';
import { useDisconnect } from 'wagmi';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { removeOffChainData } from '@/modules/off-chain-auth/utils';
import { useLoginGuard } from '@/context/LoginContext/useLoginGuard';
import { useWalletSwitchAccount } from '@/context/WalletConnectContext';

export interface LoginContextProviderProps {
  children: ReactNode;
}

export function LoginContextProvider(props: LoginContextProviderProps) {
  const { children } = props;

  const [loginState, loginDispatch] = useReducer(LoginReducer, initialState, initializer);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(loginState));
    }
  }, [loginState]);

  const router = useRouter();
  const { disconnect } = useDisconnect();

  const logout = useCallback(() => {
    loginDispatch({
      type: 'LOGOUT',
    });

    removeOffChainData(loginState?.address, GREENFIELD_CHAIN_ID);
    disconnect();

    router.replace('/');
  }, [disconnect, loginState?.address, router]);

  const value = useMemo(() => {
    return {
      loginState,
      loginDispatch,
      logout,
    };
  }, [loginState, logout]);

  useWalletSwitchAccount(() => {
    logout();
  });

  const { isReady } = useLoginGuard(loginState);

  if (!isReady) {
    return null;
  }

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}
