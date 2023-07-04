import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getListObjects, IObjectList, ListObjectsParams } from '@/facade/object';
import { toast } from '@totejs/uikit';
import { last, omit, trimEnd } from 'lodash-es';
import { IObjectProps } from '@bnb-chain/greenfield-chain-sdk';
import { ErrorResponse } from '@/facade/error';

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

export interface ObjectState {
  bucketName: string;
  folders: string[];
  prefix: string;
  path: string;
  objects: Record<string, ObjectItem[]>;
  objectsMeta: Record<string, Omit<IObjectList, 'objects' | 'common_prefixes'>>;
  objectsInfo: Record<string, IObjectProps>;
  currentPage: Record<string, number>;
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
};

export const objectSlice = createSlice({
  name: 'object',
  initialState,
  reducers: {
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
  (params: Partial<ListObjectsParams>) => async (dispatch: AppDispatch, getState: GetState) => {
    const { prefix, bucketName, path } = getState().object;
    const { loginAccount: address } = getState().persist;
    const _query = new URLSearchParams(params.query?.toString() || '');
    _query.append('max-keys', '1000');
    _query.append('delimiter', '/');
    if (prefix) _query.append('prefix', prefix);
    const payload = { ...params, query: _query, bucketName, address } as ListObjectsParams;
    const [res, error] = await _getAllList(payload);
    if (error) {
      toast.error({ description: error });
      return;
    }
    dispatch(setObjectList({ path, list: res! }));
  };

export const selectPathLoading = (root: AppState) => {
  const { bucketName, folders, objects } = root.object;
  const path = [bucketName, ...folders].join('/');
  return !(path in objects);
};

export const selectPathCurrent = (root: AppState) => {
  const { bucketName, folders, currentPage } = root.object;
  const path = [bucketName, ...folders].join('/');
  return currentPage[path] || 0;
};

const defaultObjectList = Array<string>();
export const selectObjectList = (root: AppState) => {
  const { bucketName, folders, objects } = root.object;
  const path = [bucketName, ...folders].join('/');
  return objects[path] || defaultObjectList;
};

export const { setFolders, setCurrentObjectPage, setObjectList } = objectSlice.actions;

export default objectSlice.reducer;
