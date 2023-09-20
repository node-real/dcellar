import { LandingPage } from '@/components/layout/LandingPage';
import { PriceCalculator } from '@/modules/pricing-calculator';
import { AppContext } from 'next/app';
import { ReactElement } from 'react';

export default function PriceCalculatorPage() {
  return (
    <PriceCalculator/>
  );
}

PriceCalculatorPage.getLayout = (page: ReactElement) => {
  return <LandingPage page={page} />;
};
