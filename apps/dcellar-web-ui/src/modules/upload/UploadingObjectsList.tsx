import { DCTable } from '@/components/common/DCTable';
import { UploadObject } from '@/store/slices/global';
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
        const { status, id } = record;
        if (['SEAL', 'SEALING'].includes(status)) {
          return (
            <Text color="readable.disable" fontSize={12}>
              --
            </Text>
          );
        }

        switch (status) {
          case 'FINISH':
            return <UploadActionButton type="clear" text="Clear Record" ids={[id]} />;

          case 'CANCEL':
          case 'ERROR':
            return (
              <Flex gap={6}>
                <UploadActionButton type="retry" ids={[id]} />
                <UploadActionButton type="clear" ids={[id]} />
              </Flex>
            );

          case 'WAIT':
          case 'HASH':
          case 'HASHED':
          case 'SIGN':
          case 'SIGNED':
          case 'UPLOAD':
            return <UploadActionButton type="cancel" text="Cancel" ids={[id]} />;

          default:
            return null;
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
