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
import { usePreloadImages } from '@/hooks/usePreloadImages';
import {
  COPY_SUCCESS_ICON,
  DELETE_ICON_URL,
  FILE_BOX_IMAGE_URL,
  FILE_DELETE_GIF,
  FILE_DOWNLOAD_URL,
  FILE_EMPTY_URL,
  FILE_FAILED_URL,
  FILE_INFO_IMAGE_URL,
  FILE_TOO_LARGE_URL,
  FILE_UPLOAD_URL,
  NOT_ENOUGH_QUOTA_URL,
  PENDING_ICON_URL,
  UPLOAD_IMAGE_URL,
} from '@/modules/file/constant';

const wagmiClient = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
  connectors: [trustWalletConnector, metaMaskWalletConnector],
});

interface NextAppProps extends AppProps {
  statusCode: number;
}

function App({ Component, pageProps, statusCode }: NextAppProps) {
  const [queryClient] = useState(() => new QueryClient());

  usePreloadImages([
    FILE_BOX_IMAGE_URL,
    FILE_TOO_LARGE_URL,
    FILE_FAILED_URL,
    FILE_EMPTY_URL,
    FILE_DELETE_GIF,
    PENDING_ICON_URL,
    COPY_SUCCESS_ICON,
    FILE_UPLOAD_URL,
    FILE_DOWNLOAD_URL,
    NOT_ENOUGH_QUOTA_URL,
    DELETE_ICON_URL,
    UPLOAD_IMAGE_URL,
    FILE_INFO_IMAGE_URL,
  ]);

  return (
    <StatusCodeContext.Provider value={statusCode}>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig client={wagmiClient}>
          <BnbPriceProvider>
            {/* <OffChainAuthProvider> */}
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
