import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BnbPriceInfo, getBnbPrice, getDefaultBnbInfo } from '@/facade/common';
import { AppDispatch, AppState, GetState } from '@/store';
import { QueryMsgGasParamsResponse } from '@bnb-chain/greenfield-cosmos-types/cosmos/gashub/v1beta1/query';
import { find, keyBy } from 'lodash-es';
import { setupListObjects, updateObjectStatus } from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { Long, MsgGrantAllowanceTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { getStoreFeeParams } from '@/facade/payment';
import { getClient } from '@/facade';
import { AuthPostAction } from '@/context/off-chain-auth/OffChainAuthContext';

export type TGasList = {
  [msgTypeUrl: string]: {
    gasLimit: number;
    msgTypeUrl: string;
    gasFee: number;
    perItemFee: number;
  };
};

type TGas = {
  gasPrice: string;
  gasObjects: TGasList;
};

export type TStoreFeeParams = {
  readPrice: string;
  primarySpStorePrice: string;
  secondarySpStorePrice: string;
  validatorTaxRate: string;
  minChargeSize: number;
  redundantDataChunkNum: number;
  redundantParityChunkNum: number;
  reserveTime: string;
};

export type TFileStatus = 'CHECK' | 'WAIT' | 'ERROR';

export type TUploadStatus =
  | 'WAIT'
  | 'HASH'
  | 'HASHED'
  | 'SIGN'
  | 'SIGNED'
  | 'UPLOAD'
  | 'SEAL'
  | 'FINISH'
  | 'ERROR'
  | 'CANCEL';

export type TTmpAccount = {
  address: string;
  privateKey: string;
};

export type WaitFile = {
  file: File;
  status: TFileStatus;
  id: number;
  time: number;
  msg: string;
  type: string;
  size: number;
  name: string;
  lockFee?: string;
  relativePath: string;
};

export type UploadFile = {
  bucketName: string;
  prefixFolders: string[];
  id: number;
  spAddress: string;
  waitFile: WaitFile;
  checksum: string[];
  status: TUploadStatus;
  visibility: VisibilityType;
  createHash: string;
  msg: string;
  progress: number;
};

export interface GlobalState {
  bnb: BnbPriceInfo;
  gasHub: TGas;
  isLoadingPLF: boolean;
  // Global data, different times may have different values
  storeFeeParams: TStoreFeeParams;
  mainnetStoreFeeParams: TStoreFeeParams;
  waitQueue: WaitFile[];
  uploadQueue: Record<string, UploadFile[]>;
  taskManagement: boolean;
  tmpAccount: TTmpAccount;
  sealingTs: Record<string, number>;
  authModalOpen: [boolean, AuthPostAction];
  disconnectWallet: boolean;
  connectWallet: boolean;
}

export const GAS_PRICE = '0.000000005';
export const UPLOADING_STATUSES = ['WAIT', 'HASH', 'HASHED', 'SIGN', 'SIGNED', 'UPLOAD', 'SEAL'];
const initialState: GlobalState = {
  bnb: getDefaultBnbInfo(),
  gasHub: {
    gasPrice: GAS_PRICE,
    gasObjects: {},
  },
  storeFeeParams: {} as TStoreFeeParams,
  mainnetStoreFeeParams: {} as TStoreFeeParams,
  isLoadingPLF: false,
  waitQueue: [],
  uploadQueue: {},
  taskManagement: false,
  tmpAccount: {} as TTmpAccount,
  sealingTs: {},
  authModalOpen: [false, {} as AuthPostAction],
  disconnectWallet: false,
  connectWallet: false,
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setAuthModalOpen(state, { payload }: PayloadAction<[boolean, AuthPostAction]>) {
      state.authModalOpen = payload;
    },
    updateUploadProgress(
      state,
      { payload }: PayloadAction<{ account: string; id: number; progress: number }>,
    ) {
      const { account, progress, id } = payload;
      const task = find<UploadFile>(state.uploadQueue[account], (f) => f.id === id);
      if (!task) return;
      task.progress = progress;
      if (progress >= 100) {
        task.status = 'SEAL';
        state.sealingTs[task.id] = Date.now();
        // task.waitFile.file = {} as any;
      }
    },
    updateUploadStatus(
      state,
      { payload }: PayloadAction<{ account: string; ids: number[]; status: UploadFile['status'] }>,
    ) {
      const { account, ids, status } = payload;
      const queue = state.uploadQueue[account] || [];
      state.uploadQueue[account] = queue.map((q) => (ids.includes(q.id) ? { ...q, status } : q));
    },
    updateUploadChecksum(
      state,
      { payload }: PayloadAction<{ account: string; id: number; checksum: string[] }>,
    ) {
      const { account, id, checksum } = payload;
      const queues = state.uploadQueue;
      const queue = queues[account];
      const task = find<UploadFile>(queue, (t) => t.id === id);
      if (!task) return;
      task.status = task.status !== 'CANCEL' ? 'HASHED' : 'CANCEL';
      task.checksum = checksum;
      if (queue.length === 1) return;
    },
    updateUploadCreateHash(
      state,
      { payload }: PayloadAction<{ account: string; id: number; createHash: string }>,
    ) {
      const { account, id, createHash } = payload;
      const uploadQueue = state.uploadQueue[account] || _emptyUploadQueue;
      const task = find<UploadFile>(uploadQueue, (t) => t.id === id);
      if (!task) return;
      task.status = task.status !== 'CANCEL' ? 'SIGNED' : 'CANCEL';
      task.createHash = createHash;
      if (uploadQueue.length === 1) return;
    },
    updateWaitTaskMsg(state, { payload }: PayloadAction<{ id: number; msg: string }>) {
      const { id, msg } = payload;
      const task = find<WaitFile>(state.waitQueue, (t) => t.id === id);
      if (!task) return;
      task.status = 'ERROR';
      task.msg = msg;
    },
    updateUploadTaskMsg(
      state,
      { payload }: PayloadAction<{ account: string; id: number; msg: string }>,
    ) {
      const { id, msg } = payload;
      const task = find<UploadFile>(state.uploadQueue[payload.account], (t) => t.id === id);
      if (!task) return;
      task.status = 'ERROR';
      task.msg = msg;
    },
    updateWaitFileStatus(
      state,
      { payload }: PayloadAction<{ id: number; status: WaitFile['status'] }>,
    ) {
      const { id, status } = payload;
      const task = find<WaitFile>(state.waitQueue, (t) => t.id === id);
      if (!task) return;
      task.status = status;
    },
    addToWaitQueue(
      state,
      { payload }: PayloadAction<{ id: number; file: File; time: number; relativePath?: string }>,
    ) {
      // transfer item need _relativePath
      const { id, file, time, relativePath: _relativePath } = payload;
      // webkitRelativePath: 'xxx/xxx.png'
      const parts = (_relativePath ? _relativePath : file.webkitRelativePath)?.split('/');
      const relativePath = parts && parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      const task: WaitFile = {
        file,
        status: 'CHECK',
        id,
        time,
        msg: '',
        type: file.type,
        size: file.size,
        name: file.name,
        relativePath: file.name.endsWith('/') ? '' : relativePath,
        lockFee: '',
      };
      // rewrite exist object
      state.waitQueue = state.waitQueue.filter(
        (file) => file.name !== task.name || file.relativePath !== task.relativePath,
      );
      state.waitQueue.push(task);
    },
    resetWaitQueue(state) {
      state.waitQueue = [];
    },
    removeFromWaitQueue(state, { payload }: PayloadAction<{ id: number }>) {
      // 1. When deleting a file, check if the parent folder is empty. If it is, delete it and recursively delete empty parent folders; otherwise, no action is required.
      // 2. When deleting a folder, delete all subfolders and subfiles; And like delete a file to recursively delete empty parent folders.
      const { waitQueue } = state;
      // group by common path
      const waitQueueInfos: { [key: string]: WaitFile[] } = {};
      // quick get folder info
      const folderQueueInfos: { [key: string]: WaitFile } = {};
      waitQueue.forEach((t) => {
        const isFolder = t.name.endsWith('/');
        // add it to waitQueueInfos
        const commonPath = isFolder ? t.name : t.relativePath + '/';
        if (!waitQueueInfos[commonPath]) {
          waitQueueInfos[commonPath] = [];
        }
        if (!isFolder) {
          waitQueueInfos[commonPath].push(t);
        }

        // add it to folderQueueInfos
        if (isFolder) {
          folderQueueInfos[t.name] = t;
        }
      });

      const ids = [payload.id];
      const deleteObject = waitQueue.find((task) => task.id === payload.id);
      if (!deleteObject) return;
      const isFolder = deleteObject?.name.endsWith('/');
      if (isFolder) {
        const commonPath = deleteObject.name;
        const childIds = waitQueue
          .filter((t) => {
            if (t.name.endsWith('/')) {
              return t.name.startsWith(commonPath);
            }
            return (t.relativePath + '/').startsWith(commonPath);
          })
          .map((t) => t.id);
        ids.push(...childIds);
      }
      const deleteParent = (queue: WaitFile[], deleteObject?: WaitFile) => {
        if (!deleteObject) return;
        const isFolder = deleteObject.name.endsWith('/');
        const deletePath = isFolder ? deleteObject.name : deleteObject.relativePath + '/';
        // If there are other files in the parent folder, do not delete.
        if (waitQueueInfos[deletePath] || waitQueueInfos[deletePath].length > 2) {
          return;
        }
        ids.push(folderQueueInfos[deletePath].id);
        // file/folder => parentFolder is 1:1
        const newParentObject = queue.find((t: WaitFile) => {
          const isFolder = t.name.endsWith('/');
          return (
            isFolder &&
            deletePath.startsWith(t.name) &&
            deletePath.replace(new RegExp(t.name + '$'), '').split('/').length === 2
          );
        });
        deleteParent(queue, newParentObject);
      };
      deleteParent(waitQueue, deleteObject);
      state.waitQueue = state.waitQueue.filter((task) => !ids.includes(task.id));
    },
    addToUploadQueue(state, { payload }: PayloadAction<{ account: string; tasks: UploadFile[] }>) {
      const { account, tasks } = payload;
      const existTasks = state.uploadQueue[account] || [];
      state.uploadQueue[account] = [...existTasks, ...tasks];
    },
    setBnbInfo(state, { payload }: PayloadAction<BnbPriceInfo>) {
      state.bnb = payload;
    },
    setGasObjects(state, { payload }: PayloadAction<QueryMsgGasParamsResponse>) {
      const { gasPrice } = state.gasHub;
      const gasObjects = keyBy(
        payload.msgGasParams.map((item) => {
          let gasLimit = item.fixedType?.fixedGas.low || 0;
          let gasFee = +gasPrice * gasLimit;
          let perItemFee = 0;
          if (item.msgTypeUrl === MsgGrantAllowanceTypeUrl) {
            gasLimit = item.grantAllowanceType?.fixedGas.low || 0;
            gasFee = +gasPrice * gasLimit;
            perItemFee = (item.grantAllowanceType?.gasPerItem.low || 0) * +gasPrice;
          }

          return {
            msgTypeUrl: item.msgTypeUrl,
            gasLimit,
            gasFee,
            perItemFee,
          };
        }),
        'msgTypeUrl',
      );

      state.gasHub.gasObjects = gasObjects;
    },
    setTaskManagement(state, { payload }: PayloadAction<boolean>) {
      state.taskManagement = payload;
    },
    setStoreFeeParams(state, { payload }: PayloadAction<{ storeFeeParams: TStoreFeeParams }>) {
      state.storeFeeParams = payload.storeFeeParams;
    },
    setMainnetStoreFeeParams(
      state,
      { payload }: PayloadAction<{ storeFeeParams: TStoreFeeParams }>,
    ) {
      state.mainnetStoreFeeParams = payload.storeFeeParams;
    },
    setTmpAccount(state, { payload }: PayloadAction<TTmpAccount>) {
      state.tmpAccount = payload;
    },
    resetUploadQueue(state, { payload }: PayloadAction<{ loginAccount: string }>) {
      const { loginAccount } = payload;
      if (!loginAccount) return;
      let uploadQueue = state.uploadQueue?.[loginAccount];
      if (!uploadQueue) return;
      uploadQueue = uploadQueue
        .filter((task) => task.status !== 'WAIT')
        .map((task) => {
          if (['HASH', 'HASHED', 'SIGN', 'SIGNED'].includes(task.status)) {
            task.status = 'CANCEL';
            task.msg = 'Account switch or logout leads to cancellation of upload.';
          }
          return task;
        });
    },
    cancelUploadFolder(state, { payload }: PayloadAction<{ account: string; folderName: string }>) {
      const { account } = payload;
      if (!account) return;
      let uploadQueue = state.uploadQueue?.[account];
      if (!uploadQueue) return;
      uploadQueue = uploadQueue.map((task) => {
        const isFolder = task.waitFile.name.endsWith('/');
        // Only cancel subfolders and subfiles
        if (isFolder && payload.folderName === task.waitFile.name) {
          return task;
        }
        const commonPath = isFolder ? task.waitFile.name : task.waitFile.relativePath + '/';
        const isSubTask = commonPath.startsWith(payload.folderName);
        if (isSubTask) {
          task.status = 'CANCEL';
          task.msg = "The object's parent path failed to be created, please check.";
        }
        return task;
      });
    },
    cancelWaitUploadFolder(state, { payload }: PayloadAction<{ folderName: string }>) {
      const { folderName } = payload;
      if (!folderName) return;
      let waitQueue = state.waitQueue;
      if (!waitQueue) return;
      waitQueue = waitQueue.map((task) => {
        const isFolder = task.name.endsWith('/');
        // Only cancel subfolders and subfiles
        if (isFolder && folderName === task.name) {
          return task;
        }
        const commonPath = isFolder ? task.name : task.relativePath + '/';
        const isSubTask = commonPath.startsWith(folderName);
        if (isSubTask) {
          task.status = 'ERROR';
          task.msg = "The object's parent path failed to be created, please check.";
        }
        return task;
      });
    },
    setIsLoadingPLF(state, { payload }: PayloadAction<boolean>) {
      state.isLoadingPLF = payload;
    },
    setDisconnectWallet(state, { payload }: PayloadAction<boolean>) {
      state.disconnectWallet = payload;
    },
    setConnectWallet(state, { payload }: PayloadAction<boolean>) {
      state.connectWallet = payload;
    },
  },
});

