import { antdTheme } from '@/base/theme/antd';
import { ConfigProvider, Tooltip, TooltipProps } from 'antd';
import { memo } from 'react';

type DCTooltipProps = TooltipProps & object;

export const DCTooltip = memo<DCTooltipProps>(function DCTooltip({
  arrow = false,
  overlayInnerStyle,
  ...props
}) {
  return (
    <ConfigProvider theme={antdTheme}>
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
