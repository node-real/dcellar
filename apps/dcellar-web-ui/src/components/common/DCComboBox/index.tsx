import { memo, ReactNode, useRef } from 'react';
import { ConfigProvider, Select, SelectProps } from 'antd';
import { Flex } from '@totejs/uikit';
import styled from '@emotion/styled';
import { antdTheme } from '@/base/theme/antd';

interface DCComboBoxProps extends SelectProps {
  addon?: ReactNode;
}

export const DCComboBox = memo<DCComboBoxProps>(function DCComboBox({ addon, ...props }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Container ref={ref}>
      <ConfigProvider theme={antdTheme}>
        <Select
          getPopupContainer={() => ref.current!}
          dropdownStyle={{
            ...props.dropdownStyle,
            padding: 0,
          }}
          dropdownRender={() => <></>}
          open={false}
          {...props}
        />
      </ConfigProvider>
      {addon}
    </Container>
  );
});

// todo refactor
const Container = styled(Flex)`
  flex: 1;
  min-width: 0;

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
    border: 1px solid var(--system-readable-border, #e6e8ea);

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
