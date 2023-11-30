import { forwardRef } from 'react';
import { html, HTMLProps } from '@totejs/uikit';

export interface IconFontProps extends HTMLProps<'svg'> {
  type: string;
}

export const IconFont = forwardRef<SVGSVGElement, IconFontProps>(function IconFont(
  { type, w = '1em', h = w, ...props },
  ref,
) {
  if (!type) return null;
  return (
    <html.svg ref={ref} w={w} h={h} flexShrink={0} {...props}>
      <use xlinkHref={`#icon-${type.toLowerCase()}`} />
    </html.svg>
  );
});
