import { memo } from 'react';
import { ConfigProvider, Select, SelectProps, ThemeConfig } from 'antd';

interface DCComboBoxProps extends SelectProps {}

const theme: ThemeConfig = {
  token: {},
};

export const DCComboBox = memo<DCComboBoxProps>(function DCComboBox({ ...props }) {
  return (
    <ConfigProvider theme={theme}>
      <Select {...props} />
    </ConfigProvider>
  );
});
