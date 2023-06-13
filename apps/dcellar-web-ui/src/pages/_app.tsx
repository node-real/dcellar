import type { AppContext, AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

import Layout from '@/components/layout';
import { runtimeEnv } from '@/base/env';
import { BnbPriceProvider } from '@/context/GlobalContext/BnbPriceProvider';
import { PageProtect } from '@/context/GlobalContext/PageProtect';
import { GAPageView } from '@/components/common/GATracker';
import { StatusCodeContext } from '@/context/GlobalContext/StatusCodeContext';
import { OffChainAuthProvider } from '@/modules/off-chain-auth/OffChainAuthContext';
import { SPProvider } from '@/context/GlobalContext/SPProvider';
import { WalletConnectProvider } from '@/context/WalletConnectContext';
import { ThemeProvider } from '@totejs/uikit';
import { theme } from '@/base/theme';
import { LoginContextProvider } from '@/context/loginContext/provider';
import ChainBalanceContextProvider from '@/context/GlobalContext/BalanceContext';
import { SEOHead } from '@/components/common/SEOHead';

interface NextAppProps extends AppProps {
  statusCode: number;
}

function App({ Component, pageProps, statusCode }: NextAppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <SEOHead />
      <StatusCodeContext.Provider value={statusCode}>
        <QueryClientProvider client={queryClient}>
          <WalletConnectProvider>
            <LoginContextProvider>
              <BnbPriceProvider>
                <ChainBalanceContextProvider>
                  <ThemeProvider theme={theme}>
                    <Layout>
                      <SPProvider>
                        {/* TODO provider should locate up layout */}
                        <OffChainAuthProvider>
                          <PageProtect>
                            <Component {...pageProps} />
                            <GAPageView />
                          </PageProtect>
                        </OffChainAuthProvider>
                      </SPProvider>
                    </Layout>
                  </ThemeProvider>
                </ChainBalanceContextProvider>
              </BnbPriceProvider>
            </LoginContextProvider>
          </WalletConnectProvider>
          <ReactQueryDevtools initialIsOpen={runtimeEnv === 'development'} />
        </QueryClientProvider>
      </StatusCodeContext.Provider>
    </>
  );
}

// Disable Automatic Static Optimization to make runtime envs work.
App.getInitialProps = async ({ ctx }: AppContext) => {
  const err = ctx.err;

  if (err) {
    Sentry.captureException(err);
  }

  return {
    statusCode: ctx.res?.statusCode || 200,
  };
};

export default App;
