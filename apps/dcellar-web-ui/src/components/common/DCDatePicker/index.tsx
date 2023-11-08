import { ConfigProvider, DatePicker, DatePickerProps } from 'antd';
import { memo } from 'react';
import { antdTheme } from '@/base/theme/antd';
import { RangePickerProps } from 'antd/es/date-picker';
import { css, Global } from '@emotion/react';

const { RangePicker } = DatePicker;

type DCDatePickerProps = DatePickerProps;

type DCRangePickerProps = RangePickerProps;

const globalStyles = css`
  #layout-main {
    .ant-picker-cell.ant-picker-cell-in-view.ant-picker-cell-range-hover-start:not(
        .ant-picker-cell-selected
      ):hover,
    .ant-picker-cell.ant-picker-cell-in-view.ant-picker-cell-range-hover-end:not(
        .ant-picker-cell-selected
      ):hover {
      .ant-picker-cell-inner {
        color: var(--ui-colors-brand-brand6);
      }
    }
  }
`;

export const DCDatePicker = memo<DCDatePickerProps>(function DCDatePicker(props) {
  return (
    <>
      <Global styles={globalStyles} />
      <ConfigProvider theme={antdTheme}>
        <DatePicker {...props} />
      </ConfigProvider>
    </>
  );
});

export const DCRangePicker = memo<DCRangePickerProps>(function DCRangePicker(props) {
  return (
    <>
      <Global styles={globalStyles} />
      <ConfigProvider theme={antdTheme}>
        <RangePicker {...props} />
      </ConfigProvider>
    </>
  );
});
