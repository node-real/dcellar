import { DCTable } from '@/components/common/DCTable';
import { useAppDispatch } from '@/store';
import { WaitObject, removeFromWaitQueue, toggleObjectReplaceState } from '@/store/slices/global';
import { ColumnProps } from 'antd/es/table';
import React, { useState } from 'react';
import { NameItem } from './NameItem';
import { PathItem } from './PathItem';
import { useCreation } from 'ahooks';
import { chunk } from 'lodash-es';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { Text } from '@node-real/uikit';
import { E_OBJECT_NAME_EXISTS } from '@/facade/error';
import { getObjectErrorMsg } from '@/utils/object';
import { DELEGATE_UPLOAD } from '@/store/slices/object';

const uploadingPageSize = 10;

export const UploadObjectsList = ({ path, data }: { path: string; data: WaitObject[] }) => {
  const dispatch = useAppDispatch();
  const [pageSize] = useState(10);
  const [curPage, setCurPage] = useState(1);
  const chunks = useCreation(() => chunk(data, pageSize), [data, pageSize]);
  const page = chunks[curPage - 1] || [];

  const onRemove = (id: number) => {
    dispatch(removeFromWaitQueue({ id }));
  };

  const updateObjectReplaceState = (id: number) => {
    dispatch(toggleObjectReplaceState({ id }));
  };

  const columns: ColumnProps<WaitObject>[] = [
    {
      key: 'name',
      title: 'Name',
      render: (_, record) => {
        return (
          <NameItem
            key={record.name}
            name={record.name}
            size={record.size}
            msg={
              record.isUpdate && DELEGATE_UPLOAD ? (
                <Text as={'span'} color={'readable.tertiary'}>
                  Replace the existing object
                </Text>
              ) : (
                record.msg
              )
            }
            w={222}
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
            mr={0}
            lineHeight="normal"
            path={`${path}/${record.relativePath ? record.relativePath + '/' : ''}`}
            textAlign="left"
          />
        );
      },
    },
    ...(DELEGATE_UPLOAD
      ? [
          {
            key: 'replace',
            title: <></>,
            width: 64,
            render: (_: WaitObject, record: WaitObject) => {
              const replaceable =
                !record.name.endsWith('/') &&
                record.msg === getObjectErrorMsg(E_OBJECT_NAME_EXISTS).title;

              if (!replaceable) return null;
              return (
                <DCButton
                  variant={'link'}
                  size={'sm'}
                  fontSize={'12'}
                  fontWeight={400}
                  onClick={() => updateObjectReplaceState(record.id)}
                >
                  {record.isUpdate ? 'Undo' : 'Replace'}
                </DCButton>
              );
            },
          },
        ]
      : []),
    {
      key: 'status',
      title: <></>,
      width: 50,
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
