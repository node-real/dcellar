import {
  BucketInfo,
  ResourceTags_Tag,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import {
  GRNToString,
  GfSPListObjectsByBucketNameResponse,
  ListObjectsByBucketNameRequest,
  newObjectGRN,
} from '@bnb-chain/greenfield-js-sdk';
import {
  ObjectInfo,
  ObjectMeta,
  PolicyMeta,
} from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { toast } from '@node-real/uikit';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { escapeRegExp, find, last, trimEnd } from 'lodash-es';
import { Key } from 'react';
import { numberToHex } from 'viem';

import { DEFAULT_TAG } from '@/components/common/ManageTags';
import { getFolderPolicies, getObjectPolicies } from '@/facade/bucket';
import { ErrorResponse } from '@/facade/error';
import { ListObjectsParams, getListObjects } from '@/facade/object';
import { AppDispatch, AppState, GetState } from '@/store';
import { convertObjectKey } from '@/utils/common';
import { getMillisecond } from '@/utils/time';

export const SINGLE_OBJECT_MAX_SIZE = 256 * 1024 * 1024;
export const SELECT_OBJECT_NUM_LIMIT = 100;
export const MAXIMUM_LIST_ITEMS = 10_000;

export type TStatusDetail = {
  icon: string;
  title: string;
  desc?: string;
  buttonText?: string;
  errorText?: string;
  buttonOnClick?: () => void;
  extraParams?: Array<string | number>;
};

export type ObjectResource = {
  Resources: string[];
  Actions: string[];
};

export type ObjectActionType = 'view' | 'download' | '';

export type ObjectOperationsType =
  | 'detail'
  | 'folder_detail'
  | 'delete'
  | 'share'
  | 'download'
  | 'upload'
  | 'cancel'
  | 'create_folder'
  | 'batch_delete'
  | 'marketplace'
  | 'update_tags'
  | 'edit_tags'
  | '';

export type TEditUploadContent = {
  gasFee: string;
  preLockFee: string;
  totalFee: string;
  isBalanceAvailable: boolean;
};

export type ObjectFilterSize = { value: number | null; unit: '1' | '1024' };

export type ObjectEntity = {
  bucketName: string;
  objectName: string;
  name: string;
  payloadSize: number;
  createAt: number;
  contentType: string;
  folder: boolean;
  visibility: number;
  objectStatus: number;
  removed: boolean;
};

export interface ObjectState {
  currentBucketName: string;
  pathSegments: string[];
  objectCommonPrefix: string;
  completeCommonPrefix: string;
  objectListRecords: Record<string, ObjectEntity[]>;
  objectListTruncated: Record<string, boolean>;
  objectRecords: Record<string, ObjectMeta>;
  objectListPageRecords: Record<string, number>;
  objectListPageRestored: boolean;
  statusDetail: TStatusDetail;
  objectSelectedKeys: Key[];
  deletedObjectRecords: Record<string, number>;
  objectListRefreshing: boolean;
  objectPolicyListRecords: Record<string, PolicyMeta[]>;
  objectPolicyListPage: number;
  objectOperation: Record<0 | 1, [string, ObjectOperationsType, Record<string, any>?]>;
  objectShareSelectedMembers: string[];
  objectNameFilter: string;
  objectFilterVisible: boolean;
  objectTypeFilter: Array<string>;
  objectCreationTimeRangeFilter: [string, string];
  objectSizeFromFilter: ObjectFilterSize;
  objectSizeToFilter: ObjectFilterSize;
  objectPolicyResourcesRecords: Record<string, ObjectResource>;
  objectShareModePath: string;
  objectEditTagsData: ResourceTags_Tag[];
}

const initialState: ObjectState = {
  currentBucketName: '',
  pathSegments: [],
  objectCommonPrefix: '',
  completeCommonPrefix: '',
  objectListRecords: {},
  objectRecords: {},
  objectListPageRecords: {},
  objectListPageRestored: true,
  statusDetail: {} as TStatusDetail,
  objectSelectedKeys: [],
  deletedObjectRecords: {},
  objectListRefreshing: false,
  objectPolicyListRecords: {},
  objectPolicyListPage: 0,
  objectOperation: { 0: ['', '', {}], 1: ['', '', {}] },
  objectShareSelectedMembers: [],
  objectNameFilter: '',
  objectFilterVisible: false,
  objectTypeFilter: [],
  objectCreationTimeRangeFilter: ['', ''],
  objectSizeFromFilter: { value: null, unit: '1' },
  objectSizeToFilter: { value: null, unit: '1024' },
  objectListTruncated: {},
  objectPolicyResourcesRecords: {},
  objectShareModePath: '',
  objectEditTagsData: [DEFAULT_TAG],
};

export const objectSlice = createSlice({
  name: 'object',
  initialState,
  reducers: {
    setObjectShareModePath(state, { payload }: PayloadAction<string>) {
      state.objectShareModePath = payload;
    },
    setObjectPolicyResourcesRecords(
      state,
      { payload }: PayloadAction<Record<string, ObjectResource>>,
    ) {
      state.objectPolicyResourcesRecords = {
        ...state.objectPolicyResourcesRecords,
        ...payload,
      };
    },
    setObjectListTruncated(state, { payload }: PayloadAction<{ path: string; truncate: boolean }>) {
      const { path, truncate } = payload;
      state.objectListTruncated[path] = truncate;
    },
    setObjectSizeFromFilter(state, { payload }: PayloadAction<ObjectFilterSize>) {
      state.objectSizeFromFilter = payload;
    },
    setObjectSizeToFilter(state, { payload }: PayloadAction<ObjectFilterSize>) {
      state.objectSizeToFilter = payload;
    },
    setObjectCreationTimeRangeFilter(state, { payload }: PayloadAction<[string, string]>) {
      state.objectCreationTimeRangeFilter = payload;
    },
    setObjectTypeFilter(state, { payload }: PayloadAction<string[]>) {
      state.objectTypeFilter = payload;
    },
    setObjectFilterVisible(state, { payload }: PayloadAction<boolean>) {
      state.objectFilterVisible = payload;
    },
    setObjectNameFilter(state, { payload }: PayloadAction<string>) {
      state.objectNameFilter = payload;
    },
    resetObjectFilter(state) {
      state.objectNameFilter = '';
      state.objectTypeFilter = [];
      state.objectCreationTimeRangeFilter = ['', ''];
      state.objectSizeFromFilter = { ...state.objectSizeFromFilter, value: null };
      state.objectSizeToFilter = { ...state.objectSizeToFilter, value: null };
    },
    setObjectShareSelectedMembers(state, { payload }: PayloadAction<string[]>) {
      state.objectShareSelectedMembers = payload;
    },
    setObjectOperation(
      state,
      {
        payload,
      }: PayloadAction<{
        level?: 0 | 1;
        operation: [string, ObjectOperationsType, Record<string, any>?];
      }>,
    ) {
      state.objectOperation[payload.level || 0] = payload.operation;
    },
    setObjectPolicyListPage(state, { payload }: PayloadAction<number>) {
      state.objectPolicyListPage = payload;
    },
    setObjectPolicyList(
      state,
      { payload }: PayloadAction<{ path: string; policies: PolicyMeta[] }>,
    ) {
      const { path, policies } = payload;
      state.objectPolicyListRecords[path] = policies;
    },
    setDeletedObject(state, { payload }: PayloadAction<{ path: string; ts: number }>) {
      const { path, ts } = payload;
      state.deletedObjectRecords[path] = ts;
    },
    setObjectSelectedKeys(state, { payload }: PayloadAction<Key[]>) {
      state.objectSelectedKeys = payload;
    },
    setObjectVisibility(
      state,
      { payload }: PayloadAction<{ objectName: string; visibility: number }>,
    ) {
      const { objectName, visibility } = payload;
      const path = state.completeCommonPrefix;
      const item = find<ObjectEntity>(
        state.objectListRecords[path] || [],
        (i) => i.objectName === objectName,
      );
      if (!item) return;
      item.visibility = visibility;
      const info = state.objectRecords[[state.currentBucketName, item.objectName].join('/')];
      if (!info) return;
      info.ObjectInfo.Visibility = visibility;
    },
    setCreationDummyFolder(
      state,
      { payload }: PayloadAction<{ path: string; folder: ObjectEntity }>,
    ) {
      const { path, folder } = payload;
      const items = state.objectListRecords[path];
      if (items.some((i) => i.name === folder.name)) return;
      items.push(folder);
      const [bucketName] = path.split('/');
      const _path = [bucketName, folder.objectName].join('/');
      state.deletedObjectRecords[_path] = 0;
    },
    setObjectStatus(
      state,
      {
        payload,
      }: PayloadAction<{
        bucketName: string;
        folders: string[];
        name: string;
        objectStatus: number;
      }>,
    ) {
      const { name, folders, objectStatus, bucketName } = payload;
      const path = [bucketName, ...folders].join('/');
      const items = state.objectListRecords[path] || [];
      const objectName = [...folders, name].join('/');
      const object = find<ObjectEntity>(items, (i) => i.objectName === objectName);
      if (object) {
        object.objectStatus = objectStatus;
      }
      const info = state.objectRecords[[path, objectName].join('/')];
      if (!info) return;
      info.ObjectInfo.ObjectStatus = objectStatus as any; // number
    },
    setObjectListPageRestored(state, { payload }: PayloadAction<boolean>) {
      state.objectListPageRestored = payload;
    },
    setObjectListPage(state, { payload }: PayloadAction<{ path: string; current: number }>) {
      const { path, current } = payload;
      state.objectListPageRecords[path] = current;
    },
    setPathSegments(state, { payload }: PayloadAction<{ bucketName: string; folders: string[] }>) {
      const { bucketName, folders } = payload;
      state.currentBucketName = bucketName;
      state.pathSegments = folders;
      state.objectCommonPrefix = !folders.length ? '' : folders.join('/') + '/';
      state.completeCommonPrefix = [bucketName, ...folders].join('/');
    },
    setStatusDetail(state, { payload }: PayloadAction<TStatusDetail>) {
      state.statusDetail = payload;
    },
    setObjectList(
      state,
      {
        payload,
      }: PayloadAction<{
        path: string;
        list: GfSPListObjectsByBucketNameResponse;
        infoOnly?: boolean;
      }>,
    ) {
      const { path, list, infoOnly = false } = payload;
      const [bucketName] = path.split('/');
      // keep order
      const folders = list?.CommonPrefixes.reverse()
        .map((i, index) => ({
          bucketName,
          objectName: i,
          name: last(trimEnd(i, '/').split('/'))!,
          payloadSize: 0,
          createAt: Date.now() + index,
          contentType: '',
          folder: true,
          visibility: 3,
          objectStatus: 1,
          removed: false,
        }))
        .filter((f) => {
          const path = [bucketName, f.objectName].join('/');
          const ts = state.deletedObjectRecords[path];
          // manually update delete status when create new folder
          return !ts;
        });

      const objects = list.Objects.map((i) => {
        const {
          BucketName,
          ObjectName,
          ObjectStatus,
          CreateAt,
          PayloadSize,
          Visibility,
          ContentType,
        } = i.ObjectInfo;

        const path = [BucketName, ObjectName].join('/');
        state.objectRecords[path] = i;

        return {
          bucketName: BucketName,
          objectName: ObjectName,
          name: last(ObjectName.split('/'))!,
          payloadSize: Number(PayloadSize),
          // todo fix it *second*
          createAt: Number(CreateAt),
          contentType: ContentType,
          folder: false,
          objectStatus: Number(ObjectStatus),
          visibility: Visibility,
          removed: i.Removed,
        };
      })
        .filter((i) => {
          return !i.objectName.endsWith('/') && !i.removed;
        })
        .filter((o) => {
          const path = [bucketName, o.objectName].join('/');
          const ts = state.deletedObjectRecords[path];
          return !ts || ts < getMillisecond(o.createAt);
        });

      // TODO
      if (infoOnly) return;
      state.objectListRecords[path] = folders.concat(objects as any[]);
    },
    setObjectListRefreshing(state, { payload }: PayloadAction<boolean>) {
      state.objectListRefreshing = payload;
    },
    setObjectEditTagsData(state, { payload }: PayloadAction<ResourceTags_Tag[]>) {
      state.objectEditTagsData = payload;
    },
    setObjectTags(state, { payload }: PayloadAction<{ id: string; tags: ResourceTags_Tag[] }>) {
      const { id, tags } = payload;
      const newTags = tags.map((item) => convertObjectKey(item, 'uppercase'));
      state.objectRecords[id].ObjectInfo.Tags.Tags = newTags as Extract<
        ObjectInfo['Tags'],
        {
          Tags: any;
        }
      >['Tags'];
    },
  },
});

export const {
  setPathSegments,
  setObjectListPage,
  setObjectList,
  setObjectListPageRestored,
  setStatusDetail,
  setObjectStatus,
  setCreationDummyFolder,
  setObjectVisibility,
  setDeletedObject,
  setObjectListRefreshing,
  setObjectSelectedKeys,
  setObjectPolicyList,
  setObjectPolicyListPage,
  setObjectOperation,
  setObjectShareSelectedMembers,
  setObjectNameFilter,
  setObjectFilterVisible,
  setObjectTypeFilter,
  setObjectCreationTimeRangeFilter,
  setObjectSizeFromFilter,
  setObjectSizeToFilter,
  resetObjectFilter,
  setObjectListTruncated,
  setObjectPolicyResourcesRecords,
  setObjectShareModePath,
  setObjectTags,
  setObjectEditTagsData,
} = objectSlice.actions;

export const selectPathLoading = (root: AppState) => {
  const { objectListRecords, completeCommonPrefix, objectListRefreshing } = root.object;
  return !(completeCommonPrefix in objectListRecords) || objectListRefreshing;
};

export const selectPathCurrent = (root: AppState) => {
  const { objectListPageRecords, completeCommonPrefix } = root.object;
  return objectListPageRecords[completeCommonPrefix] || 0;
};

const defaultLocateBucket = {} as BucketInfo;
export const selectLocateBucket = (root: AppState) => {
  const { bucketRecords } = root.bucket;
  const { currentBucketName } = root.object;
  return bucketRecords[currentBucketName] || defaultLocateBucket;
};

const defaultObjectList = Array<string>();
export const selectObjectList = (root: AppState) => {
  const { objectListRecords, completeCommonPrefix } = root.object;
  return objectListRecords[completeCommonPrefix] || defaultObjectList;
};

export const _getAllList = async (
  params: ListObjectsByBucketNameRequest,
): Promise<[GfSPListObjectsByBucketNameResponse, null, boolean] | ErrorResponse> => {
  const [res, error] = await getListObjects(params);
  if (error || !res || res.code !== 0) return [null, String(error || res?.message)];
  const data = res.body!;
  const list = data.GfSpListObjectsByBucketNameResponse;
  const token = list.NextContinuationToken;
  const items = (list.CommonPrefixes || []).length + list.Objects.length;
  if (token && items < MAXIMUM_LIST_ITEMS) {
    params.query?.set('continuation-token', token);
    const [res, error] = await _getAllList(params);
    if (error) return [null, error];
    const newList = res!;
    const _res: GfSPListObjectsByBucketNameResponse = {
      ...list,
      ...newList,
      CommonPrefixes: (list.CommonPrefixes || []).concat(newList.CommonPrefixes || []),
      KeyCount: String(Number(list.KeyCount) + Number(newList.KeyCount)),
      Objects: list.Objects.concat(newList.Objects),
    };
    return [_res, null, false];
  }
  return [list, null, !!token];
};

export const setupDummyFolder =
  (name: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { currentBucketName, completeCommonPrefix, objectCommonPrefix } = getState().object;
    if (!currentBucketName) return;
    dispatch(
      setCreationDummyFolder({
        path: completeCommonPrefix,
        folder: {
          bucketName: currentBucketName,
          objectName: objectCommonPrefix + name + '/',
          name: last(trimEnd(name, '/').split('/'))!,
          payloadSize: 0,
          createAt: Date.now(),
          contentType: '',
          folder: true,
          visibility: 3,
          objectStatus: 1,
          removed: false,
        },
      }),
    );
  };

export const setupListObjects =
  (params: Partial<ListObjectsParams>, _path?: string) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { objectCommonPrefix, currentBucketName, completeCommonPrefix, objectListPageRestored } =
      getState().object;
    const { loginAccount: address } = getState().persist;
    const _query = new URLSearchParams(params.query?.toString() || '');
    _query.append('max-keys', '1000');
    _query.append('delimiter', '/');
    if (objectCommonPrefix) _query.append('prefix', objectCommonPrefix);
    // support any path list objects, bucketName & _path
    const payload = {
      bucketName: currentBucketName,
      ...params,
      query: _query,
      address,
    } as ListObjectsParams;
    // fix refresh then nav to other pages.
    if (!currentBucketName) return;
    const [res, error, truncate] = await _getAllList(payload);
    if (!res || error) {
      toast.error({ description: error });
      return;
    }
    dispatch(setObjectListTruncated({ path: _path || completeCommonPrefix, truncate }));
    dispatch(setObjectList({ path: _path || completeCommonPrefix, list: res! }));
    dispatch(setObjectListPageRestored(true));
    if (!objectListPageRestored) {
      dispatch(setObjectListPage({ path: completeCommonPrefix, current: 0 }));
    }
  };

