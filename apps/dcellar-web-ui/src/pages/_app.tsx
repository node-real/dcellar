import '@/public/fonts/index.css';
import type { AppContext, AppProps } from 'next/app';
import { createClient, WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

import Layout from '@/components/layout';
import {
  metaMaskWalletConnector,
  provider,
  trustWalletConnector,
  webSocketProvider,
} from '@/utils/wallet/config';
import { runtimeEnv } from '@/base/env';
import { BnbPriceProvider } from '@/context/GlobalContext/BnbPriceProvider';
import { PageProtect } from '@/context/GlobalContext/PageProtect';
import { GAPageView } from '@/components/common/GATracker';
import { StatusCodeContext } from '@/context/GlobalContext/StatusCodeContext';
import { OffChainAuthProvider } from '@/modules/off-chain-auth/OffChainAuthContext';
import { SPProvider } from '@/context/GlobalContext/SPProvider';
import { ChecksumWorkerProvider } from '@/context/GlobalContext/ChecksumWorkerContext';
import { useRouter } from 'next/router';
import StandaloneLayout from '@/components/layout/StandaloneLayout';

const wagmiClient = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
  connectors: [trustWalletConnector, metaMaskWalletConnector],
});

interface NextAppProps extends AppProps {
  statusCode: number;
}

const STANDALONE_PAGES = ['/share'];

function App({ Component, pageProps, statusCode }: NextAppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const { pathname } = useRouter();

  if (STANDALONE_PAGES.includes(pathname))
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiConfig client={wagmiClient}>
          <SPProvider>
            <StandaloneLayout>
              <OffChainAuthProvider>
                <Component {...pageProps} />
                <GAPageView />
              </OffChainAuthProvider>
            </StandaloneLayout>
          </SPProvider>
        </WagmiConfig>
      </QueryClientProvider>
    );

  return (
    <StatusCodeContext.Provider value={statusCode}>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig client={wagmiClient}>
          <BnbPriceProvider>
            {/* <OffChainAuthProvider> */}
            <Layout>
              <SPProvider>
                <ChecksumWorkerProvider>
                  {/* TODO provider should locate up layout */}
                  <OffChainAuthProvider>
                    <PageProtect>
                      <Component {...pageProps} />
                      <GAPageView />
                    </PageProtect>
                  </OffChainAuthProvider>
                </ChecksumWorkerProvider>
              </SPProvider>
            </Layout>
          </BnbPriceProvider>
        </WagmiConfig>
        <ReactQueryDevtools initialIsOpen={runtimeEnv === 'development'} />
      </QueryClientProvider>
    </StatusCodeContext.Provider>
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
