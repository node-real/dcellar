import { ReactNode, useReducer, useEffect, useMemo, useCallback, PropsWithChildren } from 'react';

import {
  LoginReducer,
  LoginContext,
  initializer,
  initialState,
  LOGIN_STORAGE_KEY,
} from '@/context/LoginContext/index';

import { useAccount, useDisconnect } from 'wagmi';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { removeOffChainData } from '@/modules/off-chain-auth/utils';
import { useLoginGuard } from '@/context/LoginContext/useLoginGuard';
import { useWalletSwitchAccount } from '@/context/WalletConnectContext';
import { useRouter } from 'next/router';

export interface LoginContextProviderProps {
  inline?: boolean; // for in page connect button
}

export function LoginContextProvider(props: PropsWithChildren<LoginContextProviderProps>) {
  const { children, inline = false } = props;

  const [loginState, loginDispatch] = useReducer(LoginReducer, initialState, initializer);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(loginState));
    }
  }, [loginState]);

  const { disconnect } = useDisconnect();

  const logout = useCallback(() => {
    loginDispatch({
      type: 'LOGOUT',
    });

    removeOffChainData(loginState?.address, GREENFIELD_CHAIN_ID);
    disconnect();
  }, [disconnect, loginState?.address]);

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

  const { pathname } = useRouter();
  const { address: walletAddress } = useAccount();

  useEffect(() => {
    if (pathname === '/' || inline) return;

    if (!walletAddress || loginState.address !== walletAddress) {
      logout();
    }
    // don't remove the eslint comment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, pathname]);

  const { pass } = useLoginGuard(loginState, inline);

  if (!pass) {
    return null;
  }

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}
