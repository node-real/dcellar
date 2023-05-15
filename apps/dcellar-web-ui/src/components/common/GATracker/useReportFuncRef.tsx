import { reportEvent } from '@/utils/reportEvent';
import { useRef } from 'react';

// Ensure the reporting doesn't trigger when data changes, but only the specific events occur.
export const useReportFuncRef = (name: string, data = {}) => {
  const reportFuncRef = useRef<Function>();

  reportFuncRef.current = () => {
    if (!name) return;

    reportEvent({
      name,
      data: data ?? {},
    });
  };

  return reportFuncRef;
};
