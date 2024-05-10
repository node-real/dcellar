import { LandingPage } from '@/components/layout/LandingPage';
import { PriceCalculator } from '@/modules/pricing-calculator';
import { wrapper } from '@/store';
import { ReactElement } from 'react';
import { setupMainnetStoreFeeParams } from '@/store/slices/global';

export default function PriceCalculatorPage() {
  return <PriceCalculator />;
}

PriceCalculatorPage.getLayout = (page: ReactElement) => {
  return <LandingPage page={page} />;
};

PriceCalculatorPage.getInitialProps = wrapper.getInitialAppProps((store) => async () => {
  if (typeof window === 'undefined') {
    await store.dispatch(setupMainnetStoreFeeParams());
  }
  return {
    pageProps: {},
  };
});
