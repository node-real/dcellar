import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@totejs/uikit';
import type { AppProps } from 'next/app';
import App from 'next/app';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { theme } from '@/base/theme';
import { GAPageView } from '@/components/common/GATracker';
import { SEOHead } from '@/components/common/SEOHead';
import { PageProtect } from '@/context/GlobalContext/PageProtect';
import { LoginContextProvider } from '@/context/LoginContext/provider';
import { WalletConnectProvider } from '@/context/WalletConnectContext';
import { OffChainAuthProvider } from '@/modules/off-chain-auth/OffChainAuthContext';
import { wrapper } from '@/store';
import { setupStorageProviders } from '@/store/slices/sp';
import { Page } from '@/components/layout/Page';
import { INLINE_LOGIN_PAGES } from '@/constants/paths';
import { setupBnbPrice } from '@/store/slices/global';

function DcellarApp({ Component, ...rest }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(rest);
  const [queryClient] = useState(() => new QueryClient());
  const { pathname } = useRouter();
  const persistor = persistStore(store, {}, function () {
    persistor.persist();
  });

  return (
    <>
      <SEOHead />
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
              <WalletConnectProvider>
                <LoginContextProvider inline={INLINE_LOGIN_PAGES.includes(pathname)}>
                  <Page>
                    {/* TODO provider should locate up layout */}
                    <OffChainAuthProvider>
                      <PageProtect>
                        <Component {...props.pageProps} />
                        <GAPageView />
                      </PageProtect>
                    </OffChainAuthProvider>
                  </Page>
                </LoginContextProvider>
              </WalletConnectProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </>
  );
}

// Disable Automatic Static Optimization to make runtime envs work.
DcellarApp.getInitialProps = wrapper.getInitialAppProps((store) => async (appCtx) => {
  // todo refactor every page fetch policy
  await Promise.all([store.dispatch(setupStorageProviders()), store.dispatch(setupBnbPrice())]);
  const nest = await App.getInitialProps(appCtx);

  return { pageProps: { ...nest.pageProps } };
});

export default DcellarApp;
