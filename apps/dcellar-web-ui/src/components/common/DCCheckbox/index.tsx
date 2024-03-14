import { antdTheme } from '@/base/theme/antd';
import styled from '@emotion/styled';
import { Checkbox, CheckboxProps, ConfigProvider } from 'antd';
import { memo } from 'react';

interface DCCheckboxProps extends CheckboxProps {}

export const DCCheckbox = memo<DCCheckboxProps>(function DCCheckbox(props) {
  return (
    <Container>
      <ConfigProvider theme={antdTheme}>
        <Checkbox {...props} />
      </ConfigProvider>
    </Container>
  );
});

const Container = styled.div`
  display: contents;
  .ant-checkbox-checked:after {
    display: none;
  }
  .ant-checkbox-checked:not(.ant-checkbox-disabled):hover .ant-checkbox-inner {
    background-color: #2ec659;
    border-color: transparent;
  }
  .ant-checkbox-indeterminate .ant-checkbox-inner {
    background-color: #00ba34;
    border-color: #00ba34;
    &:after {
      background-color: #fff;
      height: 2px;
    }
  }
  .ant-checkbox-indeterminate:hover .ant-checkbox-inner {
    background-color: #2ec659;
    border-color: #2ec659;
  }
  .ant-checkbox-disabled .ant-checkbox-inner {
    background: #fafafa;
    border-color: var(--ui-colors-readable-border);
  }
`;
