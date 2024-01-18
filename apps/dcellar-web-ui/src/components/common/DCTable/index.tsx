import React, { memo } from 'react';
import { Table, ConfigProvider, TableProps } from 'antd';
import { ConfigProviderProps } from 'antd/es/config-provider';
import styled from '@emotion/styled';
import {
  SimplePagination,
  SimplePaginationProps,
} from '@/components/common/DCTable/SimplePagination';
import { Badge, Box, Flex, keyframes, Pagination, PaginationProps, Text } from '@totejs/uikit';
import { useAppSelector } from '@/store';
import { selectUploadQueue, UploadFile } from '@/store/slices/global';
import { find } from 'lodash-es';
import { antdTheme } from '@/base/theme/antd';
import { IconFont } from '@/components/IconFont';
import { formatBytes } from '@/utils/formatter';

export type AlignType = 'left' | 'right' | 'center';

interface DCTableProps extends TableProps<any> {
  renderEmpty?: ConfigProviderProps['renderEmpty'];
}

type SimpleDCTableProps = DCTableProps & Omit<SimplePaginationProps, 'loading'>;
type MultiDCTableProps = DCTableProps &
  PaginationProps & {
    pageChange: (page: number) => void;
  };

function isSimple(arg: SimpleDCTableProps | MultiDCTableProps): arg is SimpleDCTableProps {
  return (arg as SimpleDCTableProps).canNext !== undefined;
}

export const DCTable = memo<SimpleDCTableProps | MultiDCTableProps>(function DCTable(props) {
  if (isSimple(props)) {
    const {
      renderEmpty,
      pageSize,
      pageChange,
      canNext,
      canPrev,
      pagination = true,
      dataSource,
      total = '',
      ...restProps
    } = props;
    return (
      <Container
        className="dc-table"
        rowCursor={typeof props.onRow === 'function' ? 'pointer' : 'default'}
      >
        <ConfigProvider renderEmpty={renderEmpty} theme={antdTheme}>
          <Table dataSource={dataSource} {...restProps} pagination={false} tableLayout="fixed" />
        </ConfigProvider>
        {pagination && (
          <SimplePagination
            loading={!dataSource?.length}
            pageSize={pageSize}
            canNext={canNext}
            canPrev={canPrev}
            pageChange={pageChange}
            total={total}
          />
        )}
      </Container>
    );
  } else {
    const {
      renderEmpty,
      pagination = true,
      current,
      defaultCurrent,
      total,
      pageSize,
      showQuickJumper,
      pageChange,
      dataSource,
      ...restProps
    } = props;

    return (
      <Container
        className="dc-table"
        rowCursor={typeof props.onRow === 'function' ? 'pointer' : 'default'}
      >
        <ConfigProvider renderEmpty={renderEmpty} theme={antdTheme}>
          <Table dataSource={dataSource} {...restProps} pagination={false} tableLayout="fixed" />
        </ConfigProvider>
        {pagination && (
          <Flex justifyContent={'space-between'} alignItems="center" paddingY={12} marginX={16}>
            <Text fontWeight={500} color={'readable.tertiary'}>
              Total: {total}
            </Text>
            <Pagination
              current={current}
              defaultCurrent={defaultCurrent}
              total={total}
              pageSize={pageSize}
              showQuickJumper={showQuickJumper}
              onChange={pageChange}
            />
          </Flex>
        )}
      </Container>
    );
  }
});

export const SealLoading = () => {
  const loading = keyframes`
      0%,
      100% {
          transform: translateX(-10px);
      }

      50% {
          transform: translateX(70px);
      }
  `;
  return (
    <Flex alignItems="center">
      <Flex w={'84px'} h={'8px'} bg={'#E7F3FD'} borderRadius={'28px'} overflow={'hidden'}>
        <Flex
          w={`30%`}
          bg={'#1184EE'}
          borderRadius={'28px'}
          animation={`${loading} 1.5s linear infinite`}
        />
      </Flex>
      <Box
        color={'readable.normal'}
        ml={'4px'}
        fontSize={'12px'}
        lineHeight={'15px'}
        fontWeight={400}
        borderRadius={4}
        padding={4}
      >
        Sealing...
      </Box>
    </Flex>
  );
};

export const UploadProgress = (props: { progress: number }) => {
  let { progress = 0 } = props;
  if (progress < 0) {
    progress = 0;
  }

  return (
    <Flex alignItems={'center'}>
      <Flex w={'84px'} h={'8px'} bg={'#E7F3FD'} borderRadius={'28px'} overflow={'hidden'}>
        <Flex w={`${progress}%`} bg={'#1184EE'} borderRadius={'28px'} />
      </Flex>
      <Text
        color={'readable.normal'}
        ml={'4px'}
        fontSize={'12px'}
        lineHeight={'15px'}
        fontWeight={400}
      >{`${progress}%`}</Text>
    </Flex>
  );
};

export const UploadStatus = ({ object, size }: { object: string; size: number }) => {
  const { loginAccount } = useAppSelector((root) => root.persist);
  const queue = useAppSelector(selectUploadQueue(loginAccount));

  const file = find<UploadFile>(queue, (q) => {
    const objectInList = [
      q.bucketName,
      ...q.prefixFolders,
      q.waitFile.relativePath || '',
      q.waitFile.name,
    ]
      .filter((item) => !!item)
      .join('/');
    return objectInList === object;
  });

  if (!file) return <Badge colorScheme="warning">Created on Chain</Badge>;

  if (file.status === 'UPLOAD') return <UploadProgress progress={file.progress} />;

  if (file.status === 'SEAL') return <SealLoading />;

  if (file.msg) return <Badge colorScheme="danger">Upload Failed</Badge>;

  return <>{formatBytes(size)}</>;
};

export const SortIcon = {
  descend: <IconFont type="sort-descend" w={18} />,
  ascend: <IconFont type="sort-ascend" w={18} />,
};

export const SortItem = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  transition: all 0.2s;
  margin-left: -8px;
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

  :active {
    background: rgba(0, 186, 52, 0.15);
  }
`;

const Container = styled.div<{ rowCursor: string }>`
  border-radius: 4px;
  border: 1px solid var(--ui-colors-readable-border);
  background: #fff;
  position: relative;

  .ant-table-wrapper .ant-table {
    line-height: normal;
  }

  .ant-table-thead > tr > th {
    color: var(--ui-colors-readable-normal);
    background: var(--ui-colors-bg-bottom);

    &:before {
      display: none;
    }

    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    padding-top: 13px;
    padding-bottom: 12px;
  }

  .ant-table-tbody > tr.ant-table-row-selected > td,
  .ant-table-tbody > tr.ant-table-row:hover > td {
    background: rgba(0, 186, 52, 0.1);
  }

  .ant-table-tbody > tr > td {
    font-weight: 500;
    background: #fff;
    padding: 12px 16px 11px 16px;
  }

  .ant-spin-nested-loading > div > .ant-spin {
    max-height: max-content;
  }

  .ant-table-ping-left:not(.ant-table-has-fix-left) .ant-table-container::before {
    display: none;
  }

  .ant-table-ping-right:not(.ant-table-has-fix-right) .ant-table-container::after {
    display: none;
  }

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

  .ant-table-cell {
    .btn-action {
      visibility: hidden;
    }

    &-row-hover {
      .btn-action {
        visibility: visible;
      }

      cursor: ${(props) => props.rowCursor};
    }
  }

  .ant-checkbox-disabled .ant-checkbox-inner {
    background: #fafafa;
    border-color: var(--ui-colors-readable-border);
  }
`;