export const {
  setBnbInfo,
  updateWaitFileStatus,
  addToWaitQueue,
  updateWaitTaskMsg,
  updateUploadTaskMsg,
  updateUploadChecksum,
  addToUploadQueue,
  updateUploadStatus,
  updateUploadProgress,
  setTaskManagement,
  removeFromWaitQueue,
  setTmpAccount,
  resetWaitQueue,
  resetUploadQueue,
  cancelUploadFolder,
  cancelWaitUploadFolder,
  setIsLoadingPLF,
  setAuthModalOpen,
  setDisconnectWallet,
  updateUploadCreateHash,
} = globalSlice.actions;

const _emptyUploadQueue = Array<UploadFile>();

export const selectUploadQueue = (address: string) => (root: AppState) => {
  return root.global.uploadQueue[address] || _emptyUploadQueue;
};

export const selectHashTask = (address: string) => (root: AppState) => {
  const uploadQueue = root.global.uploadQueue[address] || _emptyUploadQueue;
  const hashQueue = uploadQueue.filter((task) => task.status === 'HASH');
  const waitQueue = uploadQueue.filter((task) => task.status === 'WAIT');

  return !!hashQueue.length ? null : waitQueue[0] ? waitQueue[0] : null;
};

export const selectSignTask = (address: string) => (root: AppState) => {
  const uploadQueue = root.global.uploadQueue[address] || _emptyUploadQueue;

  const signQueue = uploadQueue.filter((task) => task.status === 'SIGN');
  const hashedQueue = uploadQueue.filter((task) => task.status === 'HASHED');

  return !!signQueue.length ? null : hashedQueue[0] ? hashedQueue[0] : null;
  // const folderInfos = keyBy(
  //   uploadQueue.filter((q) => q.waitFile.name.endsWith('/')),
  //   'name',
  // );
  // const hashedQueue = uploadQueue.filter((t) => {
  //    // 如果是文件夹，需要保证父文件夹先创建
  //    const isFolder = t.waitFile.name.endsWith('/');
  //    const parentFolder = isFolder
  //      ? t.waitFile.name.split('/').slice(0, -1).join('/') + '/'
  //      : t.waitFile.relativePath + '/';
  //    if (!folderInfos[parentFolder]) {
  //      return t.status === 'HASHED';
  //    }
  //    if (t.waitFile.relativePath && folderInfos[parentFolder]) {
  //      return folderInfos[parentFolder].status === 'FINISH' && t.status === 'HASHED';
  //    }
  // })
};

