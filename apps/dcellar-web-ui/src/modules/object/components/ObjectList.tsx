import React, { memo } from 'react';
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
  setSelectedRowKeys,
  setStatusDetail,
  setupDummyFolder,
  setupListObjects,
} from '@/store/slices/object';
import { find, uniq, without, xor } from 'lodash-es';
import { ColumnProps } from 'antd/es/table';
import {
  getSpOffChainData,
  SorterType,
  updateObjectPageSize,
  updateObjectSorter,
} from '@/store/slices/persist';
import { AlignType, DCTable, SortIcon, SortItem, UploadStatus } from '@/components/common/DCTable';
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
import { DetailObject } from './DetailObject';
import { DownloadObject } from './DownloadObject';
import { setupBucketQuota } from '@/store/slices/bucket';
import { quotaRemains } from '@/facade/bucket';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
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
import { selectUploadQueue, UploadFile } from '@/store/slices/global';
import { copy, getShareLink } from '@/utils/string';
import { toast } from '@totejs/uikit';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { ShareDrawer } from '@/modules/object/components/ShareDrawer';

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
  const { loginAccount, objectPageSize, objectSortBy, accounts } = useAppSelector(
    (root) => root.persist,
  );
  // const [deleteFolderNotEmpty, setDeleteFolderNotEmpty] = useState(false);
  const { bucketName, prefix, path, objectsInfo, selectedRowKeys } = useAppSelector(
    (root) => root.object,
  );
  const currentPage = useAppSelector(selectPathCurrent);
  const { discontinue, owner } = useAppSelector((root) => root.bucket);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const loading = useAppSelector(selectPathLoading);
  const objectList = useAppSelector(selectObjectList);
  const { setOpenAuthModal } = useOffChainAuth();
  const uploadQueue = useAppSelector(selectUploadQueue(loginAccount));
  const { editDelete, statusDetail, editDetail, editShare, editDownload, editCancel, editCreate } =
    useAppSelector((root) => root.object);

  const { dir, sortName, sortedList, page, canPrev, canNext } = useTableNav<ObjectItem>({
    list: objectList,
    sorter: objectSortBy,
    pageSize: objectPageSize,
    currentPage,
  });

  const primarySp = primarySpInfo[bucketName];

  useAsyncEffect(async () => {
    if (!primarySp) return;
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const query = new URLSearchParams();
    const params = {
      seedString,
      query,
      endpoint: primarySp.endpoint,
    };
    dispatch(setSelectedRowKeys([]));
    dispatch(setupListObjects(params));
    dispatch(setupBucketQuota(bucketName));
  }, [primarySp, prefix]);

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
      const { seedString } = await dispatch(
        getSpOffChainData(loginAccount, primarySp.operatorAddress),
      );
      const gParams = {
        bucketName,
        objectName: object.objectName,
        endpoint: primarySp.endpoint,
        seedString,
        address: loginAccount,
      };
      const [objectInfo, quotaData] = await getObjectInfoAndBucketQuota(gParams);
      if (!quotaData) {
        return onError(E_GET_QUOTA_FAILED);
      }
      if (!objectInfo) {
        return onError(E_OBJECT_NAME_EXISTS);
      }
      let remainQuota = quotaRemains(quotaData, object.payloadSize + '');
      if (!remainQuota) return onError(E_NO_QUOTA);
      const params = {
        primarySp,
        objectInfo,
        address: loginAccount,
      };

      // const operator = primarySpInfo.operatorAddress;
      // const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
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
        return dispatch(setEditDelete(record));
      case 'share':
        // copy(getShareLink(bucketName, record.objectName));
        // toast.success({ description: 'Successfully copied to your clipboard.' });
        return dispatch(setEditShare({ record, from: 'menu' }));
      case 'download':
        return download(record);
      case 'cancel':
        return dispatch(setEditCancel(record));
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
      title: <></>,
      render: (_: string, record: ObjectItem) => {
        let fitActions = Actions;
        let operations: string[] = [];
        const isFolder = record.objectName.endsWith('/');
        const isSealed = record.objectStatus === OBJECT_SEALED_STATUS;

        if (isSealed) {
          fitActions = fitActions.filter((a) => a.value !== 'cancel');
        } else {
          fitActions = fitActions.filter((a) => ['cancel', 'detail'].includes(a.value));
          //  It is not allowed to cancel when the chain is sealed, but the SP is not synchronized.
          const file = find<UploadFile>(
            uploadQueue,
            (q) => [...q.prefixFolders, q.file.name].join('/') === record.objectName,
          );
          if (file) {
            fitActions = fitActions.filter((a) => a.value !== 'cancel');
          }
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
        !isFolder && isSealed && operations.push('share');
        !isFolder && isSealed && operations.push('download');

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

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setCurrentObjectPage({ path, current: currentPage + (next ? 1 : -1) }));
    }
    dispatch(setCurrentObjectPage({ path, current: 0 }));
    dispatch(updateObjectPageSize(pageSize));
  };

  const onSelectChange = (item: ObjectItem) => {
    dispatch(setSelectedRowKeys(xor(selectedRowKeys, [item.objectName])));
  };

  const onSelectAllChange = (
    selected: boolean,
    selectedRows: ObjectItem[],
    changeRows: ObjectItem[],
  ) => {
    const _changeRows = changeRows.filter(Boolean).map((i) => i.objectName);
    if (selected) {
      dispatch(setSelectedRowKeys(uniq(selectedRowKeys.concat(_changeRows))));
    } else {
      dispatch(setSelectedRowKeys(without(selectedRowKeys, ..._changeRows)));
    }
  };

  const rowSelection = {
    checkStrictly: true,
    selectedRowKeys,
    onSelect: onSelectChange,
    onSelectAll: onSelectAllChange,
    getCheckboxProps: (record: ObjectItem) => ({
      disabled: record.folder || record.objectStatus !== 1, // Column configuration not to be checked
      name: record.name,
    }),
  };

  const refetch = async (name?: string) => {
    if (!primarySp) return;
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const query = new URLSearchParams();
    const params = {
      seedString,
      query,
      endpoint: primarySp.endpoint,
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
      {editDelete?.objectName && <DeleteObject refetch={refetch} />}
      {statusDetail.title && <StatusDetail />}
      {editDetail?.objectName && <DetailObject />}
      <ShareDrawer />
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
        rowSelection={owner ? rowSelection : undefined}
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
            !isFolder && onMenuClick('detail', record);
          },
        })}
        scroll={{ x: 800 }}
      />
    </>
  );
});
