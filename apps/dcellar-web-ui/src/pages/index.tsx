import { LandingPage } from '@/components/layout/LandingPage';
import { Welcome } from '@/modules/welcome';
import { ReactElement } from 'react';

export default function Home() {
  return <Welcome />;
}

// Home.getLayout = (page: ReactElement) => {
//   return <LandingPage page={page} />;
// };
