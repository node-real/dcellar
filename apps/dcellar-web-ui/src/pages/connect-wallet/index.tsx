import { LandingPage } from '@/components/layout/LandingPage';
import { ConnectWallet } from '@/modules/connect-wallet';
import { wrapper } from '@/store';
import { ReactElement } from 'react';

export default function ConnectWalletPage() {
  return <ConnectWallet />;
}

ConnectWalletPage.getInitialProps = wrapper.getInitialAppProps(() => async () => {
  return {
    pageProps: {},
  };
});

ConnectWalletPage.getLayout = (page: ReactElement) => {
  return <>{page}</>;
};
