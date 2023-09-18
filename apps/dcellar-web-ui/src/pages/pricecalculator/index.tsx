import { StaticPage } from '@/components/layout/StaticPage';
import { PriceCalculator } from '@/modules/price-calculator';
import { ReactElement } from 'react';

export default function PriceCalculatorPage() {
  return (
    <PriceCalculator/>
  );
}

PriceCalculatorPage.getLayout = (page: ReactElement) => {
  return <StaticPage page={page} />;
};
