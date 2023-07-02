import { memo } from 'react';
import { Table, ConfigProvider, TableProps, ThemeConfig } from 'antd';
import { ConfigProviderProps } from 'antd/es/config-provider';
import styled from '@emotion/styled';
import {
  SimplePagination,
  SimplePaginationProps,
} from '@/components/common/DCTable/SimplePagination';

export type AlignType = 'left' | 'right' | 'center';

const theme: ThemeConfig = {
  token: {
    colorBorderSecondary: '#e6e8ea',
    colorLink: '#00BA34',
    colorLinkActive: '#00BA34',
    colorLinkHover: '#00BA34',
    colorText: '#1E2026',
    colorTextHeading: '#76808F',
    fontFamily: 'Inter, sans-serif',
  },
};

interface DCTable extends TableProps<any> {
  renderEmpty?: ConfigProviderProps['renderEmpty'];
}

export const DCTable = memo<DCTable & SimplePaginationProps>(function DCTable({
  renderEmpty,
  pageSize,
  pageChange,
  canNext,
  canPrev,
  ...props
}) {
  return (
    <Container>
      <ConfigProvider renderEmpty={renderEmpty} theme={theme}>
        <Table {...props} />
      </ConfigProvider>
      <SimplePagination
        pageSize={pageSize}
        canNext={canNext}
        canPrev={canPrev}
        pageChange={pageChange}
      />
    </Container>
  );
});

const Container = styled.div`
  border-radius: 16px;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.04);
  background: #fff;
  padding: 0 16px;
  .ant-table-thead > tr > th {
    background: #fff;
    &:before {
      display: none;
    }
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    padding-top: 13px;
    padding-bottom: 13px;
  }
  .ant-table-tbody > tr.ant-table-row:hover > td {
    background: rgba(0, 186, 52, 0.1);
  }

  .ant-table-tbody > tr > td {
    font-weight: 500;
  }
`;
