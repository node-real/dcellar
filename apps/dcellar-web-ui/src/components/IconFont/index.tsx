import { forwardRef, LegacyRef, SVGProps } from 'react';
import styled from '@emotion/styled';

interface IconFontProps extends SVGProps<SVGSVGElement> {
  type: string;
  ref?: LegacyRef<SVGSVGElement>;
}

const _IconFont = forwardRef<SVGSVGElement, IconFontProps>(
  ({ type, className = '', ...props }, ref) => {
    return (
      <svg ref={ref} width="1em" height="1em" {...props}>
        <use xlinkHref={`#icon-${type}`} />
      </svg>
    );
  },
);

export const IconFont = styled(_IconFont)``;
