import { Welcome } from '@/modules/welcome';
import React, { ReactNode } from 'react';

export default function Home() {
  return <Welcome />;
}

(Home as any).getLayout = function getLayout(page: ReactNode) {
  return <>{page}</>;
};
