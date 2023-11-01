import { ConfigProvider, DatePicker, DatePickerProps } from 'antd';
import { memo } from 'react';
import { antdTheme } from '@/base/theme/antd';
import { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

type DCDatePickerProps = DatePickerProps;

type DCRangePickerProps = RangePickerProps;

export const DCDatePicker = memo<DCDatePickerProps>(function DCDatePicker(props) {
  return (
    <ConfigProvider theme={antdTheme}>
      <DatePicker {...props} />
    </ConfigProvider>
  );
});

export const DCRangePicker = memo<DCRangePickerProps>(function DCRangePicker(props) {
  return (
    <ConfigProvider theme={antdTheme}>
      <RangePicker {...props} />
    </ConfigProvider>
  );
});
