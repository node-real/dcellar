import * as Sentry from '@sentry/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@totejs/uikit';
import type { AppProps } from 'next/app';
import App from 'next/app';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { runtimeEnv } from '@/base/env';
import { theme } from '@/base/theme';
import { GAPageView } from '@/components/common/GATracker';
import { SEOHead } from '@/components/common/SEOHead';
import Layout from '@/components/layout';
import ChainBalanceContextProvider from '@/context/GlobalContext/BalanceContext';
import { BnbPriceProvider } from '@/context/GlobalContext/BnbPriceProvider';
import { ChecksumWorkerProvider } from '@/context/GlobalContext/ChecksumWorkerContext';
import { PageProtect } from '@/context/GlobalContext/PageProtect';
import { StatusCodeContext } from '@/context/GlobalContext/StatusCodeContext';
import { LoginContextProvider } from '@/context/LoginContext/provider';
import { WalletConnectProvider } from '@/context/WalletConnectContext';
import { OffChainAuthProvider } from '@/modules/off-chain-auth/OffChainAuthContext';
import { wrapper } from '@/store';
import { increment } from '@/store/slices/counter';
import { setupStorageProviders } from '@/store/slices/sp';

const STANDALONE_PAGES = ['/share'];

interface NextAppProps extends AppProps {
  statusCode: number;
}

function DcellarApp({ Component, ...rest }: NextAppProps) {
  const { store, props } = wrapper.useWrappedStore(rest);
  const [queryClient] = useState(() => new QueryClient());
  const { pathname } = useRouter();
  const persistor = persistStore(store, {}, function () {
    persistor.persist();
  });

  // todo refactor
  const providers = STANDALONE_PAGES.includes(pathname) ? (
    <QueryClientProvider client={queryClient}>
      <WalletConnectProvider>
        <LoginContextProvider inline>
          <BnbPriceProvider>
            <ChainBalanceContextProvider>
              <ThemeProvider theme={theme}>
                <OffChainAuthProvider>
                  <Component {...props.pageProps} />
                  <GAPageView />
                </OffChainAuthProvider>
              </ThemeProvider>
            </ChainBalanceContextProvider>
          </BnbPriceProvider>
        </LoginContextProvider>
      </WalletConnectProvider>
    </QueryClientProvider>
  ) : (
    <>
      <SEOHead />
      <StatusCodeContext.Provider value={rest.statusCode}>
        <QueryClientProvider client={queryClient}>
          <WalletConnectProvider>
            <LoginContextProvider>
              <BnbPriceProvider>
                <ChainBalanceContextProvider>
                  <ThemeProvider theme={theme}>
                    <Layout>
                      <ChecksumWorkerProvider>
                        {/* TODO provider should locate up layout */}
                        <OffChainAuthProvider>
                          <PageProtect>
                            <Component {...props.pageProps} />
                            <GAPageView />
                          </PageProtect>
                        </OffChainAuthProvider>
                      </ChecksumWorkerProvider>
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

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>{providers}</PersistGate>
    </Provider>
  );
}

// Disable Automatic Static Optimization to make runtime envs work.
DcellarApp.getInitialProps = wrapper.getInitialAppProps((store) => async (appCtx) => {
  const { ctx } = appCtx;
  const error = ctx.err;

  if (error) {
    Sentry.captureException(error);
  }

  await store.dispatch(increment());
  await store.dispatch(setupStorageProviders());
  const children = await App.getInitialProps(appCtx);

  return {
    statusCode: ctx.res?.statusCode || 200,
    pageProps: {
      ...children.pageProps,
    },
  };
});

export default DcellarApp;
