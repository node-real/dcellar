import { ConfigProvider, InputNumber, InputNumberProps } from 'antd';
import { memo } from 'react';
import { antdTheme } from '@/base/theme/antd';

interface DCInputNumberProps extends InputNumberProps<number> {}

export const DCInputNumber = memo<DCInputNumberProps>(function DCInputNumber({ ...props }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <InputNumber {...props} />
    </ConfigProvider>
  );
});
