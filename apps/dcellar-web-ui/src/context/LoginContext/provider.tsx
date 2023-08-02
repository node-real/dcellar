import { PropsWithChildren, useCallback, useMemo } from 'react';

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
    (removeSpAuth = false) => {
      console.log('loginAccount', loginAccount)
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
  const { address: walletAddress } = useAccount();

  useAsyncEffect(async () => {
    if (pathname === '/' || inline) return;

    if (!walletAddress || loginAccount !== walletAddress) {
      logout();
    }

    if (loginAccount === walletAddress) {
      // expire date less than 24h，remove sp auth & logout
      const spMayExpired = await dispatch(checkSpOffChainMayExpired(walletAddress));
      if (spMayExpired) logout(true);
    }
  }, [walletAddress, pathname]);

  const { pass } = useLoginGuard(inline);

  if (!pass) {
    return null;
  }

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}
