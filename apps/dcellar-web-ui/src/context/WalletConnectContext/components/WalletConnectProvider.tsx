import '@totejs/walletkit/styles.css';
import { createClient, WagmiConfig } from 'wagmi';
import { bscChain, greenFieldChain } from '@/context/WalletConnectContext/chains';
import { getDefaultConfig, WalletKitOptions, WalletKitProvider } from '@totejs/walletkit';
import { Text, toast } from '@totejs/uikit';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { metaMask, trustWallet } from '@totejs/walletkit/wallets';
import * as Sentry from '@sentry/nextjs';
import { reportEvent } from '@/utils/gtag';
import * as process from 'process';
import { ReactNode, useEffect } from 'react';
import { customTheme } from '@/base/theme/wallet';
import { DCLink } from '@/components/common/DCLink';

const client = createClient(
  getDefaultConfig({
    chains: [bscChain, greenFieldChain],
    appName: 'Connect a Wallet',
    autoConnect: true,
    /* WC 2.0 requires a project ID (get one here: https://cloud.walletconnect.com/sign-in) */
    // walletConnectProjectId: '7c6812d64a55a1438dce3c5b650dca8c',
    connectors: [trustWallet(), metaMask()],
  }),
);

const options: WalletKitOptions = {
  initialChainId: GREENFIELD_CHAIN_ID,
  disclaimer: (
    <Text>
      By connecting your wallet, you agree to our{' '}
      <DCLink whiteSpace={'nowrap'} target="_blank" href="/terms" color={'readable.secondary'}>
        Terms of Use
      </DCLink>
      .
    </Text>
  ),
  onClickWallet(connector) {
    if (!connector?.name) return;
    const name = connector.name.toLowerCase().replace(/\s+/, '_');
    reportEvent({ name: `dc.walletconnect.modal.${name}.click` });
    return true;
  },
  onError(error, description) {
    Sentry.withScope((scope) => {
      scope.setTag('Component', 'WalletConnectProvider');
      Sentry.captureMessage(
        JSON.stringify({
          error,
          description,
        }),
      );
    });
  },
};

export interface WalletConnectProviderProps {
  children: ReactNode;
}

export function WalletConnectProvider(props: WalletConnectProviderProps) {
  const { children } = props;

  return (
    <WagmiConfig client={client}>
      <WalletKitProvider
        options={options}
        mode={'light'}
        customTheme={customTheme}
        debugMode={process.env.NODE_ENV === 'development'}
      >
        {children}
      </WalletKitProvider>
    </WagmiConfig>
  );
}
