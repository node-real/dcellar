import { memo, ReactNode, useRef } from 'react';
import { ConfigProvider, Select, SelectProps } from 'antd';
import { Flex } from '@totejs/uikit';
import styled from '@emotion/styled';
import { theme } from '@/base/theme/antd';
import { transientOptions } from '@/utils/transientOptions';
import { css } from '@emotion/react';

interface DCComboBoxProps extends SelectProps {
  addon?: ReactNode;
}

export const DCComboBox = memo<DCComboBoxProps>(function DCComboBox({ addon, ...props }) {
  const ref = useRef<HTMLDivElement>(null);

  const dropdown = !!props?.options?.length;

  return (
    <Container ref={ref} $dropdown={dropdown}>
      <ConfigProvider theme={theme}>
        <Select
          {...props}
          getPopupContainer={() => ref.current!}
          dropdownStyle={{
            ...props.dropdownStyle,
            padding: 0,
          }}
          dropdownRender={(origin) => (dropdown ? origin : <></>)}
        />
      </ConfigProvider>
      {addon}
    </Container>
  );
});

// todo refactor
const Container = styled(Flex, transientOptions)<{ $dropdown?: boolean }>`
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
    border-radius: 8px;
    border: 1px solid #e6e8ea;
    padding-right: 56px;
    &:focus-within {
      border: 1px solid #00ba34;
    }
  }
  .ant-select-selector {
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 8px !important;
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
    font-size: 16px;
    font-weight: 400;
    line-height: normal;
    margin-left: 4px;
  }
  .ant-select-selection-search-input,
  .ant-select-selection-item-content {
    font-size: 12px;
    font-family: Inter, sans-serif;
    line-height: 24px;
  }
  .ant-select-dropdown {
    box-shadow: none;
    border: 1px solid var(--system-readable-border, #e6e8ea);
    .ant-select-item {
      border-radius: 0;
    }

    ${(props) =>
      !props.$dropdown &&
      css`
        display: none;
      `}
  }
  .rc-virtual-list-scrollbar {
    width: 4px !important;
  }
  .rc-virtual-list-scrollbar-thumb {
    background: #e6e8ea !important;
  }
`;
