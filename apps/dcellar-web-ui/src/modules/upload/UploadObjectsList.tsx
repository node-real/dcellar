import { DCTable } from '@/components/common/DCTable';
import { useAppDispatch } from '@/store';
import { UploadObject, WaitObject, removeFromWaitQueue } from '@/store/slices/global';
import { ColumnProps } from 'antd/es/table';
import React, { useState } from 'react';
import { NameItem } from './NameItem';
import { PathItem } from './PathItem';
import { useCreation } from 'ahooks';
import { chunk } from 'lodash-es';
import { IconFont } from '@/components/IconFont';

const uploadingPageSize = 10;

export const UploadObjectsList = ({ path, data }: { path: string; data: WaitObject[] }) => {
  const dispatch = useAppDispatch();
  const [pageSize, setPageSize] = useState(10);
  const [curPage, setCurPage] = useState(1);
  const chunks = useCreation(() => chunk(data, pageSize), [data, pageSize]);
  const page = chunks[curPage - 1] || [];
  const onRemove = (id: number) => {
    dispatch(removeFromWaitQueue({ id }));
  };
  const columns: ColumnProps<UploadObject>[] = [
    {
      key: 'name',
      title: 'Name',
      render: (record) => {
        return (
          <NameItem
            key={record.name}
            name={record.name}
            size={record.size}
            msg={record.msg}
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
        return (
          <PathItem
            lineHeight="normal"
            path={`${path}/${record.relativePath ? record.relativePath + '/' : ''}`}
            textAlign="left"
          />
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      width: 70,
      render: (record) => {
        return (
          <IconFont
            onClick={() => onRemove(record.id)}
            w={16}
            type="close"
            cursor="pointer"
            color={'readable.secondary'}
            _hover={{
              color: 'readable.normal',
            }}
          />
        );
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
