import { IconFont } from '@/components/IconFont';
import { MenuOption } from '@/components/common/DCMenuList';
import { AlignType, DCTable, SortIcon, SortItem, UploadStatus } from '@/components/common/DCTable';
import { ActionMenu } from '@/components/common/DCTable/ActionMenu';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { Loading } from '@/components/common/Loading';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { quotaRemains } from '@/facade/bucket';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import {
  E_GET_QUOTA_FAILED,
  E_NO_QUOTA,
  E_OBJECT_NAME_EXISTS,
  E_OFF_CHAIN_AUTH,
  E_UNKNOWN,
} from '@/facade/error';
import { downloadObject } from '@/facade/object';
import { CreateObject } from '@/modules/object/components/CreateObject';
import { INTERNAL_FOLDER_EXTENSION } from '@/modules/object/components/ObjectFilterItems';
import { ObjectNameColumn } from '@/modules/object/components/ObjectNameColumn';
import { OBJECT_SEALED_STATUS } from '@/modules/object/constant';
import { StyledRow } from '@/modules/object/objects.style';
import { contentTypeToExtension } from '@/modules/object/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount } from '@/store/slices/accounts';
import { setBucketQuota, setupBucketQuota } from '@/store/slices/bucket';
import { selectUploadQueue, setSignatureAction, UploadObject } from '@/store/slices/global';
import {
  ObjectEntity,
  ObjectOperationsType,
  selectObjectList,
  selectPathCurrent,
  selectPathLoading,
  setObjectListPage,
  setObjectListPageRestored,
  setObjectOperation,
  setObjectSelectedKeys,
  setupListObjects,
  SINGLE_OBJECT_MAX_SIZE,
} from '@/store/slices/object';
import {
  getSpOffChainData,
  setObjectListPageSize,
  setObjectSorter,
  SorterType,
} from '@/store/slices/persist';
import { openLink } from '@/utils/bom';
import { formatBytes } from '@/utils/formatter';
import { pickAction, removeAction } from '@/utils/object';
import { apolloUrlTemplate } from '@/utils/string';
import { formatTime, getMillisecond } from '@/utils/time';
import { Flex } from '@node-real/uikit';
import { useAsyncEffect, useUpdateEffect } from 'ahooks';
import { ColumnProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { find, uniq, without, xor } from 'lodash-es';
import { memo, useCallback } from 'react';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../ObjectError';
// import { ManageObjectTagsDrawer } from './ManageObjectTagsDrawer';

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
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const objectPageSize = useAppSelector((root) => root.persist.objectPageSize);
  const objectSortBy = useAppSelector((root) => root.persist.objectSortBy);
  const accountRecords = useAppSelector((root) => root.persist.accountRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const objectCommonPrefix = useAppSelector((root) => root.object.objectCommonPrefix);
  const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
  const objectRecords = useAppSelector((root) => root.object.objectRecords);
  const objectSelectedKeys = useAppSelector((root) => root.object.objectSelectedKeys);
  const objectNameFilter = useAppSelector((root) => root.object.objectNameFilter);
  const objectSizeToFilter = useAppSelector((root) => root.object.objectSizeToFilter);
  const objectSizeFromFilter = useAppSelector((root) => root.object.objectSizeFromFilter);
  const objectCreationTimeRangeFilter = useAppSelector(
    (root) => root.object.objectCreationTimeRangeFilter,
  );
  const objectTypeFilter = useAppSelector((root) => root.object.objectTypeFilter);
  const objectListTruncated = useAppSelector((root) => root.object.objectListTruncated);
  const isBucketDiscontinue = useAppSelector((root) => root.bucket.isBucketDiscontinue);
  const isBucketOwner = useAppSelector((root) => root.bucket.isBucketOwner);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const primarySpRecords = useAppSelector((root) => root.sp.primarySpRecords);
  const LIST_FOR_SELL_ENDPOINT = useAppSelector((root) => root.apollo.LIST_FOR_SELL_ENDPOINT);
  const currentPage = useAppSelector(selectPathCurrent);
  const loading = useAppSelector(selectPathLoading);
  const objectList = useAppSelector(selectObjectList);
  const uploadQueue = useAppSelector(selectUploadQueue(loginAccount));

  const { setOpenAuthModal } = useOffChainAuth();
  const bucket = bucketRecords[currentBucketName];
  const accountDetail = useAppSelector(selectAccount(bucket?.PaymentAddress));

  const filtered =
    !!objectNameFilter.trim() ||
    objectTypeFilter.length ||
    objectCreationTimeRangeFilter?.[0] ||
    objectCreationTimeRangeFilter?.[1] ||
    objectSizeToFilter.value ||
    objectSizeFromFilter.value;

  const _filteredObjectList = filtered
    ? objectList
        .filter((o) =>
          !objectNameFilter.trim()
            ? true
            : o.objectName.toLowerCase().includes(objectNameFilter.trim().toLowerCase()),
        )
        .filter((o) => {
          if (!objectTypeFilter.length) return true;
          if (o.objectName.endsWith('/') && objectTypeFilter.includes(INTERNAL_FOLDER_EXTENSION))
            return true;
          if (!o.name.includes('.') && objectTypeFilter.includes('OTHERS')) return true;
          const match = o.name.match(/\.([^.]+)$/i);
          return match && objectTypeFilter.includes(match[1]?.toUpperCase());
        })
        .filter((o) => {
          if (!objectCreationTimeRangeFilter?.[0] && !objectCreationTimeRangeFilter?.[1])
            return true;
          if (o.objectName.endsWith('/')) return false;
          const createAt = o.createAt * 1000;
          return (
            dayjs(createAt).isAfter(dayjs(objectCreationTimeRangeFilter?.[0]).startOf('day')) &&
            dayjs(createAt).isBefore(
              dayjs(objectCreationTimeRangeFilter?.[1] || dayjs()).endOf('day'),
            )
          );
        })
        .filter((o) => {
          if (objectSizeFromFilter?.value === null && objectSizeToFilter?.value === null)
            return true;
          if (objectSizeFromFilter?.value !== null && objectSizeToFilter?.value !== null)
            return (
              o.payloadSize >=
                objectSizeFromFilter.value * Number(objectSizeFromFilter.unit) * 1024 &&
              o.payloadSize <= objectSizeToFilter.value * Number(objectSizeToFilter.unit) * 1024
            );
          if (objectSizeFromFilter?.value !== null)
            return (
              o.payloadSize >= objectSizeFromFilter.value * Number(objectSizeFromFilter.unit) * 1024
            );
          if (objectSizeToFilter?.value !== null)
            return (
              o.payloadSize <= objectSizeToFilter.value * Number(objectSizeToFilter.unit) * 1024
            );
        })
    : objectList;

  const { dir, sortName, sortedList, page, canPrev, canNext } = useTableNav<ObjectEntity>({
    list: _filteredObjectList,
    sorter: objectSortBy,
    pageSize: objectPageSize,
    currentPage,
  });

  const primarySp = primarySpRecords[currentBucketName];

  const onSelectChange = (item: ObjectEntity) => {
    dispatch(setObjectSelectedKeys(xor(objectSelectedKeys, [item.objectName])));
  };

  const empty = !loading && !sortedList.length;
  const loadingComponent = { spinning: loading, indicator: <Loading /> };
  const renderEmpty = useCallback(
    () => (
      <ListEmpty
        type={isBucketDiscontinue && !filtered ? 'discontinue' : 'empty-object'}
        title={
          filtered || shareMode
            ? 'No Results'
            : isBucketDiscontinue
              ? 'Discontinue Notice'
              : 'Upload Objects and Start Your Work Now'
        }
        desc={
          filtered || shareMode
            ? 'No results found. Please try different conditions.'
            : isBucketDiscontinue
              ? 'This bucket were marked as discontinued and will be deleted by SP soon. '
              : `To avoid data loss during testnet phase, the file size should not exceed ${formatBytes(
                  SINGLE_OBJECT_MAX_SIZE,
                )}.`
        }
        empty={empty}
      >
        {!filtered && !shareMode && <CreateObject showRefresh={false} />}
      </ListEmpty>
    ),
    [isBucketDiscontinue, empty, filtered, shareMode],
  );

  const columns: ColumnProps<ObjectEntity>[] = [
    {
      key: 'objectName',
      title: (
        <SortItem onClick={() => onSorterChange('objectName', 'ascend')}>
          Name{sortName === 'objectName' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectEntity) => (
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
        <SortItem onClick={() => onSorterChange('contentType', 'ascend')}>
          Type{sortName === 'contentType' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectEntity) => (
        <StyledRow $disabled={record.objectStatus !== 1}>
          {contentTypeToExtension(record.contentType, record.objectName)}
        </StyledRow>
      ),
    },
    {
      key: 'payloadSize',
      width: 200,
      title: (
        <SortItem onClick={() => onSorterChange('payloadSize', 'ascend')}>
          Size{sortName === 'payloadSize' ? SortIcon[dir] : <span>{SortIcon['ascend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectEntity) =>
        record.folder ? (
          '--'
        ) : (
          <StyledRow $disabled={record.objectStatus !== 1}>
            {record.objectStatus === 1 ? (
              formatBytes(record.payloadSize)
            ) : (
              <UploadStatus
                object={[completeCommonPrefix, record.name].join('/')}
                size={record.payloadSize}
              />
            )}
          </StyledRow>
        ),
    },
    {
      key: 'createAt',
      width: 160,
      title: (
        <SortItem onClick={() => onSorterChange('createAt', 'descend')}>
          Date Created
          {sortName === 'createAt' ? SortIcon[dir] : <span>{SortIcon['descend']}</span>}
        </SortItem>
      ),
      render: (_: string, record: ObjectEntity) => (
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
      render: (_: string, record: ObjectEntity) => {
        let pruneActions = Actions.map((item) => item.value);
        const isFolder = record.objectName.endsWith('/');
        const isSealed = record.objectStatus === OBJECT_SEALED_STATUS;

        // if account frozen, disabled 'download' & 'delete'
        if (accountDetail?.clientFrozen) {
          pruneActions = pickAction(pruneActions, ['delete', 'download']);
        }

        const key = completeCommonPrefix + '/' + record.name;
        const curObjectInfo = objectRecords[key];

        // if this object is not yours, you only can review it
        if (bucket?.Owner !== loginAccount) {
          pruneActions = pickAction(pruneActions, ['detail']);
        }

        // if this folder is yours, you only can review it
        if (isFolder) {
          pruneActions = pickAction(
            pruneActions,
            isBucketOwner ? ['detail', 'share', 'delete'] : ['detail'],
          );
        }
        // if sealed, remove cancel
        if (isSealed) {
          pruneActions = removeAction(pruneActions, ['cancel']);
        } else {
          //  It is not allowed to cancel when the chain is sealed, but the SP is not synchronized.
          const file = find<UploadObject>(
            uploadQueue,
            (q) =>
              [...q.prefixFolders, q.waitObject.name].join('/') === record.objectName &&
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
        if (isFolder || !isBucketOwner || !isSealed || !LIST_FOR_SELL_ENDPOINT) {
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

  const onSelectAllChange = (
    selected: boolean,
    selectedRows: ObjectEntity[],
    changeRows: ObjectEntity[],
  ) => {
    const _changeRows = changeRows.filter(Boolean).map((i) => i.objectName);
    if (selected) {
      dispatch(setObjectSelectedKeys(uniq(objectSelectedKeys.concat(_changeRows))));
    } else {
      dispatch(setObjectSelectedKeys(without(objectSelectedKeys, ..._changeRows)));
    }
  };

  const rowSelection = {
    checkStrictly: true,
    selectedRowKeys: objectSelectedKeys,
    onSelect: onSelectChange,
    onSelectAll: onSelectAllChange,
    getCheckboxProps: (record: ObjectEntity) => ({
      disabled: record.folder || record.objectStatus !== 1, // Column configuration not to be checked
      name: record.name,
    }),
  };

  const errorHandler = (type: string) => {
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];

    dispatch(setSignatureAction(errorData));
  };

  const onSorterChange = (name: string, def: string) => {
    const newSort = sortName === name ? (dir === 'ascend' ? 'descend' : 'ascend') : def;
    if (sortName === name && dir === newSort) return;
    dispatch(setObjectListPageRestored(false));
    dispatch(setObjectSorter([name, newSort] as SorterType));
  };

  const download = async (object: ObjectEntity) => {
    const config = accountRecords[loginAccount] || {};

    if (config.directDownload || shareMode) {
      const { seedString } = await dispatch(
        getSpOffChainData(loginAccount, primarySp.operatorAddress),
      );
      const gParams = {
        bucketName: currentBucketName,
        objectName: object.objectName,
        endpoint: primarySp.endpoint,
        seedString,
        address: loginAccount,
      };
      const [objectInfo, quotaData, error] = await getObjectInfoAndBucketQuota(gParams);
      if (
        ['bad signature', 'invalid signature', 'user public key is expired'].includes(error || '')
      ) {
        return errorHandler(E_OFF_CHAIN_AUTH);
      }
      if (!objectInfo) {
        return errorHandler(E_OBJECT_NAME_EXISTS);
      }
      if (!shareMode) {
        if (!quotaData) {
          return errorHandler(E_GET_QUOTA_FAILED);
        }
        const remainQuota = quotaRemains(quotaData, object.payloadSize + '');
        // update quota data.
        dispatch(setBucketQuota({ bucketName: currentBucketName, quota: quotaData }));
        if (!remainQuota) return errorHandler(E_NO_QUOTA);
      }
      const params = {
        primarySp,
        objectInfo,
        address: loginAccount,
      };

      // const operator = primarySpInfo.operatorAddress;
      // const { seedString } = await dispatch(getSpOffChainData(loginAccount, operator));
      const [success, opsError] = await downloadObject(params, seedString);
      if (opsError) return errorHandler(opsError);
      dispatch(setupBucketQuota(currentBucketName));
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

  const onMenuClick = async (menu: ObjectOperationsType, record: ObjectEntity) => {
    if (menu === 'marketplace') {
      const key = completeCommonPrefix + '/' + record.name;
      const curObjectInfo = objectRecords[key];
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
      case 'cancel': {
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
      }
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

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(
        setObjectListPage({
          path: completeCommonPrefix,
          current: currentPage + (next ? 1 : -1),
        }),
      );
    }
    dispatch(setObjectListPage({ path: completeCommonPrefix, current: 0 }));
    dispatch(setObjectListPageSize(pageSize));
  };

  useUpdateEffect(() => {
    if (objectNameFilter.trim() || !objectNameFilter) {
      dispatch(setObjectListPage({ path: completeCommonPrefix, current: 0 }));
    }
  }, [objectNameFilter]);

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
    dispatch(setObjectSelectedKeys([]));
    dispatch(setupListObjects(params));
    dispatch(setupBucketQuota(currentBucketName));
  }, [primarySp, objectCommonPrefix]);

  return (
    <DCTable
      rowSelection={isBucketOwner || shareMode ? rowSelection : undefined}
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
        objectListTruncated[completeCommonPrefix]
          ? 'Latest 10,000 objects.'
          : `Total: ${objectList.length.toLocaleString()}`
      }
    />
  );
});
