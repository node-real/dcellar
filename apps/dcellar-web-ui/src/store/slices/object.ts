import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getListObjects, ListObjectsParams } from '@/facade/object';
import { toast } from '@totejs/uikit';
import { find, get, last, trimEnd } from 'lodash-es';
import { GfSPListObjectsByBucketNameResponse, TListObjects } from '@bnb-chain/greenfield-js-sdk';
import { ErrorResponse } from '@/facade/error';
import { Key } from 'react';
import { getMillisecond } from '@/utils/time';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp-xml/Common';
// import { TObject } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp-xml/Common';

export const SINGLE_OBJECT_MAX_SIZE = 256 * 1024 * 1024;
export const SELECT_OBJECT_NUM_LIMIT = 10;

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
};

export type ObjectActionType = 'view' | 'download' | '';

export type TEditUploadContent = {
  gasFee: string;
  preLockFee: string;
  totalFee: string;
  isBalanceAvailable: boolean;
};
export type TEditUpload = TEditUploadContent & { isOpen: boolean };
export interface ObjectState {
  bucketName: string;
  folders: string[];
  prefix: string;
  path: string;
  objects: Record<string, ObjectItem[]>;
  objectsInfo: Record<string, ObjectMeta>;
  currentPage: Record<string, number>;
  restoreCurrent: boolean;
  editDetail: ObjectItem;
  editDelete: ObjectItem;
  editCreate: boolean;
  editDownload: ObjectItem & { action?: ObjectActionType };
  editShare: {
    record: ObjectItem;
    from: string;
  };
  editCancel: ObjectItem;
  statusDetail: TStatusDetail;
  editUpload: TEditUpload;
  selectedRowKeys: Key[];
  deletedObjects: Record<string, number>;
  refreshing: boolean;
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
  editDetail: {} as ObjectItem,
  editDelete: {} as ObjectItem,
  editCreate: false,
  editDownload: {} as ObjectItem & { action?: ObjectActionType },
  editShare: {
    record: {} as ObjectItem,
    from: 'menu',
  },
  editCancel: {} as ObjectItem,
  statusDetail: {} as TStatusDetail,
  editUpload: {} as TEditUpload,
  selectedRowKeys: [],
  deletedObjects: {},
  refreshing: false,
};

export const objectSlice = createSlice({
  name: 'object',
  initialState,
  reducers: {
    addDeletedObject(state, { payload }: PayloadAction<{ path: string; ts: number }>) {
      const { path, ts } = payload;
      state.deletedObjects[path] = ts;
    },
    setSelectedRowKeys(state, { payload }: PayloadAction<Key[]>) {
      state.selectedRowKeys = payload;
    },
    updateObjectVisibility(
      state,
      { payload }: PayloadAction<{ object: ObjectItem; visibility: number }>,
    ) {
      const { object, visibility } = payload;
      const path = state.path;
      const item = find<ObjectItem>(
        state.objects[path] || [],
        (i) => i.objectName === object.objectName,
      );
      if (state.editDetail.objectName === object.objectName) {
        state.editDetail.visibility = visibility;
      }
      if (get(state.editShare, 'record.objectName') === object.objectName) {
        state.editShare.record.visibility = visibility;
      }
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
      const info = state.objectsInfo[path];
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
    setEditCreate(state, { payload }: PayloadAction<boolean>) {
      state.editCreate = payload;
    },
    setEditDetail(state, { payload }: PayloadAction<ObjectItem>) {
      state.editDetail = payload;
    },
    setEditDelete(state, { payload }: PayloadAction<ObjectItem>) {
      state.editDelete = payload;
    },
    setStatusDetail(state, { payload }: PayloadAction<TStatusDetail>) {
      state.statusDetail = payload;
    },
    setEditUploadStatus(state, { payload }: PayloadAction<boolean>) {
      state.editUpload.isOpen = payload;
    },
    setEditUpload(state, { payload }: PayloadAction<TEditUploadContent>) {
      state.editUpload = {
        ...state.editUpload,
        ...payload,
      };
    },
    setEditCancel(state, { payload }: PayloadAction<ObjectItem>) {
      state.editCancel = payload;
    },
    setEditShare(state, { payload }: PayloadAction<{ record: ObjectItem; from: string }>) {
      const { record, from } = payload;
      state.editShare = {
        record,
        from,
      };
    },
    setEditDownload(state, { payload }: PayloadAction<ObjectItem & { action?: ObjectActionType }>) {
      state.editDownload = payload;
    },
    setObjectList(state, { payload }: PayloadAction<{ path: string; list: GfSPListObjectsByBucketNameResponse }>) {
      const { path, list } = payload;
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


      const objects = list.Objects
        .map((i) => {
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
          return !i.objectName.endsWith('/') && !i.removed
        })
        .filter((o) => {
          const path = [bucketName, o.objectName].join('/');
          const ts = state.deletedObjects[path];
          return !ts || ts < getMillisecond(o.createAt);
        });

      // TODO
      state.objects[path] = folders.concat(objects as any[]);
    },
    setListRefreshing(state, { payload }: PayloadAction<boolean>) {
      state.refreshing = payload;
    },
  },
});

export const _getAllList = async (
  params: TListObjects,
): Promise<[GfSPListObjectsByBucketNameResponse, null] | ErrorResponse> => {
  const [res, error] = await getListObjects(params);
  if (error || !res || res.code !== 0) return [null, String(error || res?.message)];
  const data = res.body!;
  const list = data.GfSpListObjectsByBucketNameResponse;
  const token = list.NextContinuationToken;
  if (token) {
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
    return [_res, null];
  }
  return [list, null];
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
    const [res, error] = await _getAllList(payload);
    if (!res || error) {
      toast.error({ description: error });
      return;
    }

    dispatch(setObjectList({ path: _path || path, list: res! }));
    dispatch(setRestoreCurrent(true));
    if (!restoreCurrent) {
      dispatch(setCurrentObjectPage({ path, current: 0 }));
    }
  };

export const closeStatusDetail = () => async (dispatch: AppDispatch) => {
  dispatch(setStatusDetail({} as TStatusDetail));
};
export const selectPathLoading = (root: AppState) => {
  const { objects, path, refreshing } = root.object;
  return !(path in objects) || refreshing;
};

export const selectPathCurrent = (root: AppState) => {
  const { currentPage, path } = root.object;
  return currentPage[path] || 0;
};

export const selectPayLockFeeAccount = (root: AppState) => {
  const { bucketInfo } = root.bucket;
  const { bucketName } = root.object;
  const { PaymentAddress } = bucketInfo[bucketName] || {};
  const { accountsInfo } = root.accounts;
  return accountsInfo[PaymentAddress];
}
const defaultObjectList = Array<string>();
export const selectObjectList = (root: AppState) => {
  const { objects, path } = root.object;
  return objects[path] || defaultObjectList;
};

export const {
  setFolders,
  setCurrentObjectPage,
  setObjectList,
  setRestoreCurrent,
  setEditDetail,
  setEditDelete,
  setEditCreate,
  setEditDownload,
  setStatusDetail,
  setEditShare,
  setEditUpload,
  setEditUploadStatus,
  setEditCancel,
  updateObjectStatus,
  setDummyFolder,
  updateObjectVisibility,
  addDeletedObject,
  setListRefreshing,
  setSelectedRowKeys,
} = objectSlice.actions;

export default objectSlice.reducer;
