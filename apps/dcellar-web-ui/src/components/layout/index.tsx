import React, { useContext } from 'react';
import { ThemeProvider, ThemeProviderProps } from '@totejs/uikit';
import { useDisconnect } from 'wagmi';

import { theme } from '@/base/theme';
import LoginContextProvider from '@/context/loginContext/provider';
import { LoginLayout } from '@/components/layout/LoginLayout';
import ChainBalanceContextProvider from '@/context/GlobalContext/BalanceContext';
import { StatusCodeContext } from '@/context/GlobalContext/StatusCodeContext';
import ErrorComponent from '@/components/ErrorComponent';

const Layout = ({ children, ...restProps }: ThemeProviderProps) => {
  const { disconnect } = useDisconnect();
  const statusCode = useContext(StatusCodeContext);

  if (statusCode !== 200) {
    return <ErrorComponent statusCode={statusCode} />;
  }

  return <Page>{children}</Page>;
};

export default Layout;
