import '@/public/fonts/index.css';
import type { AppProps } from 'next/app';
import { createClient, WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

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

const wagmiClient = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
  connectors: [trustWalletConnector, metaMaskWalletConnector],
});

function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig client={wagmiClient}>
        <BnbPriceProvider>
          <Layout>
            <PageProtect>
              <Component {...pageProps} />
              <GAPageView />
            </PageProtect>
          </Layout>
        </BnbPriceProvider>
      </WagmiConfig>
      <ReactQueryDevtools initialIsOpen={runtimeEnv === 'development'} />
    </QueryClientProvider>
  );
}

// Disable Automatic Static Optimization to make runtime envs work.
App.getInitialProps = async () => ({});

export default App;
