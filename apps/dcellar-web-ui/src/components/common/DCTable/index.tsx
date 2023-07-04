import React, { memo } from 'react';
import { Table, ConfigProvider, TableProps, ThemeConfig } from 'antd';
import { ConfigProviderProps } from 'antd/es/config-provider';
import styled from '@emotion/styled';
import {
  SimplePagination,
  SimplePaginationProps,
} from '@/components/common/DCTable/SimplePagination';
import Descend from '@/components/common/SvgIcon/Descend.svg';
import Ascend from '@/components/common/SvgIcon/Ascend.svg';
import { Flex, Text } from '@totejs/uikit';

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
        <Table {...props} pagination={false} tableLayout="fixed" />
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

export const FailStatus = (
  <Flex
    display="inline-flex"
    bg={'rgba(238, 57, 17, 0.1)'}
    h={'20px'}
    borderRadius={'12px'}
    paddingX={'8px'}
    alignItems={'center'}
    justifyContent={'center'}
  >
    <Text lineHeight={'24px'} fontSize={'12px'} color="#EE3911" fontWeight={500}>
      Upload Failed
    </Text>
  </Flex>
);

export const SortIcon = {
  descend: <Descend />,
  ascend: <Ascend />,
};

export const SortItem = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 7px 16px;
  transition: all 0.2s;
  margin-left: -16px;
  margin-top: -7px;
  margin-bottom: -7px;
  user-select: none;
  > span {
    display: none;
  }
  :hover {
    color: #1e2026;
    > span {
      display: inline;
    }
    border-radius: 360px;
    background: rgba(0, 186, 52, 0.1);
  }
`;

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
