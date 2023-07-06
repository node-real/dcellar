import { ReactNode } from 'react';
import ErrorComponent from '@/components/ErrorComponent';

export default function NotFoundPage() {
  return <ErrorComponent statusCode={404} />;
}

NotFoundPage.getLayout = function getLayout(page: ReactNode) {
  return <>{page}</>;
};
