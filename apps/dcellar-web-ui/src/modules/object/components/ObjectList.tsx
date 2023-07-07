import React, { memo, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ObjectItem,
  selectObjectList,
  selectPathCurrent,
  selectPathLoading,
  setCurrentObjectPage,
  setEditDelete,
  setEditDetail,
  setEditDownload,
  setEditShare,
  setRestoreCurrent,
  setStatusDetail,
  setupListObjects,
} from '@/store/slices/object';
import { chunk, reverse, sortBy } from 'lodash-es';
import { ColumnProps } from 'antd/es/table';
import {
  getSpOffChainData,
  setAccountConfig,
  SorterType,
  updateObjectPageSize,
  updateObjectSorter,
} from '@/store/slices/persist';
import { AlignType, DCTable, FailStatus, SortIcon, SortItem } from '@/components/common/DCTable';
import { Text } from '@totejs/uikit';
import { formatTime, getMillisecond } from '@/utils/time';
import { Loading } from '@/components/common/Loading';
import { ListEmpty } from '@/modules/object/components/ListEmpty';
import { useAsyncEffect } from 'ahooks';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { contentTypeToExtension, formatBytes } from '@/modules/file/utils';
import { NameItem } from '@/modules/object/components/NameItem';
import { ActionMenu, ActionMenuItem } from '@/components/common/DCTable/ActionMenu';
import { DeleteObject } from './DeleteObject';
import { StatusDetail } from './StatusDetail';
import { DetailDrawer } from './DetailDrawer';
import { VisibilityType } from '@/modules/file/type';
import { ShareObject } from './ShareObject';
import { ConfirmDownload } from './ConfirmDownload';
import { setupBucketQuota } from '@/store/slices/bucket';
import { quotaRemains } from '@/facade/bucket';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { E_GET_QUOTA_FAILED, E_NO_QUOTA, E_UNKNOWN } from '@/facade/error';
import { downloadObject } from '@/facade/object';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { UploadObjects } from '@/modules/upload/UploadObjects';

const Actions: ActionMenuItem[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Delete', value: 'delete' },
  { label: 'Share', value: 'share' },
  { label: 'Download', value: 'download' },
];

interface ObjectListProps {}

export const ObjectList = memo<ObjectListProps>(function ObjectList() {
  const dispatch = useAppDispatch();
  const {
    loginAccount,
    objectPageSize,
    objectSortBy: [sortName, dir],
    accounts,
  } = useAppSelector((root) => root.persist);

  const { bucketName, prefix, path } = useAppSelector((root) => root.object);
  const currentPage = useAppSelector(selectPathCurrent);
  const { bucketInfo, discontinue, quotas } = useAppSelector((root) => root.bucket);
  const { spInfo } = useAppSelector((root) => root.sp);
  const loading = useAppSelector(selectPathLoading);
  const objectList = useAppSelector(selectObjectList);
  const { editDelete, statusDetail, editDetail, editShare, editDownload, editUpload } = useAppSelector((root) => root.object);
  const { directDownload } = accounts[loginAccount];
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
    dispatch(setupBucketQuota(bucketName));
  }, [primarySpAddress, prefix]);

  const updateSorter = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    if (sortName === name && dir === newSort) return;
    dispatch(setRestoreCurrent(false));
    dispatch(updateObjectSorter([name, newSort] as SorterType));
  };

  const onError = (type: string) => {
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
    ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setStatusDetail(errorData));
  };

  const download = async (object: ObjectItem) => {
    // TODO remove it
    dispatch(setAccountConfig({ address: loginAccount, config: { directDownload: false } }));
    if (directDownload) {
      const [objectInfo, quotaData] = await getObjectInfoAndBucketQuota(
        bucketName,
        object.objectName,
        spInfo[primarySpAddress].endpoint,
      );
      if (quotaData === null) {
        return onError(E_GET_QUOTA_FAILED);
      }
      let remainQuota = quotaRemains(quotaData, object.payloadSize + '');
      if (!remainQuota) return onError(E_NO_QUOTA);
      const params = {
        primarySp: primarySpInfo,
        objectInfo,
        address: loginAccount,
      }

      const operator = primarySpInfo.operatorAddress;
      const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
      const [success, opsError] = await downloadObject(params, seedString);
      if (opsError) return onError(opsError);
      return success;
    }

    return dispatch(setEditDownload(object));
  }

  const onMenuClick = (menu: string, record: ObjectItem) => {
    switch (menu) {
      case 'detail':
        return dispatch(setEditDetail(record));
      case 'delete':
        return dispatch(setEditDelete(record));
      case 'share':
        return dispatch(setEditShare(record));
      case 'download':
        return download(record);
    }
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
      render: (_: string, record: ObjectItem) => {
        let fitActions = Actions;
        const isFolder = record.objectName.endsWith('/');
        if (isFolder) return null;
        const isPublic = record.visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ;
        if (!isPublic) {
          fitActions = Actions.filter((a) => a.value !== 'share');
        }

        return <ActionMenu menus={fitActions} onChange={(e) => onMenuClick(e, record)} />;
      },
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
      {!!editDelete?.objectName && <DeleteObject />}
      {!!statusDetail.title && <StatusDetail />}
      {!!editDetail?.objectName && <DetailDrawer />}
      {!!editShare?.objectName && <ShareObject />}
      {!!editDownload?.objectName && <ConfirmDownload />}
      {editUpload?.isOpen && <UploadObjects />}
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
        onRow={(record) => ({
          onClick: () => {
            const isFolder = record.objectName.endsWith('/');
            !isFolder && onMenuClick('detail', record)
          },
        })}
      />
    </>
  );
});
