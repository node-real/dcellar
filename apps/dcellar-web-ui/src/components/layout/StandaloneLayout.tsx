import React from 'react';
import { ThemeProvider, ThemeProviderProps } from '@totejs/uikit';

import { theme } from '@/base/theme';
import LoginContextProvider from '@/context/loginContext/provider';

const StandaloneLayout = ({ children, ...restProps }: ThemeProviderProps) => {
  return (
    <ThemeProvider theme={theme} {...restProps}>
      <LoginContextProvider>{children}</LoginContextProvider>
    </ThemeProvider>
  );
};

export default StandaloneLayout;
