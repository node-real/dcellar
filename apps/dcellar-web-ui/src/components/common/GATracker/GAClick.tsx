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
      onClick: (event: React.MouseEvent) => {
        const { isDisabled, onClick: originClick } = child.props;
        originClick?.call(child, event);

        if (!isDisabled) {
          reportFuncRef.current?.();
        }
      },
    });

    return clone;
  }, [children, ref, reportFuncRef, restProps]);

  return clones;
});
