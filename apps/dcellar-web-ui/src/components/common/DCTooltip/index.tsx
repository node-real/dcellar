import { memo } from 'react';
import { ConfigProvider, Tooltip, TooltipProps } from 'antd';
import { theme } from '@/base/theme/antd';

type DCTooltipProps = TooltipProps & {};

export const DCTooltip = memo<DCTooltipProps>(function DCTooltip({
  arrow = false,
  overlayInnerStyle,
  ...props
}) {
  return (
    <ConfigProvider theme={theme}>
      <Tooltip
        overlayInnerStyle={{
          borderRadius: 4,
          border: '1px solid #E6E8EA',
          padding: '4px 8px',
          background: '#FFFFFF',
          color: '#1E2026',
          fontSize: 12,
          lineHeight: '15px',
          minHeight: 25,
          boxShadow: 'none',
          ...overlayInnerStyle,
        }}
        {...props}
        arrow={arrow}
      />
    </ConfigProvider>
  );
});