export const selectBnbPrice = (state: AppState) => state.global.bnb.price;

export const selectStoreFeeParams = (state: AppState) => state.global.storeFeeParams;

export const selectMainnetStoreFeeParams = (state: AppState) => state.global.mainnetStoreFeeParams;

export const selectHasUploadingTask = (state: AppState) => {
  const uploadQueue = state.global.uploadQueue[state.persist.loginAccount] || [];

  return uploadQueue.some((item) =>
    ['WAIT', 'HASH', 'HASHED', 'SIGN', 'SIGNED', 'UPLOAD', 'SEAL'].includes(item.status),
  );
};
export const setupBnbPrice = () => async (dispatch: AppDispatch) => {
  const res = await getBnbPrice();
  dispatch(setBnbInfo(res));
};

export const setupGasObjects = () => async (dispatch: AppDispatch) => {
  const client = await getClient();

  const res = await client.gashub.getMsgGasParams({
    msgTypeUrls: [],
    pagination: {
      countTotal: true,
      key: Uint8Array.from([]),
      limit: Long.fromInt(1000),
      offset: Long.fromInt(0),
      reverse: false,
    },
  });
  dispatch(globalSlice.actions.setGasObjects(res));
};

export const setupStoreFeeParams = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { isLoadingPLF } = getState().global;
  if (isLoadingPLF) return;
  dispatch(setIsLoadingPLF(true));
  const storeFeeParams = await getStoreFeeParams({});
  dispatch(
    globalSlice.actions.setStoreFeeParams({
      storeFeeParams,
    }),
  );
  dispatch(setIsLoadingPLF(false));
};

