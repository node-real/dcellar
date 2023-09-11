import { ConfigProvider, InputNumber, InputNumberProps } from 'antd';
import { memo } from 'react';
import { theme } from '@/base/theme/antd';

interface DCInputNumberProps extends InputNumberProps<number> {}

export const DCInputNumber = memo<DCInputNumberProps>(function DCInputNumber({ ...props }) {
  return (
    <ConfigProvider theme={theme}>
      <InputNumber {...props} />
    </ConfigProvider>
  );
});
