import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getListObjects, ListObjectsParams } from '@/facade/object';
import { toast } from '@totejs/uikit';
import { escapeRegExp, find, last, trimEnd } from 'lodash-es';
import {
  GfSPListObjectsByBucketNameResponse,
  GRNToString,
  ListObjectsByBucketNameRequest,
  newObjectGRN,
} from '@bnb-chain/greenfield-js-sdk';
import { ErrorResponse } from '@/facade/error';
import { Key } from 'react';
import { getMillisecond } from '@/utils/time';
import { BucketInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { ObjectMeta, PolicyMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { getFolderPolicies, getObjectPolicies } from '@/facade/bucket';
import { numberToHex } from 'viem';

export const SINGLE_OBJECT_MAX_SIZE = 256 * 1024 * 1024;
export const SELECT_OBJECT_NUM_LIMIT = 100;
export const MAXIMUM_LIST_ITEMS = 10_000;

export type ObjectItem = {
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
  | '';

export type TEditUploadContent = {
  gasFee: string;
  preLockFee: string;
  totalFee: string;
  isBalanceAvailable: boolean;
};

export type ObjectFilterSize = { value: number | null; unit: '1' | '1024' };

export interface ObjectState {
  bucketName: string;
  folders: string[];
  prefix: string;
  path: string;
  objects: Record<string, ObjectItem[]>;
  objectsTruncate: Record<string, boolean>;
  objectsInfo: Record<string, ObjectMeta>;
  currentPage: Record<string, number>;
  restoreCurrent: boolean;
  statusDetail: TStatusDetail;
  selectedRowKeys: Key[];
  deletedObjects: Record<string, number>;
  refreshing: boolean;
  objectPolicies: Record<string, PolicyMeta[]>;
  objectPoliciesPage: number;
  objectOperation: Record<0 | 1, [string, ObjectOperationsType, Record<string, any>?]>;
  selectedShareMembers: string[];
  filterText: string;
  filterExpand: boolean;
  filterTypes: Array<string>;
  filterRange: [string, string];
  filterSizeFrom: ObjectFilterSize;
  filterSizeTo: ObjectFilterSize;
  policyResources: Record<string, ObjectResource>;
  shareModePath: string;
}

const initialState: ObjectState = {
  bucketName: '',
  folders: [],
  prefix: '',
  path: '',
  objects: {},
  objectsInfo: {},
  currentPage: {},
  restoreCurrent: true,
  statusDetail: {} as TStatusDetail,
  selectedRowKeys: [],
  deletedObjects: {},
  refreshing: false,
  objectPolicies: {},
  objectPoliciesPage: 0,
  objectOperation: { 0: ['', '', {}], 1: ['', '', {}] },
  selectedShareMembers: [],
  filterText: '',
  filterExpand: false,
  filterTypes: [],
  filterRange: ['', ''],
  filterSizeFrom: { value: null, unit: '1' },
  filterSizeTo: { value: null, unit: '1024' },
  objectsTruncate: {},
  policyResources: {},
  shareModePath: '',
};

export const objectSlice = createSlice({
  name: 'object',
  initialState,
  reducers: {
    setShareModePath(state, { payload }: PayloadAction<string>) {
      state.shareModePath = payload;
    },
    setObjectPolicyResources(state, { payload }: PayloadAction<Record<string, ObjectResource>>) {
      state.policyResources = {
        ...state.policyResources,
        ...payload,
      };
    },
    setObjectsTruncate(state, { payload }: PayloadAction<{ path: string; truncate: boolean }>) {
      const { path, truncate } = payload;
      state.objectsTruncate[path] = truncate;
    },
    setFilterSizeFrom(state, { payload }: PayloadAction<ObjectFilterSize>) {
      state.filterSizeFrom = payload;
    },
    setFilterSizeTo(state, { payload }: PayloadAction<ObjectFilterSize>) {
      state.filterSizeTo = payload;
    },
    setFilterRange(state, { payload }: PayloadAction<[string, string]>) {
      state.filterRange = payload;
    },
    setFilterTypes(state, { payload }: PayloadAction<string[]>) {
      state.filterTypes = payload;
    },
    setFilterExpand(state, { payload }: PayloadAction<boolean>) {
      state.filterExpand = payload;
    },
    setFilterText(state, { payload }: PayloadAction<string>) {
      state.filterText = payload;
    },
    resetObjectListFilter(state) {
      state.filterText = '';
      state.filterTypes = [];
      state.filterRange = ['', ''];
      state.filterSizeFrom = { ...state.filterSizeFrom, value: null };
      state.filterSizeTo = { ...state.filterSizeTo, value: null };
    },
    setSelectedShareMembers(state, { payload }: PayloadAction<string[]>) {
      state.selectedShareMembers = payload;
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
    setObjectPoliciesPage(state, { payload }: PayloadAction<number>) {
      state.objectPoliciesPage = payload;
    },
    setObjectPolicies(state, { payload }: PayloadAction<{ path: string; policies: PolicyMeta[] }>) {
      const { path, policies } = payload;
      state.objectPolicies[path] = policies;
    },
    addDeletedObject(state, { payload }: PayloadAction<{ path: string; ts: number }>) {
      const { path, ts } = payload;
      state.deletedObjects[path] = ts;
    },
    setSelectedRowKeys(state, { payload }: PayloadAction<Key[]>) {
      state.selectedRowKeys = payload;
    },
    updateObjectVisibility(
      state,
      { payload }: PayloadAction<{ objectName: string; visibility: number }>,
    ) {
      const { objectName, visibility } = payload;
      const path = state.path;
      const item = find<ObjectItem>(state.objects[path] || [], (i) => i.objectName === objectName);
      if (!item) return;
      item.visibility = visibility;
      const info = state.objectsInfo[[state.bucketName, item.objectName].join('/')];
      if (!info) return;
      // @ts-ignore
      info.ObjectInfo.Visibility = visibility;
    },
    setDummyFolder(state, { payload }: PayloadAction<{ path: string; folder: ObjectItem }>) {
      const { path, folder } = payload;
      const items = state.objects[path];
      if (items.some((i) => i.name === folder.name)) return;
      items.push(folder);
      const [bucketName] = path.split('/');
      const _path = [bucketName, folder.objectName].join('/');
      state.deletedObjects[_path] = 0;
    },
    updateObjectStatus(
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
      const items = state.objects[path] || [];
      const objectName = [...folders, name].join('/');
      const object = find<ObjectItem>(items, (i) => i.objectName === objectName);
      if (object) {
        object.objectStatus = objectStatus;
      }
      const info = state.objectsInfo[[path, objectName].join('/')];
      if (!info) return;
      info.ObjectInfo.ObjectStatus = objectStatus as any; // number
    },
    setRestoreCurrent(state, { payload }: PayloadAction<boolean>) {
      state.restoreCurrent = payload;
    },
    setCurrentObjectPage(state, { payload }: PayloadAction<{ path: string; current: number }>) {
      const { path, current } = payload;
      state.currentPage[path] = current;
    },
    setFolders(state, { payload }: PayloadAction<{ bucketName: string; folders: string[] }>) {
      const { bucketName, folders } = payload;
      state.bucketName = bucketName;
      state.folders = folders;
      state.prefix = !folders.length ? '' : folders.join('/') + '/';
      state.path = [bucketName, ...folders].join('/');
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
          const ts = state.deletedObjects[path];
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
        state.objectsInfo[path] = i;

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
          const ts = state.deletedObjects[path];
          return !ts || ts < getMillisecond(o.createAt);
        });

      // TODO
      if (infoOnly) return;
      state.objects[path] = folders.concat(objects as any[]);
    },
    setListRefreshing(state, { payload }: PayloadAction<boolean>) {
      state.refreshing = payload;
    },
  },
});

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
    const { bucketName, path, prefix } = getState().object;
    if (!bucketName) return;
    dispatch(
      setDummyFolder({
        path,
        folder: {
          bucketName,
          objectName: prefix + name + '/',
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
    const { prefix, bucketName, path, restoreCurrent } = getState().object;
    const { loginAccount: address } = getState().persist;
    const _query = new URLSearchParams(params.query?.toString() || '');
    _query.append('max-keys', '1000');
    _query.append('delimiter', '/');
    if (prefix) _query.append('prefix', prefix);
    // support any path list objects, bucketName & _path
    const payload = { bucketName, ...params, query: _query, address } as ListObjectsParams;
    // fix refresh then nav to other pages.
    if (!bucketName) return;
    const [res, error, truncate] = await _getAllList(payload);
    if (!res || error) {
      toast.error({ description: error });
      return;
    }
    dispatch(setObjectsTruncate({ path: _path || path, truncate }));
    dispatch(setObjectList({ path: _path || path, list: res! }));
    dispatch(setRestoreCurrent(true));
    if (!restoreCurrent) {
      dispatch(setCurrentObjectPage({ path, current: 0 }));
    }
  };

export const selectPathLoading = (root: AppState) => {
  const { objects, path, refreshing } = root.object;
  return !(path in objects) || refreshing;
};

export const selectPathCurrent = (root: AppState) => {
  const { currentPage, path } = root.object;
  return currentPage[path] || 0;
};

const defaultLocateBucket = {} as BucketInfo;
export const selectLocateBucket = (root: AppState) => {
  const { bucketInfo } = root.bucket;
  const { bucketName } = root.object;
  return bucketInfo[bucketName] || defaultLocateBucket;
};

const defaultObjectList = Array<string>();
export const selectObjectList = (root: AppState) => {
  const { objects, path } = root.object;
  return objects[path] || defaultObjectList;
};

export const setupObjectPolicies =
  (bucketName: string, objectName: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const { bucketInfo } = getState().bucket;
    const sp = getState().sp.primarySpInfo[bucketName];
    const bucketId = bucketInfo[bucketName].Id;
    const isFolder = objectName.endsWith('/');

    let policies = await (isFolder
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
        Actions: p.Actions,
        Resources: p.Resources,
      };
    });

    dispatch(setObjectPolicyResources(resources));

    policies = policies.filter((p) => {
      if (p.PrincipalValue === loginAccount || !p.Actions) return true;
      return !!(
        p.Actions?.includes('ACTION_GET_OBJECT') &&
        p.Resources?.includes(GRNToString(newObjectGRN(bucketName, escapeRegExp(objectName))))
      );
    });

    const path = [bucketName, objectName].join('/');
    dispatch(setObjectPolicies({ path, policies }));
    return policies;
  };

export const {
  setFolders,
  setCurrentObjectPage,
  setObjectList,
  setRestoreCurrent,
  setStatusDetail,
  updateObjectStatus,
  setDummyFolder,
  updateObjectVisibility,
  addDeletedObject,
  setListRefreshing,
  setSelectedRowKeys,
  setObjectPolicies,
  setObjectPoliciesPage,
  setObjectOperation,
  setSelectedShareMembers,
  setFilterText,
  setFilterExpand,
  setFilterTypes,
  setFilterRange,
  setFilterSizeFrom,
  setFilterSizeTo,
  resetObjectListFilter,
  setObjectsTruncate,
  setObjectPolicyResources,
  setShareModePath,
} = objectSlice.actions;

export default objectSlice.reducer;
