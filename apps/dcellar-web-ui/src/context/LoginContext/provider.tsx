import { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react';

import { LoginContext } from '@/context/LoginContext/index';

import { useAccount, useDisconnect } from 'wagmi';
import { useLoginGuard } from '@/context/LoginContext/useLoginGuard';
import { useWalletSwitchAccount } from '@/context/WalletConnectContext';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { checkSpOffChainMayExpired, setLogin, setLogout } from '@/store/slices/persist';
import { useAsyncEffect, useMount } from 'ahooks';
import { resetUploadQueue, setDisconnectWallet, setTaskManagement } from '@/store/slices/global';
import { ssrLandingRoutes } from '@/pages/_app';

export interface LoginContextProviderProps {
  inline?: boolean; // for in page connect button
}

export function LoginContextProvider(props: PropsWithChildren<LoginContextProviderProps>) {
  const dispatch = useAppDispatch();
  const { children, inline = false } = props;
  const { loginAccount } = useAppSelector((root) => root.persist);

  const { disconnect } = useDisconnect();

  const logout = useCallback(
    (removeSpAuth = false) => {
      dispatch(resetUploadQueue({ loginAccount }));
      dispatch(setLogout(removeSpAuth));
      dispatch(setDisconnectWallet(false));
      dispatch(setTaskManagement(false));
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
  const { address: walletAddress, isConnected, connector } = useAccount();

  const connectorRef = useRef(connector);
  connectorRef.current = connector;

  useMount(() => {
    if (!isConnected) return;
    setTimeout(() => {
      if (connectorRef.current) return;
      logout();
    }, 1200);
  });

  useEffect(() => {
    if (pathname === '/' || inline) return;

    if (!walletAddress || loginAccount !== walletAddress) {
      logout();
    }

    // Once the wallet is connected, we can get the address
    // but if wallet is locked, we can't get the connector from wagmi
    // to avoid errors when using the connector, we treat this situation as logout.
    const timer = setTimeout(() => {
      if (!isConnected) {
        logout();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [inline, isConnected, loginAccount, logout, pathname, walletAddress]);

  useAsyncEffect(async () => {
    // ssr pages loginAccount initial value ''
    if (walletAddress) {
      const spMayExpired = await dispatch(checkSpOffChainMayExpired(walletAddress));
      if (loginAccount === walletAddress) {
        // expire date less than 24h，remove sp auth & logout
        if (spMayExpired) logout(true);
        return;
      }
      if (!loginAccount && !spMayExpired) {
        dispatch(setLogin(walletAddress));
        return;
      }
    }
  }, [walletAddress, loginAccount]);

  const { pass } = useLoginGuard(inline);

  if (!pass && !ssrLandingRoutes.some((item) => item === pathname)) {
    return null;
  }

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}
