import { DCTable } from '@/components/common/DCTable';
import {
  UPLOADING_STATUSES,
  UPLOAD_FAILED_STATUSES,
  UPLOAD_SUCCESS_STATUS,
  UploadObject,
} from '@/store/slices/global';
import { ColumnProps } from 'antd/es/table';
import React, { useState } from 'react';
import { NameItem } from './NameItem';
import { PathItem } from './PathItem';
import { ObjectUploadStatus } from './ObjectUploadStatus';
import { useCreation } from 'ahooks';
import { chunk } from 'lodash-es';
import { Flex, Text } from '@node-real/uikit';
import { UploadActionButton } from './UploadActionButton';

const uploadingPageSize = 10;

export const UploadingObjectsList = ({ data }: { data: UploadObject[] }) => {
  const [pageSize] = useState(10);
  const [curPage, setCurPage] = useState(1);
  const chunks = useCreation(() => chunk(data, pageSize), [data, pageSize]);
  const page = chunks[curPage - 1] || [];

  const columns: ColumnProps<UploadObject>[] = [
    {
      key: 'name',
      title: 'Name',
      render: (_, record) => {
        return (
          <NameItem
            name={record.waitObject.name}
            size={record.waitObject.size}
            msg={record.msg}
            status={record.status}
            w={234}
            task={record}
          />
        );
      },
    },
    {
      key: 'path',
      title: 'Path',
      width: 170,
      render: (_, record) => {
        return (
          <PathItem
            status={record.status}
            path={
              [record.bucketName, ...record.prefixFolders].filter((item) => !!item).join('/') + '/'
            }
          />
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (_, record) => {
        return (
          <Flex gap={4} fontWeight={400} alignItems={'center'}>
            <ObjectUploadStatus task={record} />
          </Flex>
        );
      },
    },
    {
      key: 'action',
      title: 'Action',
      width: 146,
      render: (record) => {
        if (UPLOADING_STATUSES.includes(record.status)) {
          return (
            <Text color="readable.disable" fontSize={12}>
              --
            </Text>
          );
        }

        if (UPLOAD_SUCCESS_STATUS === record.status) {
          return <UploadActionButton type="clear" text="Clear Record" ids={[record.id]} />;
        } else if (UPLOAD_FAILED_STATUSES.includes(record.status)) {
          return (
            <Flex gap={6}>
              <UploadActionButton type="retry" ids={[record.id]} />
              <UploadActionButton type="clear" ids={[record.id]} />
            </Flex>
          );
        }
      },
    },
  ];

  const onPageChange = (page: number) => {
    setCurPage(page);
  };

  return (
    <DCTable
      rowKey={'id'}
      columns={columns}
      dataSource={page}
      current={curPage}
      total={data.length}
      pageSize={uploadingPageSize}
      showQuickJumper={true}
      pageChange={onPageChange}
    />
  );
};
