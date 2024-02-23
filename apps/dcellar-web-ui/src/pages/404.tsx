import ErrorComponent from '@/components/ErrorComponent';
import { ReactNode } from 'react';

export default function NotFoundPage() {
  return <ErrorComponent statusCode={404} />;
}

NotFoundPage.getLayout = function getLayout(page: ReactNode) {
  return <>{page}</>;
};
