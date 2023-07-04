import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getListObjects, IObjectList, ListObjectsParams } from '@/facade/object';
import { toast } from '@totejs/uikit';
import { last, omit, trimEnd } from 'lodash-es';
import { IObjectProps } from '@bnb-chain/greenfield-chain-sdk';

export type ObjectItem = {
  objectName: string;
  name: string;
  payloadSize: number;
  createAt: number;
  contentType: string;
  folder: boolean;
  visibility: number;
  objectStatus: number;
};

export interface ObjectState {
  bucketName: string;
  folders: string[];
  prefix: string;
  objects: Record<string, ObjectItem[]>;
  objectsMeta: Record<string, Omit<IObjectList, 'objects' | 'common_prefixes'>>;
  objectsInfo: Record<string, IObjectProps>;
  currentPage: number;
}

const initialState: ObjectState = {
  bucketName: '',
  folders: [],
  prefix: '',
  objects: {},
  // todo fixit, folder has default folder object
  objectsMeta: {},
  objectsInfo: {},
  currentPage: 0,
};

export const objectSlice = createSlice({
  name: 'object',
  initialState,
  reducers: {
    setCurrentObjectPage(state, { payload }: PayloadAction<number>) {
      state.currentPage = payload;
    },
    setFolders(state, { payload }: PayloadAction<{ bucketName: string; folders: string[] }>) {
      const { bucketName, folders } = payload;
      state.bucketName = bucketName;
      state.folders = folders;
      state.prefix = !folders.length ? '' : folders.join('/') + '/';
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
        visibility: 1,
        objectStatus: 1,
      }));

      const objects = list.objects
        // todo fixit, folder has default folder object
        .filter((i) => !i.object_info.object_name.endsWith('/'))
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
          };
        });

      state.objectsMeta[path] = omit(list, ['objects', 'common_prefixes']);
      state.objects[path] = folders.concat(objects);
    },
  },
});

export const setupListObjects =
  (params: Partial<ListObjectsParams>) => async (dispatch: AppDispatch, getState: GetState) => {
    const { prefix, bucketName, folders } = getState().object;
    const { loginAccount: address } = getState().persist;
    const _query = new URLSearchParams(params.query?.toString() || '');
    _query.append('max-keys', '1000');
    _query.append('delimiter', '/');
    if (prefix) _query.append('prefix', prefix);
    const payload = { ...params, query: _query, bucketName, address } as ListObjectsParams;
    const [res, error] = await getListObjects(payload);
    if (error || !res || res.code !== 0) {
      toast.error({ description: error || res?.message });
      return;
    }
    const path = [bucketName, ...folders].join('/');
    dispatch(setObjectList({ path, list: res.body! }));
  };

export const selectPathLoading = (root: AppState) => {
  const { bucketName, folders, objects } = root.object;
  const path = [bucketName, ...folders].join('/');
  return !(path in objects);
};

const defaultObjectList = Array<string>();
export const selectObjectList = (root: AppState) => {
  const { bucketName, folders, objects } = root.object;
  const path = [bucketName, ...folders].join('/');
  return objects[path] || defaultObjectList;
};

export const { setFolders, setCurrentObjectPage, setObjectList } = objectSlice.actions;

export default objectSlice.reducer;
