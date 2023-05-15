import React from 'react';
import { ThemeProvider, ThemeProviderProps } from '@totejs/uikit';
import { useDisconnect } from 'wagmi';

import { theme } from '@/base/theme';
import LoginContextProvider from '@/context/loginContext/provider';
import { LoginLayout } from '@/components/layout/LoginLayout';
import ChainBalanceContextProvider from '@/context/GlobalContext/BalanceContext';

const Layout = ({ children, ...restProps }: ThemeProviderProps) => {
  const { disconnect } = useDisconnect();

  return (
    <ThemeProvider theme={theme} {...restProps}>
      <LoginContextProvider>
        <ChainBalanceContextProvider>
          {/* @ts-ignore */}
          <LoginLayout disconnect={disconnect}>{children}</LoginLayout>
        </ChainBalanceContextProvider>
      </LoginContextProvider>
    </ThemeProvider>
  );
};

export default Layout;
