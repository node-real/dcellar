import { reportEvent } from '@/utils/gtag';
import { useRef } from 'react';

// Ensure the reporting doesn't trigger when data changes, but only the specific events occur.
export const useReportFuncRef = (name: string, data = {}) => {
  const reportFuncRef = useRef<() => void>();

  reportFuncRef.current = () => {
    if (!name) return;

    reportEvent({
      name,
      data: data ?? {},
    });
  };

  return reportFuncRef;
};