export const setupMainnetStoreFeeParams =
  () => async (dispatch: AppDispatch, getState: GetState) => {
    const storeFeeParams = await getStoreFeeParams({ network: 'mainnet' });
    dispatch(
      globalSlice.actions.setMainnetStoreFeeParams({
        storeFeeParams,
      }),
    );
  };

export const refreshTaskFolder =
  (task: UploadFile) => async (dispatch: AppDispatch, getState: GetState) => {
    const { spInfo } = getState().sp;
    const { loginAccount } = getState().persist;
    const primarySp = spInfo[task.spAddress];
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const query = new URLSearchParams();
    const params = {
      seedString,
      query,
      endpoint: primarySp.endpoint,
      bucketName: task.bucketName,
    };
    await dispatch(setupListObjects(params, [task.bucketName, ...task.prefixFolders].join('/')));
  };

export const uploadQueueAndRefresh =
  (task: UploadFile) => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    await dispatch(refreshTaskFolder(task));
    dispatch(updateUploadStatus({ ids: [task.id], status: 'FINISH', account: loginAccount }));
    // for setupListObjects ready
    setTimeout(() => {
      dispatch(
        updateObjectStatus({
          bucketName: task.bucketName,
          folders: task.prefixFolders,
          name: task.waitFile.name,
          objectStatus: 1,
        }),
      );
    });
  };