export const setupObjectPolicies =
  (bucketName: string, objectName: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const { bucketRecords } = getState().bucket;
    const sp = getState().sp.primarySpRecords[bucketName];
    const bucketId = bucketRecords[bucketName].Id;
    const isFolder = objectName.endsWith('/') || objectName === '';

    let policies: (PolicyMeta & Partial<ObjectResource>)[] = await (isFolder
      ? getFolderPolicies(numberToHex(Number(bucketId), { size: 32 }))
      : getObjectPolicies(bucketName, objectName, sp.endpoint));
    if (!policies.some((p) => p.PrincipalValue === loginAccount)) {
      policies.unshift({
        CreateTimestamp: Date.now(),
        ExpirationTime: 0,
        PrincipalType: 2,
        PrincipalValue: loginAccount,
        ResourceId: '',
        ResourceType: 2,
        UpdateTimestamp: 0,
        Actions: [],
        Resources: [],
      });
    }

    const resources: Record<string, ObjectResource> = {};

    policies.forEach((p) => {
      const key = isFolder
        ? `${bucketName}-${p.PrincipalValue}`.toLowerCase()
        : `${bucketName}/${objectName}-${p.PrincipalValue}`.toLowerCase();
      resources[key] = {
        Actions: p.Actions!,
        Resources: p.Resources!,
      };
    });

    dispatch(setObjectPolicyResourcesRecords(resources));

    policies = policies.filter((p) => {
      if (p.PrincipalValue === loginAccount || !p.Actions) return true;
      return (
        p.Actions?.includes('ACTION_GET_OBJECT') &&
        p.Resources?.includes(
          GRNToString(newObjectGRN(bucketName, !objectName ? '*' : escapeRegExp(objectName))),
        )
      );
    });

    const path = [bucketName, objectName].join('/');
    dispatch(setObjectPolicyList({ path, policies }));
    return policies;
  };

export default objectSlice.reducer;
