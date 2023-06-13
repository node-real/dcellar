import { useReportFuncRef } from './useReportFuncRef';
import React, { useMemo } from 'react';

export interface GAClickProps {
  name?: string;
  data?: Record<string, any>;
  children: React.ReactElement;
}

export const GAClick = React.forwardRef((props: GAClickProps, ref: any) => {
  const { name = '', data, children, ...restProps } = props;

  const reportFuncRef = useReportFuncRef(name, data);

  const clones = useMemo(() => {
    const child: any = React.Children.only(children);

    const clone = React.cloneElement(child, {
      ...restProps,
      ...child.props,
      ref,
      onClick: (event: React.MouseEvent) => {
        const originClick = child.props.onClick;
        originClick?.call(child, event);

        reportFuncRef.current?.();
      },
    });

    return clone;
  }, [children, ref, reportFuncRef, restProps]);

  return clones;
});
