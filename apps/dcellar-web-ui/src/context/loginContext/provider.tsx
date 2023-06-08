import React, { ReactNode, useReducer, useEffect, useMemo, useCallback } from 'react';

import { LoginReducer, LoginContext, initializer, initialState, LOGIN_STORAGE_KEY } from './index';
import { useRouter } from 'next/router';
import { useDisconnect } from 'wagmi';

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

  const value = useMemo(() => {
    const logout = () => {
      loginDispatch({
        type: 'LOGOUT',
      });

      disconnect();
      router.push('/');
    };

    return {
      loginState,
      loginDispatch,
      logout,
    };
  }, [disconnect, loginState, router]);

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}
