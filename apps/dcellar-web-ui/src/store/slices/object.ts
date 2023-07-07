import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getListObjects, IObjectList, ListObjectsParams } from '@/facade/object';
import { toast } from '@totejs/uikit';
import { last, omit, trimEnd } from 'lodash-es';
import { IObjectProps } from '@bnb-chain/greenfield-chain-sdk';
import { ErrorResponse } from '@/facade/error';
import { SpItem } from './sp';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { THashResult } from '@/modules/checksum/checksumWorkerV2';

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
export type TLayerAction = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpen: () => void;
}

export type TStatusDetail = {
  icon: string;
  title: string;
  description?: string;
  buttonText?: string;
  errorText?: string;
  buttonOnClick?: () => void;
}

export type TFileItem = {
  name: string;
  size: string;
  type: string;
  calHash?: THashResult;
  status: 'WAIT_CHECKING' | 'WAIT_UPLOAD' | 'UPLOADING' | 'UPLOAD_SUCCESS' | 'UPLOAD_FAIL';
  errorMsg?: string;
  txnHash?: string;
};

export type TEditUpload = {
  isOpen: boolean;
  fileInfos: TFileItem[];
  maxSize: number;
  visibility: VisibilityType;
}
export type TUploading =  {
  isOpen: boolean;
  isLoading: boolean;
  fileInfos: TFileItem[];
  visibility: VisibilityType;
}
export interface ObjectState {
  bucketName: string;
  folders: string[];
  prefix: string;
  path: string;
  objects: Record<string, ObjectItem[]>;
  objectsMeta: Record<string, Omit<IObjectList, 'objects' | 'common_prefixes'>>;
  objectsInfo: Record<string, IObjectProps>;
  currentPage: Record<string, number>;
  restoreCurrent: boolean;
  editDetail: ObjectItem;
  editDelete: ObjectItem;
  editCreate: boolean;
  editDownload: ObjectItem;
  editShare: ObjectItem;
  editCancel: ObjectItem;
  primarySp: SpItem;
  statusDetail: TStatusDetail;
  files: File[];
  editUpload: TEditUpload;
  uploading: TUploading;
}

const initialState: ObjectState = {
  bucketName: '',
  folders: [],
  prefix: '',
  path: '',
  objects: {},
  // todo fixit, folder has default folder object
  objectsMeta: {},
  objectsInfo: {},
  currentPage: {},
  restoreCurrent: true,
  editDetail: {} as ObjectItem,
  editDelete: {} as ObjectItem,
  editCreate: false,
  editDownload: {} as ObjectItem,
  editShare: {} as ObjectItem,
  editCancel: {} as ObjectItem,
  statusDetail: {} as TStatusDetail,
  primarySp: {} as SpItem,
  files: [],
  editUpload: {
    isOpen: false,
    maxSize: 5 * 1024 * 1024,
    visibility: 'VISIBILITY_TYPE_PRIVATE',
    fileInfos: [],
  },
  uploading: {
    visibility: 'VISIBILITY_TYPE_PRIVATE',
    isOpen: false,
    fileInfos: [],
    isLoading: false,
  }
};

export const objectSlice = createSlice({
  name: 'object',
  initialState,
  reducers: {
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
    setPrimarySp(state, { payload }: PayloadAction<SpItem>) {
      state.primarySp = payload;
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
    setFiles(state, { payload }: PayloadAction<File[]>) {
      state.files = payload;
    },
    setEditUpload(state, { payload }: PayloadAction<Partial<TEditUpload>>) {
      state.editUpload = {...state.editUpload, ...payload};
    },
    setEditCancel(state, { payload }: PayloadAction<ObjectItem>) {
      state.editCancel = payload;
    },
    setUploading(state, { payload }: PayloadAction<Partial<TUploading>>) {
      state.uploading = {
        ...state.uploading,
        ...payload
      };
    },
    setEditShare(state, { payload }: PayloadAction<ObjectItem>) {
      state.editShare = payload;
    },
    setEditDownload(state, { payload }: PayloadAction<ObjectItem>) {
      state.editDownload = payload;
    },
    setObjectList(state, { payload }: PayloadAction<{ path: string; list: IObjectList }>) {
      const { path, list } = payload;
      const folders = list.common_prefixes.map((i) => ({
        objectName: i,
        name: last(trimEnd(i, '/').split('/'))!,
        payloadSize: 0,
        createAt: Date.now(),
        contentType: '',
        folder: true,
        visibility: 3,
        objectStatus: 1,
        removed: false,
      }));

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
        .filter((i) => !i.objectName.endsWith('/') && !i.removed);

      state.objectsMeta[path] = omit(list, ['objects', 'common_prefixes']);
      state.objects[path] = folders.concat(objects);
    },
  },
});

const _getAllList = async (
  params: ListObjectsParams,
): Promise<[IObjectList, null] | ErrorResponse> => {
  const [res, error] = await getListObjects(params);
  if (error || !res || res.code !== 0) return [null, String(error || res?.message)];
  const list = res.body!;
  const token = list.next_continuation_token;
  if (token) {
    params.query.set('continuation-token', token);
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

export const setupListObjects =
  (params: Partial<ListObjectsParams>, _path?: string) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { prefix, bucketName, path, restoreCurrent } = getState().object;
    const { loginAccount: address } = getState().persist;
    dispatch(setRestoreCurrent(true));
    if (!restoreCurrent) {
      dispatch(setCurrentObjectPage({ path, current: 0 }));
    }
    const _query = new URLSearchParams(params.query?.toString() || '');
    _query.append('max-keys', '1000');
    _query.append('delimiter', '/');
    if (prefix) _query.append('prefix', prefix);
    // support any path list objects, bucketName & _path
    const payload = { bucketName, ...params, query: _query, address } as ListObjectsParams;
    const [res, error] = await _getAllList(payload);
    if (error) {
      toast.error({ description: error });
      return;
    }
    dispatch(setObjectList({ path: _path || path, list: res! }));
  };
export const closeStatusDetail = () => async (dispatch: AppDispatch) => {
  dispatch(setStatusDetail({} as TStatusDetail));
}
export const selectPathLoading = (root: AppState) => {
  const { objects, path } = root.object;
  return !(path in objects);
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
  setPrimarySp,
  setStatusDetail,
  setFiles,
  setEditShare,
  setEditUpload,
  setEditCancel,
  setUploading,
} = objectSlice.actions;

export default objectSlice.reducer;
