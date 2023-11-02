import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { ConfigProvider, Select, SelectProps } from 'antd';
import { Flex, Text } from '@totejs/uikit';
import styled from '@emotion/styled';
import { antdTheme } from '@/base/theme/antd';
import { IconFont } from '@/components/IconFont';
import { DCDatePicker } from '@/components/common/DCDatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface DCComboBoxProps extends SelectProps {
  addon?: ReactNode;
  dateChange?: (date: Dayjs) => void;
}

export const DCComboBox = memo<DCComboBoxProps>(function DCComboBox({
  addon,
  dateChange = () => {},
  ...props
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const now = new Date();
  now.setMonth(now.getMonth() + 6);
  const [date, setDate] = useState<Dayjs>(dayjs(now));
  const dateChangeRef = useRef(dateChange);

  useEffect(() => {
    dateChangeRef.current(date);
  }, [date]);

  return (
    <Container ref={ref}>
      <ConfigProvider theme={antdTheme}>
        <Select
          maxTagTextLength={42}
          getPopupContainer={() => ref.current!}
          dropdownStyle={{
            ...props.dropdownStyle,
            padding: 0,
          }}
          dropdownRender={() => <></>}
          open={false}
          dropdownAlign={{ offset: [0, 32] }}
          {...props}
        />
      </ConfigProvider>
      {addon}
      <ExpireSelector>
        <IconFont type={'calendar'} w={20} mr={4} />
        Access expires {dayjs(date).format('D MMM, YYYY')}{' '}
        <Text as={'span'} ml={16} onClick={() => setOpen(!open)}>
          Edit
        </Text>
        <DCDatePicker
          value={date}
          dropdownAlign={{ offset: [-80] }}
          open={open}
          style={{ visibility: 'hidden', width: 0 }}
          onOpenChange={(open) => setOpen(open)}
          showToday={false}
          getPopupContainer={() => ref.current!}
          onChange={(e) => e && setDate(e)}
          disabledDate={(e) => e && e < dayjs().endOf('day')}
        />
      </ExpireSelector>
    </Container>
  );
});

const ExpireSelector = styled(Flex)`
  position: absolute;
  bottom: 1px;
  left: 1px;
  width: calc(100% - 2px);
  border-top: 1px solid var(--ui-colors-readable-border);
  background: var(--ui-colors-bg-middle);
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 7px 8px 8px 8px;
  :before {
    content: '';
    position: absolute;
    box-shadow: 0 -4px 12px 1px rgba(0, 0, 0, 0.08);
    width: 100%;
    left: 0;
    top: 0;
  }

  font-size: 12px;
  font-weight: 500;

  > span {
    transition: all 0.15s;
    cursor: pointer;
    color: var(--ui-colors-brand-brand6);
    :hover {
      color: var(--ui-colors-brand-brand5);
    }
  }
`;

// todo refactor
const Container = styled(Flex)`
  position: relative;
  flex: 1;
  min-width: 0;
  .ant-select-selector {
    margin-bottom: 28px;
  }
  .ant-select-arrow > * {
    margin-bottom: 28px;
  }

  .ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    font-weight: normal;
  }

  .ant-select-item-option-state {
    display: none;
  }

  .ant-select {
    cursor: default;
    border-radius: 4px;
    border: 1px solid #e6e8ea;

    &:focus-within {
      border: 1px solid #00ba34;
    }
  }

  background: #fff;

  > div:first-of-type {
    flex: 1;
    min-width: 0;

    .ant-select-selector {
      padding-right: 0;
      padding-inline-end: 0;
      padding-left: 0;
    }
  }

  .ant-select-selection-placeholder {
    color: #76808f;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
    margin-left: 4px;
  }

  .ant-select-selection-search-input,
  .ant-select-selection-item-content {
    font-size: 12px;
    font-family: Inter, sans-serif;
    line-height: 32px;
    height: 32px;
  }

  .ant-select-dropdown {
    box-shadow: none;
    border: 1px solid #e6e8ea;

    .ant-select-item {
      border-radius: 0;
    }
  }

  .ant-select-selection-overflow {
    padding: 6px 56px 6px 8px;
    display: flex;
    gap: 10px 8px;
  }
`;
