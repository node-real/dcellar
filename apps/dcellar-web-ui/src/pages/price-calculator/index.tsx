import { LandingPage } from '@/components/layout/LandingPage';
import { getBnbPrice } from '@/facade/common';
import { PriceCalculator } from '@/modules/price-calculator';
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

export async function getServerSideProps(context: AppContext) {
  return {
    props: {}
  }
}