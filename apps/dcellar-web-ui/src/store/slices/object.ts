import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getListObjects, IObjectList, ListObjectsParams } from '@/facade/object';
import { toast } from '@totejs/uikit';
import { find, last, omit, trimEnd } from 'lodash-es';
import { IObjectResponse, TListObjects } from '@bnb-chain/greenfield-chain-sdk';
import { ErrorResponse } from '@/facade/error';

export const SINGLE_OBJECT_MAX_SIZE = 128 * 1024 * 1024;
export const SELECT_OBJECT_NUM_LIMIT = 10;

export type ObjectItem = {
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
}
export type TEditUpload = TEditUploadContent & { isOpen: boolean; }
export interface ObjectState {
  bucketName: string;
  folders: string[];
  prefix: string;
  path: string;
  objects: Record<string, ObjectItem[]>;
  objectsMeta: Record<string, Omit<IObjectList, 'objects' | 'common_prefixes'>>;
  objectsInfo: Record<string, IObjectResponse>;
  currentPage: Record<string, number>;
  restoreCurrent: boolean;
  editDetail: ObjectItem;
  editDelete: ObjectItem;
  editCreate: boolean;
  editDownload: ObjectItem & { action?: ObjectActionType };
  editShare: ObjectItem;
  editCancel: ObjectItem;
  statusDetail: TStatusDetail;
  editUpload: TEditUpload;
  deletedObjects: Record<string, number>;
  refreshing: boolean;
}

const initialState: ObjectState = {
  bucketName: '',
  folders: [],
  prefix: '',
  path: '',
  objects: {},
  objectsMeta: {},
  objectsInfo: {},
  currentPage: {},
  restoreCurrent: true,
  editDetail: {} as ObjectItem,
  editDelete: {} as ObjectItem,
  editCreate: false,
  editDownload: {} as ObjectItem & { action?: ObjectActionType },
  editShare: {} as ObjectItem,
  editCancel: {} as ObjectItem,
  statusDetail: {} as TStatusDetail,
  editUpload: {} as TEditUpload,
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
      if (!item) return;
      item.visibility = visibility;
      const info = state.objectsInfo[[state.bucketName, item.objectName].join('/')];
      if (!info) return;
      info.object_info.visibility = visibility;
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
      info.object_info.object_status = objectStatus as any; // number
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
        ...payload
      };
    },
    setEditCancel(state, { payload }: PayloadAction<ObjectItem>) {
      state.editCancel = payload;
    },
    setEditShare(state, { payload }: PayloadAction<ObjectItem>) {
      state.editShare = payload;
    },
    setEditDownload(state, { payload }: PayloadAction<ObjectItem & { action?: ObjectActionType }>) {
      state.editDownload = payload;
    },
    setObjectList(state, { payload }: PayloadAction<{ path: string; list: IObjectList }>) {
      const { path, list } = payload;
      const [bucketName] = path.split('/');
      // keep order
      const folders = list.common_prefixes
        .reverse()
        .map((i, index) => ({
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

      const objects = list.objects
        .map((i) => {
          const {
            bucket_name,
            object_name,
            object_status,
            create_at,
            payload_size,
            visibility,
            content_type,
          } = i.object_info;

          const path = [bucket_name, object_name].join('/');
          state.objectsInfo[path] = i;

          return {
            objectName: object_name,
            name: last(object_name.split('/'))!,
            payloadSize: Number(payload_size),
            createAt: Number(create_at),
            contentType: content_type,
            folder: false,
            objectStatus: Number(object_status),
            visibility,
            removed: i.removed,
          };
        })
        .filter((i) => !i.objectName.endsWith('/') && !i.removed)
        .filter((o) => {
          const path = [bucketName, o.objectName].join('/');
          const ts = state.deletedObjects[path];
          return !ts || ts < o.createAt;
        });

      state.objectsMeta[path] = omit(list, ['objects', 'common_prefixes']);
      state.objects[path] = folders.concat(objects as ObjectItem[]);
    },
    setListRefreshing(state, { payload }: PayloadAction<boolean>) {
      state.refreshing = payload;
    }
  },
});

export const _getAllList = async (
  params: TListObjects,
): Promise<[IObjectList, null] | ErrorResponse> => {
  const [res, error] = await getListObjects(params);
  if (error || !res || res.code !== 0) return [null, String(error || res?.message)];
  const list = res.body!;
  const token = list.next_continuation_token;
  if (token) {
    params.query?.set('continuation-token', token);
    const [res, error] = await _getAllList(params);
    if (error) return [null, error];
    const newList = res!;
    const _res: IObjectList = {
      ...list,
      ...newList,
      common_prefixes: list.common_prefixes.concat(newList.common_prefixes),
      key_count: String(Number(list.key_count) + Number(newList.key_count)),
      objects: list.objects.concat(newList.objects),
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
      if (error) {
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
} = objectSlice.actions;

export default objectSlice.reducer;
