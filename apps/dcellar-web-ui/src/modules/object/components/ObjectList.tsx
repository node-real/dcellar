import React, { memo, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ObjectItem,
  selectObjectList,
  selectPathCurrent,
  selectPathLoading,
  setCurrentObjectPage,
  setFolders,
  setRestoreCurrent,
  setupListObjects,
} from '@/store/slices/object';
import { chunk, reverse, sortBy } from 'lodash-es';
import { ColumnProps } from 'antd/es/table';
import {
  getSpOffChainData,
  SorterType,
  updateObjectPageSize,
  updateObjectSorter,
} from '@/store/slices/persist';
import { AlignType, DCTable, FailStatus, SortIcon, SortItem } from '@/components/common/DCTable';
import { Text } from '@totejs/uikit';
import { formatTime, getMillisecond } from '@/utils/time';
import { MoreIcon } from '@totejs/icons';
import { Loading } from '@/components/common/Loading';
import { ListEmpty } from '@/modules/object/components/ListEmpty';
import { useAsyncEffect } from 'ahooks';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { contentTypeToExtension, formatBytes } from '@/modules/file/utils';
import { NameItem } from '@/modules/object/components/NameItem';

interface ObjectListProps {}

export const ObjectList = memo<ObjectListProps>(function ObjectList() {
  const dispatch = useAppDispatch();
  const {
    loginAccount,
    objectPageSize,
    objectSortBy: [sortName, dir],
  } = useAppSelector((root) => root.persist);
  const { bucketName, prefix, path } = useAppSelector((root) => root.object);
  const currentPage = useAppSelector(selectPathCurrent);
  const { bucketInfo, discontinue } = useAppSelector((root) => root.bucket);
  const { spInfo } = useAppSelector((root) => root.sp);
  const loading = useAppSelector(selectPathLoading);
  const objectList = useAppSelector(selectObjectList);

  const ascend = (() => {
    const _name = sortName as keyof ObjectItem;
    const sorted = sortBy(objectList, _name);
    switch (_name) {
      case 'createAt':
        return sortBy(sorted, [(o) => (o.folder ? 0 : 1)]);
      default:
        return sorted;
    }
  })();
  const descend = (() => {
    const _name = sortName as keyof ObjectItem;
    const sorted = reverse(sortBy(objectList, _name));
    switch (_name) {
      case 'createAt':
        return sortBy(sorted, [(o) => (o.folder ? 0 : 1)]);
      default:
        return sorted;
    }
  })();
  const sortedList = dir === 'ascend' ? ascend : descend;
  const primarySpAddress = bucketInfo[bucketName]?.primary_sp_address;
  const primarySpInfo = spInfo[primarySpAddress];

  useAsyncEffect(async () => {
    if (!primarySpAddress) return;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, primarySpAddress));
    const query = new URLSearchParams();
    const params = {
      seedString,
      query,
      endpoint: primarySpInfo.endpoint,
    };
    dispatch(setupListObjects(params));
  }, [primarySpAddress, prefix]);

  useEffect(() => {
    return () => {
      // ensure current bucketName folder in right state.
      dispatch(setFolders({ bucketName: '', folders: [] }));
    };
  }, [prefix, dispatch]);

  const updateSorter = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    if (sortName === name && dir === newSort) return;
    dispatch(setRestoreCurrent(false));
    dispatch(updateObjectSorter([name, newSort] as SorterType));
  };

  const columns: ColumnProps<ObjectItem>[] = [
    {
      key: 'objectName',
      title: (
        <SortItem onClick={() => updateSorter('objectName', 'ascend')}>
          Name{sortName === 'objectName' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectItem) => <NameItem item={record} />,
    },
    {
      key: 'contentType',
      width: 150,
      title: 'Type',
      render: (_: string, record: ObjectItem) =>
        contentTypeToExtension(record.contentType, record.objectName),
    },
    {
      key: 'payloadSize',
      width: 200,
      title: (
        <SortItem onClick={() => updateSorter('payloadSize', 'ascend')}>
          Size{sortName === 'payloadSize' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectItem) =>
        record.folder ? (
          '--'
        ) : (
          <>
            {formatBytes(record.payloadSize)} {record.objectStatus === 0 && FailStatus}
          </>
        ),
    },
    {
      key: 'createAt',
      width: 250,
      title: (
        <SortItem onClick={() => updateSorter('createAt', 'descend')}>
          Date Created
          {sortName === 'createAt' ? SortIcon[dir] : <span>{SortIcon['descend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectItem) => (
        <Text color={'readable.normal'} _hover={{ color: 'readable.normal' }}>
          {formatTime(getMillisecond(record.createAt))}
        </Text>
      ),
    },
    {
      key: 'Action',
      width: 200,
      align: 'center' as AlignType,
      title: 'Action',
      render: () => <MoreIcon />,
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));
  const chunks = useMemo(() => chunk(sortedList, objectPageSize), [sortedList, objectPageSize]);
  const pages = chunks.length;
  const current = currentPage >= pages ? 0 : currentPage;
  const page = chunks[current];
  const canNext = current < pages - 1;
  const canPrev = current > 0;

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setCurrentObjectPage({ path, current: currentPage + (next ? 1 : -1) }));
    }
    dispatch(setCurrentObjectPage({ path, current: 0 }));
    dispatch(updateObjectPageSize(pageSize));
  };

  const empty = !loading && !sortedList.length;

  return (
    <>
      {discontinue && (
        <DiscontinueBanner
          content="All the items in this bucket were marked as discontinued and will be deleted by SP soon. Please backup your data in time. "
          height={44}
          marginBottom={16}
        />
      )}
      <DCTable
        loading={{ spinning: loading, indicator: <Loading /> }}
        rowKey="objectName"
        columns={columns}
        dataSource={page}
        renderEmpty={() => <ListEmpty empty={empty} />}
        pageSize={objectPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
      />
    </>
  );
});
