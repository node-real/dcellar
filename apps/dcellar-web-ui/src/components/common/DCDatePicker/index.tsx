import { ConfigProvider, DatePicker, DatePickerProps } from 'antd';
import { memo } from 'react';
import { antdTheme } from '@/base/theme/antd';

type DCDatePickerProps = DatePickerProps;

export const DCDatePicker = memo<DCDatePickerProps>(function DCDatePicker(props) {
  return (
    <ConfigProvider theme={antdTheme}>
      <DatePicker {...props} />
    </ConfigProvider>
  );
});
