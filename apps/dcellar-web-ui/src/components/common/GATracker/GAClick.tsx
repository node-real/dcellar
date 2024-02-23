import { mergeRefs } from '@node-real/uikit';
import React, { useMemo } from 'react';
import { useReportFuncRef } from './useReportFuncRef';

export interface GAClickProps {
  name?: string;
  data?: Record<string, any>;
  children: React.ReactElement;
}

export const GAClick = React.forwardRef(function GAClick(props: GAClickProps, ref: any) {
  const { name = '', data, children, ...restProps } = props;

  const reportFuncRef = useReportFuncRef(name, data);

  return useMemo(() => {
    const child: any = React.Children.only(children);

    return React.cloneElement(child, {
      ...restProps,
      ...child.props,
      // todo refactor
      ref: !child.ref && !ref ? undefined : mergeRefs(child.ref, ref),
      onClick: (event: React.MouseEvent) => {
        const { isDisabled, onClick: originClick } = child.props;
        originClick?.call(child, event);

        if (!isDisabled) {
          reportFuncRef.current?.();
        }
      },
    });
  }, [children, ref, reportFuncRef, restProps]);
});
