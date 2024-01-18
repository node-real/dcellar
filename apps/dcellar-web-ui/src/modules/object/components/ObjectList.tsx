import React, { memo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ObjectItem,
  ObjectOperationsType,
  selectObjectList,
  selectPathCurrent,
  selectPathLoading,
  setCurrentObjectPage,
  setObjectOperation,
  setRestoreCurrent,
  setSelectedRowKeys,
  setStatusDetail,
  setupListObjects,
  SINGLE_OBJECT_MAX_SIZE,
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
import { useAsyncEffect, useUpdateEffect } from 'ahooks';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { ObjectNameColumn } from '@/modules/object/components/ObjectNameColumn';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { setReadQuota, setupBucketQuota } from '@/store/slices/bucket';
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
import { OBJECT_SEALED_STATUS } from '@/modules/object/constant';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { StyledRow } from '@/modules/object/objects.style';
import { selectUploadQueue, UploadFile } from '@/store/slices/global';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { selectAccount } from '@/store/slices/accounts';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { NewObject } from '@/modules/object/components/NewObject';
import { MenuOption } from '@/components/common/DCMenuList';
import { ObjectOperations } from '@/modules/object/components/ObjectOperations';
import { contentTypeToExtension } from '@/modules/object/utils';
import { formatBytes } from '@/utils/formatter';
import { INTERNAL_FOLDER_EXTENSION } from '@/modules/object/components/ObjectFilterItems';
import dayjs from 'dayjs';
import { Flex } from '@totejs/uikit';
import { IconFont } from '@/components/IconFont';
import { openLink } from '@/utils/bom';
import { apolloUrlTemplate } from '@/utils/string';
import { pickAction, removeAction } from '@/utils/object';
import { ManageObjectTagsDrawer } from './ManageObjectTagsDrawer';

export type ObjectActionValueType =
  | 'marketplace'
  | 'detail'
  | 'share'
  | 'download'
  | 'cancel'
  | 'delete';

export type ObjectMenuOption = Omit<MenuOption, 'value'> & {
  value: ObjectActionValueType;
};
const Actions: ObjectMenuOption[] = [
  {
    label: (
      <Flex alignItems={'center'}>
        List for Sell
        <IconFont ml={4} w={76} h={16} type="data-marketplace" />
      </Flex>
    ),
    value: 'marketplace',
  },
  { label: 'View Details', value: 'detail' },
  { label: 'Share', value: 'share' },
  { label: 'Download', value: 'download' },
  { label: 'Cancel', value: 'cancel', variant: 'danger' },
  { label: 'Delete', value: 'delete', variant: 'danger' },
];
const QuickActionValues = ['download', 'share'];

interface ObjectListProps {
  shareMode?: boolean;
}

export const ObjectList = memo<ObjectListProps>(function ObjectList({ shareMode = false }) {
  const dispatch = useAppDispatch();
  const { loginAccount, objectPageSize, objectSortBy, accounts } = useAppSelector(
    (root) => root.persist,
  );
  const {
    bucketName,
    prefix,
    path,
    objectsInfo,
    selectedRowKeys,
    filterText,
    filterTypes,
    filterSizeTo,
    filterSizeFrom,
    filterRange,
    objectsTruncate,
  } = useAppSelector((root) => root.object);
  const currentPage = useAppSelector(selectPathCurrent);
  const { discontinue, owner, bucketInfo } = useAppSelector((root) => root.bucket);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const loading = useAppSelector(selectPathLoading);
  const objectList = useAppSelector(selectObjectList);
  const { setOpenAuthModal } = useOffChainAuth();
  const uploadQueue = useAppSelector(selectUploadQueue(loginAccount));
  const bucket = bucketInfo[bucketName];
  const accountDetail = useAppSelector(selectAccount(bucket?.PaymentAddress));
  const { LIST_FOR_SELL_ENDPOINT } = useAppSelector((root) => root.apollo);

  const filtered =
    !!filterText.trim() ||
    filterTypes.length ||
    filterRange?.[0] ||
    filterRange?.[1] ||
    filterSizeTo.value ||
    filterSizeFrom.value;

  const _filteredObjectList = filtered
    ? objectList
        .filter((o) =>
          !filterText.trim()
            ? true
            : o.objectName.toLowerCase().includes(filterText.trim().toLowerCase()),
        )
        .filter((o) => {
          if (!filterTypes.length) return true;
          if (o.objectName.endsWith('/') && filterTypes.includes(INTERNAL_FOLDER_EXTENSION))
            return true;
          if (!o.name.includes('.') && filterTypes.includes('OTHERS')) return true;
          const match = o.name.match(/\.([^.]+)$/i);
          return match && filterTypes.includes(match[1]?.toUpperCase());
        })
        .filter((o) => {
          if (!filterRange?.[0] && !filterRange?.[1]) return true;
          if (o.objectName.endsWith('/')) return false;
          const createAt = o.createAt * 1000;
          return (
            dayjs(createAt).isAfter(dayjs(filterRange?.[0]).startOf('day')) &&
            dayjs(createAt).isBefore(dayjs(filterRange?.[1] || dayjs()).endOf('day'))
          );
        })
        .filter((o) => {
          if (filterSizeFrom?.value === null && filterSizeTo?.value === null) return true;
          if (filterSizeFrom?.value !== null && filterSizeTo?.value !== null)
            return (
              o.payloadSize >= filterSizeFrom.value * Number(filterSizeFrom.unit) * 1024 &&
              o.payloadSize <= filterSizeTo.value * Number(filterSizeTo.unit) * 1024
            );
          if (filterSizeFrom?.value !== null)
            return o.payloadSize >= filterSizeFrom.value * Number(filterSizeFrom.unit) * 1024;
          if (filterSizeTo?.value !== null)
            return o.payloadSize <= filterSizeTo.value * Number(filterSizeTo.unit) * 1024;
        })
    : objectList;

  const { dir, sortName, sortedList, page, canPrev, canNext } = useTableNav<ObjectItem>({
    list: _filteredObjectList,
    sorter: objectSortBy,
    pageSize: objectPageSize,
    currentPage,
  });

  const primarySp = primarySpInfo[bucketName];

  useUpdateEffect(() => {
    if (filterText.trim() || !filterText) {
      dispatch(setCurrentObjectPage({ path, current: 0 }));
    }
  }, [filterText]);

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

    if (config.directDownload || shareMode) {
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
      const [objectInfo, quotaData, error] = await getObjectInfoAndBucketQuota(gParams);
      if (
        ['bad signature', 'invalid signature', 'user public key is expired'].includes(error || '')
      ) {
        return onError(E_OFF_CHAIN_AUTH);
      }
      if (!objectInfo) {
        return onError(E_OBJECT_NAME_EXISTS);
      }
      if (!shareMode) {
        if (!quotaData) {
          return onError(E_GET_QUOTA_FAILED);
        }
        let remainQuota = quotaRemains(quotaData, object.payloadSize + '');
        // update quota data.
        dispatch(setReadQuota({ bucketName, quota: quotaData }));
        if (!remainQuota) return onError(E_NO_QUOTA);
      }
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

    return dispatch(
      setObjectOperation({
        level: 1,
        operation: [
          `${object.bucketName}/${object.objectName}`,
          'download',
          { action: 'download' },
        ],
      }),
    );
  };

  const onMenuClick = async (menu: ObjectOperationsType, record: ObjectItem) => {
    if (menu === 'marketplace') {
      const key = path + '/' + record.name;
      const curObjectInfo = objectsInfo[key];
      const link = apolloUrlTemplate(
        LIST_FOR_SELL_ENDPOINT,
        `address=${loginAccount}&bid=${bucket.Id}&oid=${curObjectInfo.ObjectInfo.Id}`,
      );
      openLink(link);
      return;
    }
    switch (menu) {
      case 'detail':
      case 'delete':
      case 'cancel':
        const folder = record.objectName.endsWith('/');
        if (folder && menu === 'detail') {
          return dispatch(
            setObjectOperation({
              operation: [`${record.bucketName}/${record.objectName}`, 'folder_detail'],
            }),
          );
        }
        return dispatch(
          setObjectOperation({ operation: [`${record.bucketName}/${record.objectName}`, menu] }),
        );
      case 'download':
        return download(record);
      case 'share':
        return dispatch(
          setObjectOperation({
            level: 1,
            operation: [`${record.bucketName}/${record.objectName}`, menu],
          }),
        );
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
          <ObjectNameColumn
            shareMode={shareMode}
            item={record}
            disabled={accountDetail.clientFrozen}
          />
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
        let pruneActions = Actions.map((item) => item.value);
        const isFolder = record.objectName.endsWith('/');
        const isSealed = record.objectStatus === OBJECT_SEALED_STATUS;

        // if account frozen, disabled 'download' & 'delete'
        if (accountDetail?.clientFrozen) {
          pruneActions = pickAction(pruneActions, ['delete', 'download']);
        }

        const key = path + '/' + record.name;
        const curObjectInfo = objectsInfo[key];

        // if this object is not yours, you only can review it
        if (bucket?.Owner !== loginAccount) {
          pruneActions = pickAction(pruneActions, ['detail']);
        }

        // if this folder is yours, you only can review it
        if (isFolder) {
          pruneActions = pickAction(
            pruneActions,
            owner ? ['detail', 'share', 'delete'] : ['detail'],
          );
        }
        // if sealed, remove cancel
        if (isSealed) {
          pruneActions = removeAction(pruneActions, ['cancel']);
        } else {
          //  It is not allowed to cancel when the chain is sealed, but the SP is not synchronized.
          const file = find<UploadFile>(
            uploadQueue,
            (q) =>
              [...q.prefixFolders, q.waitFile.name].join('/') === record.objectName &&
              q.status !== 'ERROR',
          );
          // if is uploading, can not cancel;
          if (file && ['SIGN', 'SIGNED', 'UPLOAD'].includes(file.status)) {
            pruneActions = pickAction(pruneActions, ['detail']);
          } else if (file && ['SEAL'].includes(file.status)) {
            pruneActions = removeAction(pruneActions, ['cancel', 'share']);
          } else {
            // if not sealed, only support 'cancel' 'detail'
            pruneActions = pickAction(pruneActions, ['cancel', 'detail']);
          }
        }

        // filter marketplace
        if (isFolder || !owner || !isSealed || !LIST_FOR_SELL_ENDPOINT) {
          pruneActions = removeAction(pruneActions, ['marketplace']);
        }

        const quickOperations = pruneActions.filter((item) => QuickActionValues.includes(item));
        const menus = Actions.filter((item) => pruneActions.includes(item.value));

        if (isFolder && shareMode) return null;

        return (
          <ActionMenu
            shareMode={shareMode}
            menus={menus}
            operations={quickOperations}
            onChange={(e) => onMenuClick(e as ObjectOperationsType, record)}
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

  const empty = !loading && !sortedList.length;
  const loadingComponent = { spinning: loading, indicator: <Loading /> };
  const renderEmpty = useCallback(
    () => (
      <ListEmpty
        type={discontinue && !filtered ? 'discontinue' : 'empty-object'}
        title={
          filtered || shareMode
            ? 'No Results'
            : discontinue
            ? 'Discontinue Notice'
            : 'Upload Objects and Start Your Work Now'
        }
        desc={
          filtered || shareMode
            ? 'No results found. Please try different conditions.'
            : discontinue
            ? 'This bucket were marked as discontinued and will be deleted by SP soon. '
            : `To avoid data loss during testnet phase, the file size should not exceed ${formatBytes(
                SINGLE_OBJECT_MAX_SIZE,
              )}.`
        }
        empty={empty}
      >
        {!filtered && !shareMode && <NewObject showRefresh={false} />}
      </ListEmpty>
    ),
    [discontinue, empty, filtered, shareMode],
  );

  return (
    <>
      {discontinue && owner && (
        <DiscontinueBanner content="All the items in this bucket were marked as discontinued and will be deleted by SP soon. Please backup your data in time. " />
      )}
      <ObjectOperations />
      <ManageObjectTagsDrawer />
      <DCTable
        rowSelection={owner || shareMode ? rowSelection : undefined}
        loading={loadingComponent}
        rowKey="objectName"
        columns={columns}
        dataSource={page}
        renderEmpty={renderEmpty}
        pageSize={objectPageSize}
        pageChange={onPageChange}
        canNext={canNext}
        canPrev={canPrev}
        onRow={
          !shareMode
            ? (record) => ({
                onClick: () => {
                  onMenuClick('detail', record);
                },
              })
            : undefined
        }
        scroll={{ x: 800 }}
        total={
          objectsTruncate[path]
            ? 'Latest 10,000 objects.'
            : `Total: ${objectList.length.toLocaleString()}`
        }
      />
    </>
  );
});
