import ErrorComponent from '@/components/ErrorComponent';
import { ReactNode } from 'react';

export default function InternalError() {
  return <ErrorComponent statusCode={500} />;
}

InternalError.getLayout = function getLayout(page: ReactNode) {
  return <>{page}</>;
};
