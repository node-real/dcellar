import React, { memo } from 'react';
import { Table, ConfigProvider, TableProps, ThemeConfig, Progress } from 'antd';
import { ConfigProviderProps } from 'antd/es/config-provider';
import styled from '@emotion/styled';
import {
  SimplePagination,
  SimplePaginationProps,
} from '@/components/common/DCTable/SimplePagination';
import Descend from '@/components/common/SvgIcon/Descend.svg';
import Ascend from '@/components/common/SvgIcon/Ascend.svg';
import { Box, Flex, keyframes, Text } from '@totejs/uikit';
import { useAppSelector } from '@/store';
import { selectUploadQueue, UploadFile } from '@/store/slices/global';
import { find } from 'lodash-es';
import { formatBytes } from '@/modules/file/utils';

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

export const UploadProgress = (props: { progress: number }) => {
  let { progress = 0 } = props;
  // As progress will stay put for a while in 100%, user might get confused,
  // so we hold the progress to 99% at mostbg
  if (progress < 0) {
    progress = 0;
  }
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
    <Flex alignItems={'center'}>
      <Flex w={'84px'} h={'8px'} bg={'#E7F3FD'} borderRadius={'28px'} overflow={'hidden'}>
        {progress > 99 ? (
          <Flex
            w={`30%`}
            bg={'#1184EE'}
            borderRadius={'28px'}
            animation={`${loading} 1.5s linear infinite`}
          />
        ) : (
          <Flex w={`${progress}%`} bg={'#1184EE'} borderRadius={'28px'} />
        )}
      </Flex>
      {progress > 99 ? (
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
      ) : (
        <Text
          color={'readable.normal'}
          ml={'4px'}
          fontSize={'12px'}
          lineHeight={'15px'}
          fontWeight={400}
        >{`${progress}%`}</Text>
      )}
    </Flex>
  );
};

export const UploadStatus = ({ object, size }: { object: string; size: number }) => {
  const { loginAccount } = useAppSelector((root) => root.persist);
  const queue = useAppSelector(selectUploadQueue(loginAccount));

  const file = find<UploadFile>(
    queue,
    (q) => [q.bucketName, ...q.folders, q.file.name].join('/') === object,
  );

  const failed = (
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

  if (!file) return failed;

  if (file.status !== 'FINISH') return <UploadProgress progress={file.progress} />;

  if (file.msg) return failed;

  return <>{formatBytes(size)}</>;
};

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
  :active {
    background: rgba(0, 186, 52, 0.15);
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

  .ant-spin-nested-loading > div > .ant-spin {
    max-height: max-content;
  }
`;