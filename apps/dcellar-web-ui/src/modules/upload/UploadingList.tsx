import { DCTable } from '@/components/common/DCTable';
import { useAppSelector } from '@/store';
import { UploadObject } from '@/store/slices/global';
import { ColumnProps } from 'antd/es/table';
import React, { use, useState } from 'react';
import { NameItem } from './NameItem';
import { PathItem } from './PathItem';
import { ObjectUploadStatus } from './ObjectUploadStatus';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { useCreation } from 'ahooks';
import { chunk } from 'lodash-es';

const uploadingPageSize = 10;

export const UploadingList = ({ data }: { data: UploadObject[] }) => {
  const [pageSize, setPageSize] = useState(10);
  const [curPage, setCurPage] = useState(1);
  const chunks = useCreation(() => chunk(data, pageSize), [data, pageSize]);
  const page = chunks[curPage - 1] || [];

  const columns: ColumnProps<UploadObject>[] = [
    {
      key: 'name',
      title: 'Name22222222222',
      render: (record) => {
        return (
          <NameItem
            name={record.name || record.waitObject.name}
            size={record.size || record.waitObject.size}
            msg={record.msg}
            status={record.status}
            w={240}
            task={record}
          />
        );
      },
    },
    {
      key: 'path',
      title: 'Path',
      width: 170,
      render: (record) => {
        return '';
        // <PathItem
        //   status={record.status}
        //   path={
        //     [record.bucketName, ...record.prefixFolders].filter((item) => !!item).join('/') + '/'
        //   }
        // />
      },
    },
    {
      key: 'status',
      title: 'Status',
      width: 70,
      render: (record) => {
        return <ObjectUploadStatus task={record} />;
      },
    },
  ];

  const onPageChange = (page: number) => {
    setCurPage(page);
  };

  return (
    <DCTable
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
