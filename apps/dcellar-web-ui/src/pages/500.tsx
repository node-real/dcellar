import { ReactNode } from 'react';
import ErrorComponent from '@/components/ErrorComponent';

export default function InternalError() {
  return <ErrorComponent statusCode={500} />;
}

InternalError.getLayout = function getLayout(page: ReactNode) {
  return <>{page}</>;
};