const fetchedList: Record<string, boolean> = {};

// ensure upload file in file list
export const progressFetchList =
  (task: UploadFile) => async (dispatch: AppDispatch, getState: GetState) => {
    if (fetchedList[task.id]) return;
    fetchedList[task.id] = true;
    await dispatch(refreshTaskFolder(task));
  };
export const addTasksToUploadQueue =
  (spAddress: string, visibility: VisibilityType) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { waitQueue } = getState().global;
    const { bucketName, folders } = getState().object;
    const { loginAccount } = getState().persist;
    const wQueue = waitQueue.filter((t) => t.status === 'WAIT');
    if (!wQueue || wQueue.length === 0) return;
    const newUploadQueue = wQueue.map((task) => {
      const uploadTask: UploadFile = {
        bucketName,
        prefixFolders: folders,
        spAddress,
        id: task.id,
        waitFile: task,
        msg: '',
        status: 'WAIT',
        progress: 0,
        checksum: [],
        visibility,
        createHash: '',
      };
      return uploadTask;
    });
    dispatch(addToUploadQueue({ account: loginAccount, tasks: newUploadQueue }));
  };

export const addSignedTasksToUploadQueue =
  ({
    spAddress,
    visibility,
    checksums,
    waitFile,
    createHash,
  }: {
    spAddress: string;
    visibility: VisibilityType;
    checksums: string[];
    waitFile: WaitFile;
    createHash: string;
  }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { bucketName, folders } = getState().object;
    const { loginAccount } = getState().persist;

    const newUploadQueue: UploadFile = {
      bucketName,
      prefixFolders: folders,
      spAddress,
      id: waitFile.id,
      waitFile: waitFile,
      msg: '',
      status: 'SIGNED',
      progress: 0,
      checksum: checksums,
      visibility,
      createHash,
    };
    dispatch(addToUploadQueue({ account: loginAccount, tasks: [newUploadQueue] }));
  };

export const setupUploadTaskErrorMsg =
  ({ account, task, errorMsg }: { account: string; task: UploadFile; errorMsg: string }) =>
  async (dispatch: AppDispatch) => {
    const isFolder = task.waitFile.name.endsWith('/');
    dispatch(
      updateUploadTaskMsg({
        account,
        id: task.id,
        msg: errorMsg || 'The object failed to be created.',
      }),
    );
    isFolder && dispatch(cancelUploadFolder({ account, folderName: task.waitFile.name }));
  };

export const setupWaitTaskErrorMsg =
  ({ id, errorMsg }: { id: number; errorMsg: string }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { waitQueue } = getState().global;
    const task = waitQueue.find((t) => t.id === id);
    if (!task) return;
    const isFolder = task.name.endsWith('/');
    dispatch(updateWaitTaskMsg({ id: id, msg: errorMsg || 'The object failed to be created.' }));
    isFolder && dispatch(cancelWaitUploadFolder({ folderName: task.name }));
  };

export default globalSlice.reducer;
