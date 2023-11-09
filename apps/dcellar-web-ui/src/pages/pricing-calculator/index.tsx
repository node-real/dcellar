import { LandingPage } from '@/components/layout/LandingPage';
import { PriceCalculator } from '@/modules/pricing-calculator';
import {  wrapper } from '@/store';
import { setupBnbPrice, setupMainnetStoreFeeParams } from '@/store/slices/global';
import { ReactElement } from 'react';

export default function PriceCalculatorPage() {
  return (
    <PriceCalculator/>
  );
}

PriceCalculatorPage.getLayout = (page: ReactElement) => {
  return <LandingPage page={page} />;
};

PriceCalculatorPage.getInitialProps = wrapper.getInitialAppProps((store) => async (appCtx) => {
  await store.dispatch(setupBnbPrice());
  await store.dispatch(setupMainnetStoreFeeParams())
  return {
    pageProps: {}
  }
});