import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { customTheme } from '@/base/theme/wallet';
import { DCLink } from '@/components/common/DCLink';
import { bscChain, greenFieldChain } from '@/context/WalletConnectContext/chains';
import { reportEvent } from '@/utils/gtag';
import { Text } from '@node-real/uikit';
import { WalletKitOptions, WalletKitProvider, getDefaultConfig } from '@node-real/walletkit';
import '@node-real/walletkit/styles.css';
import { metaMask, trustWallet, walletConnect } from '@node-real/walletkit/wallets';
import * as Sentry from '@sentry/nextjs';
import * as process from 'process';
import { ReactNode } from 'react';
import { WagmiConfig, createConfig } from 'wagmi';
import * as flatted from 'flatted';

const config = createConfig(
  getDefaultConfig({
    autoConnect: true,
    appName: 'Connect a Wallet',
    /* WC 2.0 requires a project ID (get one here: https://cloud.walletconnect.com/sign-in) */
    walletConnectProjectId: '89848e3205cafe0bf76c91aa1aaa71d0',
    chains: [bscChain, greenFieldChain],
    connectors: [trustWallet(), metaMask(), walletConnect()],
  }),
);

const options: WalletKitOptions = {
  initialChainId: GREENFIELD_CHAIN_ID,
  closeModalAfterConnected: false,
  closeModalOnEsc: false,
  closeModalOnOverlayClick: false,
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
        flatted.stringify({
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
    <WagmiConfig config={config}>
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
