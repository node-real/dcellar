import { ThemeProvider } from '@totejs/uikit';
import type { AppProps } from 'next/app';
import App from 'next/app';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { theme } from '@/base/theme';
import { SEOHead } from '@/components/common/SEOHead';
import { PageProtect } from '@/context/GlobalContext/PageProtect';
import { LoginContextProvider } from '@/context/LoginContext/provider';
import { WalletConnectProvider } from '@/context/WalletConnectContext';
import { wrapper } from '@/store';
import { setupStorageProviders } from '@/store/slices/sp';
import { ReactNode } from 'react';
import { Layout } from '@/components/layout';
import { GlobalManagements } from '@/components/layout/GlobalManagements';
import { OffChainAuthProvider } from '@/context/off-chain-auth/OffChainAuthContext';

export const ssrLandingRoutes = ['/pricing-calculator', '/'];
function DcellarApp({ Component, ...rest }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(rest);
  const persistor = persistStore(store, {}, function () {
    persistor.persist();
  });

  const customLayout = (Component as any).getLayout;
  const getLayout = customLayout || ((page: ReactNode) => <Layout>{page}</Layout>);

  const CommonComponent = (
    <ThemeProvider theme={theme}>
      <WalletConnectProvider>
        <LoginContextProvider inline={!!customLayout}>
          <OffChainAuthProvider>
            {getLayout(
              <PageProtect>
                <Component {...props.pageProps} />
                <GlobalManagements />
              </PageProtect>,
            )}
          </OffChainAuthProvider>
        </LoginContextProvider>
      </WalletConnectProvider>
    </ThemeProvider>
  );
  return (
    <>
      <SEOHead />
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          {process.env.NODE_ENV === 'development' ? CommonComponent : () => CommonComponent}
        </PersistGate>
      </Provider>
    </>
  );
}

// Disable Automatic Static Optimization to make runtime envs work.
DcellarApp.getInitialProps = wrapper.getInitialAppProps((store) => async (appCtx) => {
  // todo refactor every page fetch policy
  // only empty cache, then do fetch
  await store.dispatch(setupStorageProviders());
  const nest = await App.getInitialProps(appCtx);

  return { pageProps: { ...nest.pageProps } };
});

export default DcellarApp;
