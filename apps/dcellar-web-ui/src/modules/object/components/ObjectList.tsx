import React, { memo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ObjectItem,
  selectObjectList,
  selectPathCurrent,
  selectPathLoading,
  setCurrentObjectPage,
  setEditCancel,
  setEditDelete,
  setEditDetail,
  setEditDownload,
  setEditShare,
  setRestoreCurrent,
  setStatusDetail,
  setupDummyFolder,
  setupListObjects,
  _getAllList,
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
import { AlignType, DCTable, UploadStatus, SortIcon, SortItem } from '@/components/common/DCTable';
import { formatTime, getMillisecond } from '@/utils/time';
import { Loading } from '@/components/common/Loading';
import { ListEmpty } from '@/modules/object/components/ListEmpty';
import { useAsyncEffect, useCreation } from 'ahooks';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { contentTypeToExtension, formatBytes } from '@/modules/file/utils';
import { NameItem } from '@/modules/object/components/NameItem';
import { ActionMenu, ActionMenuItem } from '@/components/common/DCTable/ActionMenu';
import { DeleteObject } from './DeleteObject';
import { StatusDetail } from './StatusDetail';
import { DetailObject } from './DetailObject';
import { VisibilityType } from '@/modules/file/type';
import { ShareObject } from './ShareObject';
import { DownloadObject } from './DownloadObject';
import { setupBucketQuota } from '@/store/slices/bucket';
import { quotaRemains } from '@/facade/bucket';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
import { FolderNotEmpty } from '@/modules/object/components/FolderNotEmpty';

import {
  E_GET_QUOTA_FAILED,
  E_NO_QUOTA,
  E_OBJECT_NAME_EXISTS,
  E_OFF_CHAIN_AUTH,
  E_UNKNOWN,
} from '@/facade/error';
import { downloadObject } from '@/facade/object';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { UploadObjects } from '@/modules/upload/UploadObjects';
import { OBJECT_SEALED_STATUS } from '@/modules/file/constant';
import { CancelObject } from './CancelObject';
import { CreateFolder } from './CreateFolder';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { StyledRow } from '@/modules/object/objects.style';

const Actions: ActionMenuItem[] = [
  { label: 'View Details', value: 'detail' },
  { label: 'Share', value: 'share' },
  { label: 'Download', value: 'download' },
  { label: 'Cancel', value: 'cancel' },
  { label: 'Delete', value: 'delete' },
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

  const [rowIndex, setRowIndex] = useState(-1);
  const [deleteFolderNotEmpty, setDeleteFolderNotEmpty] = useState(false);
  const { bucketName, prefix, path, objectsInfo } = useAppSelector((root) => root.object);
  const currentPage = useAppSelector(selectPathCurrent);
  const { bucketInfo, discontinue, owner } = useAppSelector((root) => root.bucket);
  const { spInfo } = useAppSelector((root) => root.sp);
  const loading = useAppSelector(selectPathLoading);
  const objectList = useAppSelector(selectObjectList);
  const { setOpenAuthModal } = useOffChainAuth();
  const { editDelete, statusDetail, editDetail, editShare, editDownload, editCancel, editCreate } =
    useAppSelector((root) => root.object);

  const ascend = sortBy(objectList, sortName);
  const sortedList = dir === 'ascend' ? ascend : reverse(ascend);
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
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setStatusDetail(errorData));
  };

  const download = async (object: ObjectItem) => {
    const config = accounts[loginAccount] || {};

    if (config.directDownload) {
      const [objectInfo, quotaData] = await getObjectInfoAndBucketQuota(
        bucketName,
        object.objectName,
        spInfo[primarySpAddress].endpoint,
      );
      if (objectInfo === null) {
        return onError(E_UNKNOWN);
      }
      if (quotaData === null) {
        return onError(E_GET_QUOTA_FAILED);
      }
      if (objectInfo === null) {
        return onError(E_OBJECT_NAME_EXISTS);
      }
      let remainQuota = quotaRemains(quotaData, object.payloadSize + '');
      if (!remainQuota) return onError(E_NO_QUOTA);
      const params = {
        primarySp: primarySpInfo,
        objectInfo,
        address: loginAccount,
      };

      const operator = primarySpInfo.operatorAddress;
      const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
      const [success, opsError] = await downloadObject(params, seedString);
      if (opsError) return onError(opsError);
      dispatch(setupBucketQuota(bucketName));
      return success;
    }

    return dispatch(setEditDownload({ ...object, action: 'download' }));
  };

  const onMenuClick = async (menu: string, record: ObjectItem) => {
    switch (menu) {
      case 'detail':
        return dispatch(setEditDetail(record));
      case 'delete':
        let isFolder = record.objectName.endsWith('/');
        setDeleteFolderNotEmpty(false);
        if (isFolder) {
          let res = await isFolderEmpty(record);
          if (!res) {
            setDeleteFolderNotEmpty(true);
          }
          return dispatch(setEditDelete(record));
        } else {
          return dispatch(setEditDelete(record));
        }
      case 'share':
        return dispatch(setEditShare(record));
      case 'download':
        return download(record);
      case 'cancel':
        return dispatch(setEditCancel(record));
    }
  };
  const isFolderEmpty = async (record: ObjectItem) => {
    const _query = new URLSearchParams();
    _query.append('delimiter', '/');
    _query.append('maxKeys', '1000');
    _query.append('prefix', `${record.objectName}`);

    const params = {
      address: primarySpAddress,
      bucketName: bucketName,
      prefix: record.objectName,
      query: _query,
      endpoint: primarySpInfo.endpoint,
      seedString: '',
      maxKeys: 1000,
    };
    const [res] = await _getAllList(params);
    return res?.objects?.length === 1;
  };
  const columns: ColumnProps<ObjectItem>[] = [
    {
      key: 'objectName',
      title: (
        <SortItem onClick={() => updateSorter('objectName', 'ascend')}>
          Name{sortName === 'objectName' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectItem) => (
        <StyledRow $disabled={record.objectStatus !== 1}>
          <NameItem item={record} />
        </StyledRow>
      ),
    },
    {
      key: 'contentType',
      width: 150,
      title: (
        <SortItem onClick={() => updateSorter('contentType', 'ascend')}>
          Type{sortName === 'contentType' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectItem) => (
        <StyledRow $disabled={record.objectStatus !== 1}>
          {contentTypeToExtension(record.contentType, record.objectName)}
        </StyledRow>
      ),
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
          <StyledRow $disabled={record.objectStatus !== 1}>
            {record.objectStatus === 1 ? (
              formatBytes(record.payloadSize)
            ) : (
              <UploadStatus object={[path, record.name].join('/')} size={record.payloadSize} />
            )}
          </StyledRow>
        ),
    },
    {
      key: 'createAt',
      width: 160,
      title: (
        <SortItem onClick={() => updateSorter('createAt', 'descend')}>
          Date Created
          {sortName === 'createAt' ? SortIcon[dir] : <span>{SortIcon['descend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectItem) => (
        <StyledRow $disabled={record.objectStatus !== 1}>
          {formatTime(getMillisecond(record.createAt))}
        </StyledRow>
      ),
    },
    {
      key: 'Action',
      width: 100,
      align: 'center' as AlignType,
      title: 'Action',
      render: (_: string, record: ObjectItem, index: number) => {
        let fitActions = Actions;
        let operations: string[] = [];
        const isCurRow = rowIndex === index;
        const isFolder = record.objectName.endsWith('/');
        const isPublic = record.visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ;
        const isSealed = record.objectStatus === OBJECT_SEALED_STATUS;

        if (!isPublic) {
          fitActions = Actions.filter((a) => a.value !== 'share');
        }
        if (isSealed) {
          fitActions = fitActions.filter((a) => a.value !== 'cancel');
        } else {
          fitActions = fitActions.filter((a) => ['cancel', 'detail'].includes(a.value));
        }
        const key = path + '/' + record.name;
        const curObjectInfo = objectsInfo[key];
        // if this object is not yours, you only can download it
        if (curObjectInfo?.object_info?.owner !== loginAccount) {
          fitActions = fitActions.filter((a) => a.value === 'download');
        }
        //if this folder is yours, you only can delete it
        if (isFolder && owner) {
          fitActions = Actions.filter((a) => a.value === 'delete');
        }
        if (isFolder && !owner) {
          fitActions = [];
        }
        isCurRow && !isFolder && isPublic && operations.push('share');
        isCurRow && !isFolder && isSealed && operations.push('download');

        return (
          <ActionMenu
            menus={fitActions}
            operations={operations}
            justifyContent="flex-end"
            onChange={(e) => onMenuClick(e, record)}
          />
        );
      },
    },
  ].map((col) => ({ ...col, dataIndex: col.key }));
  const chunks = useCreation(() => chunk(sortedList, objectPageSize), [sortedList, objectPageSize]);
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

  const refetch = async (name?: string) => {
    if (!primarySpAddress) return;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, primarySpAddress));
    const query = new URLSearchParams();
    const params = {
      seedString,
      query,
      endpoint: spInfo[primarySpAddress].endpoint,
    };
    if (name) {
      await dispatch(setupListObjects(params));
      // if folder not exist in list, then add dummy folder
      dispatch(setupDummyFolder(name));
    } else {
      dispatch(setupListObjects(params));
    }
  };

  const empty = !loading && !sortedList.length;

  return (
    <>
      {editCreate && <CreateFolder refetch={refetch} />}
      {editDelete?.objectName && !deleteFolderNotEmpty &&<DeleteObject refetch={refetch} />}
      {deleteFolderNotEmpty && <FolderNotEmpty />}
      {statusDetail.title && <StatusDetail />}
      {editDetail?.objectName && <DetailObject />}
      {editShare?.objectName && <ShareObject />}
      {editDownload?.objectName && <DownloadObject />}
      {editCancel.objectName && <CancelObject refetch={refetch} />}
      <UploadObjects />
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
        onRow={(record, index) => ({
          onClick: () => {
            const isFolder = record.objectName.endsWith('/');
            !isFolder && onMenuClick('detail', record);
          },
          onMouseEnter: () => {
            setRowIndex(Number(index));
          },
          onMouseLeave: () => {
            setRowIndex(-1);
          },
        })}
        scroll={{ x: 800 }}
      />
    </>
  );
});
