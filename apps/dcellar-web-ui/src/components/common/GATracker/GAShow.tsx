import React, { useEffect } from 'react';
import { useReportFuncRef } from './useReportFuncRef';

export interface GAShowProps {
  name?: string;
  data?: Record<string, any>;
  isShow?: boolean;
  children?: React.ReactNode;
}

export const GAShow = (props: GAShowProps) => {
  const { name = '', data, isShow = true, children } = props;

  const reportFuncRef = useReportFuncRef(name, data);

  useEffect(() => {
    if (isShow && name) {
      reportFuncRef.current?.();
    }
  }, [isShow, name, reportFuncRef]);

  return <>{children}</>;
};
