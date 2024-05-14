import { QueryMsgGasParamsResponse } from '@bnb-chain/greenfield-cosmos-types/cosmos/gashub/v1beta1/query';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { Long, MsgGrantAllowanceTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { find, keyBy } from 'lodash-es';

import { AuthPostAction } from '@/context/off-chain-auth/OffChainAuthContext';
import { getClient } from '@/facade';
import { getBnbUsdtExchangeRate } from '@/facade/common';
import { getStoreFeeParams } from '@/facade/payment';
import { AppDispatch, AppState, GetState } from '@/store';
import { setObjectStatus, setupListObjects } from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { waitUploadFilterFn } from '@/utils/object';

export const GAS_PRICE = '0.000000005';
export const BNB_USDT_EXCHANGE_RATE = '350';
export const UPLOADING_STATUSES = [
  'WAIT',
  'HASH',
  'HASHED',
  'SIGN',
  'SIGNED',
  'UPLOAD',
  'SEAL',
  'SEALING',
];
export const UPLOAD_FAILED_STATUSES = ['ERROR', 'CANCEL'];
export const UPLOAD_SUCCESS_STATUS = 'FINISH';

export type SignatureAction = {
  icon: string;
  title: string;
  desc?: string;
  buttonText?: string;
  errorText?: string;
  buttonOnClick?: () => void;
  extraParams?: Array<string | number>;
};

export type GasFeesConfig = {
  [msgTypeUrl: string]: {
    gasLimit: number;
    msgTypeUrl: string;
    gasFee: number;
    perItemFee: number;
  };
};

export type StoreFeeParams = {
  readPrice: string;
  primarySpStorePrice: string;
  secondarySpStorePrice: string;
  validatorTaxRate: string;
  minChargeSize: number;
  redundantDataChunkNum: number;
  redundantParityChunkNum: number;
  reserveTime: string;
};

export type WaitObjectStatus = 'CHECK' | 'WAIT' | 'ERROR';

export type UploadObjectStatus =
  | 'RETRY_CHECK'
  | 'RETRY_CHECKING'
  | 'WAIT'
  | 'HASH'
  | 'HASHED'
  | 'SIGN'
  | 'SIGNED'
  | 'UPLOAD'
  | 'SEAL'
  | 'SEALING'
  | 'FINISH'
  | 'ERROR'
  | 'CANCEL';

export type WaitObject = {
  file: File;
  status: WaitObjectStatus;
  id: number;
  time: number;
  msg: string;
  type: string;
  size: number;
  name: string;
  lockFee?: string;
  relativePath: string;
  isUpdate?: boolean;
};

export type UploadObject = {
  bucketName: string;
  tempAccountAddress?: string;
  prefixFolders: string[];
  id: number;
  spAddress: string;
  waitObject: WaitObject;
  checksum: string[];
  status: UploadObjectStatus;
  visibility: VisibilityType;
  tags?: ResourceTags_Tag[];
  createHash: string;
  msg: string;
  progress: number;
  delegateUpload?: boolean;
  abortController?: AbortController;
};

export interface GlobalState {
  bnbUsdtExchangeRate: string;
  gnfdGasPrice: string;
  gnfdGasFeesConfig: GasFeesConfig;
  isFetchingStoreFeeParams: boolean;
  storeFeeParams: StoreFeeParams;
  mainnetStoreFeeParams: StoreFeeParams;
  objectWaitQueue: WaitObject[];
  objectUploadQueue: Record<string, UploadObject[]>;
  globalTaskManagementOpen: boolean;
  objectSealingTimestamp: Record<string, number>;
  offchainAuthOpen: [boolean, AuthPostAction];
  walletDisconnected: boolean;
  walletConnected: boolean;
  signatureAction: SignatureAction | object;
}

const defaultStoreFeeParams: StoreFeeParams = {
  readPrice: '0',
  primarySpStorePrice: '0',
  secondarySpStorePrice: '0',
  validatorTaxRate: '0',
  minChargeSize: 0,
  redundantDataChunkNum: 0,
  redundantParityChunkNum: 0,
  reserveTime: '0',
};
const defaultAuthPostAction: AuthPostAction = {
  action: '',
  params: {},
};
const initialState: GlobalState = {
  bnbUsdtExchangeRate: BNB_USDT_EXCHANGE_RATE,
  gnfdGasPrice: GAS_PRICE,
  gnfdGasFeesConfig: {},
  storeFeeParams: defaultStoreFeeParams,
  mainnetStoreFeeParams: defaultStoreFeeParams,
  isFetchingStoreFeeParams: false,
  objectWaitQueue: [],
  objectUploadQueue: {},
  globalTaskManagementOpen: false,
  objectSealingTimestamp: {},
  offchainAuthOpen: [false, defaultAuthPostAction],
  walletDisconnected: false,
  walletConnected: false,
  signatureAction: {},
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setAuthModalOpen(state, { payload }: PayloadAction<[boolean, AuthPostAction]>) {
      state.offchainAuthOpen = payload;
    },
    updateUploadProgress(
      state,
      { payload }: PayloadAction<{ account: string; id: number; progress: number }>,
    ) {
      const { account, progress, id } = payload;
      const task = find<UploadObject>(state.objectUploadQueue[account], (f) => f.id === id);
      if (!task) return;
      task.progress = progress;
    },
    updateUploadStatus(
      state,
      {
        payload,
      }: PayloadAction<{
        account: string;
        ids: number[];
        status: UploadObject['status'];
        extraFields?: Record<string, Partial<UploadObject>>;
      }>,
    ) {
      const { account, ids, status, extraFields } = payload;
      const isErrorStatus = UPLOAD_FAILED_STATUSES.includes(status);
      const queue = state.objectUploadQueue[account] || [];
      state.objectUploadQueue[account] = queue.map((item) => {
        if (ids.includes(item.id)) {
          const updatedItem = { ...item, ...extraFields?.[item.id], status };

          if (status === 'RETRY_CHECK') {
            return { ...updatedItem, msg: '', progress: 0 };
          }
          if (isErrorStatus) {
            return { ...updatedItem, msg: item.msg };
          }

          return updatedItem;
        }

        return item;
      });

      if (status === 'SEAL') {
        ids.forEach((id) => {
          state.objectSealingTimestamp[id] = Date.now();
        });
      }
    },
    updateUploadChecksum(
      state,
      { payload }: PayloadAction<{ account: string; id: number; checksum: string[] }>,
    ) {
      const { account, id, checksum } = payload;
      const queues = state.objectUploadQueue;
      const queue = queues[account];
      const task = find<UploadObject>(queue, (t) => t.id === id);
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
      const uploadQueue = state.objectUploadQueue[account] || _emptyUploadQueue;
      const task = find<UploadObject>(uploadQueue, (t) => t.id === id);
      if (!task) return;
      task.status = task.status !== 'CANCEL' ? 'SIGNED' : 'CANCEL';
      task.createHash = createHash;
      if (uploadQueue.length === 1) return;
    },
    updateWaitTaskMsg(state, { payload }: PayloadAction<{ id: number; msg: string }>) {
      const { id, msg } = payload;
      const task = find<WaitObject>(state.objectWaitQueue, (t) => t.id === id);
      if (!task) return;
      task.status = 'ERROR';
      task.msg = msg;
    },
    updateUploadTaskErrorMsg(
      state,
      {
        payload,
      }: PayloadAction<{ account: string; id: number; msg: string; status?: UploadObjectStatus }>,
    ) {
      const { id, msg, status } = payload;
      const task = find<UploadObject>(state.objectUploadQueue[payload.account], (t) => t.id === id);
      if (!task) return;
      task.status = status ?? 'ERROR';
      task.msg = msg;
    },
    updateWaitObjectStatus(
      state,
      { payload }: PayloadAction<{ id: number; status: WaitObject['status'] }>,
    ) {
      const { id, status } = payload;
      const task = find<WaitObject>(state.objectWaitQueue, (t) => t.id === id);
      if (!task) return;
      task.status = status;
    },
    setWaitQueue(state, { payload }: PayloadAction<WaitObject[]>) {
      state.objectWaitQueue = payload;
    },
    resetWaitQueue(state) {
      state.objectWaitQueue = [];
    },
    removeFromWaitQueue(state, { payload }: PayloadAction<{ id: number }>) {
      // 1. When deleting a file, check if the parent folder is empty, delete it and recursively delete empty parent folders
      // 2. When deleting a folder, delete all subfolders and subfiles first; And like delete a file to recursively delete empty parent folders.
      const { objectWaitQueue } = state;

      const ids = [payload.id];
      const deleteObject = objectWaitQueue.find((task) => task.id === payload.id);
      if (!deleteObject) return;

      const isFolder = deleteObject?.name.endsWith('/');
      if (isFolder) {
        const prefix = deleteObject.name;
        const childIds = objectWaitQueue
          .filter((t) => {
            if (t.name.endsWith('/')) {
              return t.name.startsWith(prefix);
            }
            return (t.relativePath + '/').startsWith(prefix);
          })
          .map((t) => t.id);
        ids.push(...childIds);
      }

      const deleteParent = (deleteObject: WaitObject) => {
        if (!deleteObject) return;
        ids.push(deleteObject.id);

        const parentPath = deleteObject.name.endsWith('/')
          ? deleteObject.name.split('/').slice(0, -2).join('/') + '/'
          : deleteObject.relativePath + '/';
        if (parentPath === '/') return;

        const parentFolderHasMultiObjects = objectWaitQueue.filter((item) => {
          return (
            item.id !== deleteObject.id &&
            ((item.name.endsWith('/') && item.name === parentPath) ||
              item.relativePath + '/' === parentPath)
          );
        });

        if (parentFolderHasMultiObjects.length > 1) return;

        deleteParent(parentFolderHasMultiObjects[0]);
      };

      deleteParent(deleteObject);
      state.objectWaitQueue = state.objectWaitQueue.filter((task) => !new Set(ids).has(task.id));
    },
    toggleObjectReplaceState(state, { payload }: PayloadAction<{ id: number }>) {
      const { id } = payload;
      const task = find<WaitObject>(state.objectWaitQueue, (t) => t.id === id);
      if (!task) return;
      task.isUpdate = !task.isUpdate;
    },
    addToUploadQueue(
      state,
      { payload }: PayloadAction<{ account: string; tasks: UploadObject[] }>,
    ) {
      const { account, tasks } = payload;
      const existTasks = state.objectUploadQueue[account] || [];
      state.objectUploadQueue[account] = [...existTasks, ...tasks];
    },
    setBnbUsdtExchangeRate(state, { payload }: PayloadAction<string>) {
      state.bnbUsdtExchangeRate = payload;
    },
    setGnfdGasFeesConfig(state, { payload }: PayloadAction<QueryMsgGasParamsResponse>) {
      const gnfdGasPrice = state.gnfdGasPrice;
      state.gnfdGasFeesConfig = keyBy(
        payload.msgGasParams.map((item) => {
          let gasLimit = item.fixedType?.fixedGas.low || 0;
          let gasFee = +gnfdGasPrice * gasLimit;
          let perItemFee = 0;
          if (item.msgTypeUrl === MsgGrantAllowanceTypeUrl) {
            gasLimit = item.grantAllowanceType?.fixedGas.low || 0;
            gasFee = +gnfdGasPrice * gasLimit;
            perItemFee = (item.grantAllowanceType?.gasPerItem.low || 0) * +gnfdGasPrice;
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
    },
    setTaskManagement(state, { payload }: PayloadAction<boolean>) {
      state.globalTaskManagementOpen = payload;
    },
    setStoreFeeParams(state, { payload }: PayloadAction<{ storeFeeParams: StoreFeeParams }>) {
      state.storeFeeParams = payload.storeFeeParams;
    },
    setMainnetStoreFeeParams(
      state,
      { payload }: PayloadAction<{ storeFeeParams: StoreFeeParams }>,
    ) {
      state.mainnetStoreFeeParams = payload.storeFeeParams;
    },
    resetUploadQueue(state, { payload }: PayloadAction<{ loginAccount: string }>) {
      const { loginAccount } = payload;
      if (!loginAccount) return;
      let uploadQueue = state.objectUploadQueue?.[loginAccount];
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
    // cancelUploadFolder(state, { payload }: PayloadAction<{ account: string; folderName: string }>) {
    //   const { account } = payload;
    //   if (!account) return;
    //   let uploadQueue = state.objectUploadQueue?.[account];
    //   if (!uploadQueue) return;
    //   uploadQueue = uploadQueue.map((task) => {
    //     const isFolder = task.waitObject.name.endsWith('/');
    //     // Only cancel subfolders and subfiles
    //     if (isFolder && payload.folderName === task.waitObject.name) {
    //       return task;
    //     }
    //     const commonPath = isFolder ? task.waitObject.name : task.waitObject.relativePath + '/';
    //     const isSubTask = commonPath.startsWith(payload.folderName);
    //     if (isSubTask) {
    //       task.status = 'CANCEL';
    //       task.msg = "The object's parent path failed to be created, please check.";
    //     }
    //     return task;
    //   });
    // },
    // cancelWaitUploadFolder(state, { payload }: PayloadAction<{ folderName: string }>) {
    //   const { folderName } = payload;
    //   if (!folderName) return;
    //   let objectWaitQueue = state.objectWaitQueue;
    //   if (!objectWaitQueue) return;
    //   objectWaitQueue = objectWaitQueue.map((task) => {
    //     const isFolder = task.name.endsWith('/');
    //     // Only cancel subfolders and subfiles
    //     if (isFolder && folderName === task.name) {
    //       return task;
    //     }
    //     const commonPath = isFolder ? task.name : task.relativePath + '/';
    //     const isSubTask = commonPath.startsWith(folderName);
    //     if (isSubTask) {
    //       task.status = 'ERROR';
    //       task.msg = "The object's parent path failed to be created, please check.";
    //     }
    //     return task;
    //   });
    // },
    setIsFetchingStoreFeeParams(state, { payload }: PayloadAction<boolean>) {
      state.isFetchingStoreFeeParams = payload;
    },
    setDisconnectWallet(state, { payload }: PayloadAction<boolean>) {
      state.walletDisconnected = payload;
    },
    setConnectWallet(state, { payload }: PayloadAction<boolean>) {
      state.walletConnected = payload;
    },
    setSignatureAction(state, { payload }: PayloadAction<SignatureAction | object>) {
      state.signatureAction = payload;
    },
    // clear a upload record, a batch of upload records
    clearUploadRecords(state, { payload }: PayloadAction<{ ids: number[]; loginAccount: string }>) {
      const { ids, loginAccount } = payload;
      const uploadQueue = state.objectUploadQueue[loginAccount] || _emptyUploadQueue;
      state.objectUploadQueue[loginAccount] = uploadQueue.filter(
        (task: UploadObject) => !ids.includes(task.id),
      );
    },
  },
});

export const {
  setBnbUsdtExchangeRate,
  updateWaitObjectStatus,
  updateWaitTaskMsg,
  updateUploadTaskErrorMsg,
  updateUploadChecksum,
  addToUploadQueue,
  updateUploadStatus,
  updateUploadProgress,
  setTaskManagement,
  removeFromWaitQueue,
  toggleObjectReplaceState,
  resetWaitQueue,
  resetUploadQueue,
  // cancelUploadFolder,
  // cancelWaitUploadFolder,
  setIsFetchingStoreFeeParams,
  setAuthModalOpen,
  setDisconnectWallet,
  updateUploadCreateHash,
  setSignatureAction,
  setWaitQueue,
  clearUploadRecords,
} = globalSlice.actions;

const _emptyUploadQueue = Array<UploadObject>();

export const selectUploadQueue = (address: string) => (root: AppState) => {
  return root.global.objectUploadQueue[address] || _emptyUploadQueue;
};

export const selectHashTask = (address: string) => (root: AppState) => {
  const uploadQueue = root.global.objectUploadQueue[address] || _emptyUploadQueue;
  const hashQueue = uploadQueue.filter((task) => task.status === 'HASH' && !task.delegateUpload);
  const waitQueue = uploadQueue.filter((task) => task.status === 'WAIT' && !task.delegateUpload);

  return hashQueue.length ? null : waitQueue[0] ? waitQueue[0] : null;
};

export const selectSignTask = (address: string) => (root: AppState) => {
  const uploadQueue = root.global.objectUploadQueue[address] || _emptyUploadQueue;

  const signQueue = uploadQueue.filter((task) => task.status === 'SIGN' && !task.delegateUpload);
  const hashedQueue = uploadQueue.filter(
    (task) => task.status === 'HASHED' && !task.delegateUpload,
  );
  const uploadingQueue = uploadQueue.filter(
    (task) => task.status === 'UPLOAD' && !task.delegateUpload,
  );

  if (uploadingQueue.length || !!signQueue.length) {
    return null;
  }

  return hashedQueue[0] ? hashedQueue[0] : null;
};

export const selectBnbUsdtExchangeRate = (state: AppState) => state.global.bnbUsdtExchangeRate;

const defaultGasFeesConfig: GasFeesConfig = {};
export const selectGnfdGasFeesConfig = (state: AppState) =>
  state.global.gnfdGasFeesConfig || defaultGasFeesConfig;

export const selectStoreFeeParams = (state: AppState) => state.global.storeFeeParams;

export const selectMainnetStoreFeeParams = (state: AppState) => state.global.mainnetStoreFeeParams;

export const selectHasUploadingTask = (state: AppState) => {
  const uploadQueue = state.global.objectUploadQueue[state.persist.loginAccount] || [];

  return uploadQueue.some((item) =>
    ['WAIT', 'HASH', 'HASHED', 'SIGN', 'SIGNED', 'UPLOAD', 'SEAL'].includes(item.status),
  );
};

export const setupBnbUsdtExchangeRate = () => async (dispatch: AppDispatch) => {
  const res = await getBnbUsdtExchangeRate();
  dispatch(setBnbUsdtExchangeRate(res));
};

export const setupGnfdGasFeesConfig = () => async (dispatch: AppDispatch) => {
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
  dispatch(globalSlice.actions.setGnfdGasFeesConfig(res));
};

export const setupStoreFeeParams = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { isFetchingStoreFeeParams } = getState().global;
  if (isFetchingStoreFeeParams) return;
  dispatch(setIsFetchingStoreFeeParams(true));
  const storeFeeParams = await getStoreFeeParams({});
  dispatch(
    globalSlice.actions.setStoreFeeParams({
      storeFeeParams,
    }),
  );
  dispatch(setIsFetchingStoreFeeParams(false));
};

export const setupMainnetStoreFeeParams = () => async (dispatch: AppDispatch) => {
  const storeFeeParams = await getStoreFeeParams({ network: 'mainnet' });
  dispatch(
    globalSlice.actions.setMainnetStoreFeeParams({
      storeFeeParams,
    }),
  );
};

export const refreshTaskFolder =
  (task: UploadObject) => async (dispatch: AppDispatch, getState: GetState) => {
    const { spRecords } = getState().sp;
    const { loginAccount } = getState().persist;
    const primarySp = spRecords[task.spAddress];
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
  (task: UploadObject) => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    await dispatch(refreshTaskFolder(task));
    dispatch(updateUploadStatus({ ids: [task.id], status: 'FINISH', account: loginAccount }));
    // for setupListObjects ready
    setTimeout(() => {
      dispatch(
        setObjectStatus({
          bucketName: task.bucketName,
          folders: task.prefixFolders,
          name: task.waitObject.name,
          objectStatus: 1,
          contentType: task.waitObject.type,
          payloadSize: task.waitObject.size,
        }),
      );
    });
  };

const fetchedList: Record<string, boolean> = {};

// ensure upload file in file list
export const progressFetchList = (task: UploadObject) => async (dispatch: AppDispatch) => {
  if (fetchedList[task.id]) return;
  fetchedList[task.id] = true;
  await dispatch(refreshTaskFolder(task));
};

export const addTasksToUploadQueue =
  ({
    spAddress,
    visibility,
    tags,
    tempAccountAddress,
  }: {
    spAddress: string;
    visibility: VisibilityType;
    tags: ResourceTags_Tag[];
    tempAccountAddress: string;
  }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { objectWaitQueue } = getState().global;
    const { currentBucketName, pathSegments } = getState().object;
    const { loginAccount } = getState().persist;
    const wQueue = objectWaitQueue.filter((t) => t.status === 'WAIT');
    if (!wQueue || wQueue.length === 0) return;
    const newUploadQueue = wQueue.map((task) => {
      const uploadTask: UploadObject = {
        bucketName: currentBucketName,
        prefixFolders: pathSegments,
        spAddress,
        id: task.id,
        waitObject: task,
        msg: '',
        status: 'WAIT',
        progress: 0,
        checksum: [],
        visibility,
        createHash: '',
        tags,
        tempAccountAddress,
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
    waitObject,
    createHash,
    tags,
  }: {
    spAddress: string;
    visibility: VisibilityType;
    checksums: string[];
    waitObject: WaitObject;
    createHash: string;
    tags: ResourceTags_Tag[];
  }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { currentBucketName, pathSegments } = getState().object;
    const { loginAccount } = getState().persist;

    const newUploadQueue: UploadObject = {
      bucketName: currentBucketName,
      prefixFolders: pathSegments,
      spAddress,
      id: waitObject.id,
      waitObject: waitObject,
      msg: '',
      status: 'SIGNED',
      progress: 0,
      checksum: checksums,
      visibility,
      createHash,
      tags: tags,
    };
    dispatch(addToUploadQueue({ account: loginAccount, tasks: [newUploadQueue] }));
  };

export const addDelegatedTasksToUploadQueue =
  ({ spAddress, visibility }: { spAddress: string; visibility: VisibilityType }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { objectWaitQueue } = getState().global;
    const { currentBucketName, pathSegments } = getState().object;
    const { loginAccount } = getState().persist;
    const wQueue = objectWaitQueue.filter(waitUploadFilterFn);
    if (!wQueue || wQueue.length === 0) return;
    const newUploadQueue = wQueue.map((task) => {
      const uploadTask: UploadObject = {
        bucketName: currentBucketName,
        prefixFolders: pathSegments,
        spAddress,
        id: task.id,
        waitObject: task,
        msg: '',
        status: 'WAIT',
        progress: 0,
        checksum: [],
        visibility,
        createHash: '',
        tags: [],
        tempAccountAddress: '',
        delegateUpload: true,
      };
      return uploadTask;
    });
    dispatch(addToUploadQueue({ account: loginAccount, tasks: newUploadQueue }));
  };

export const setupUploadTaskErrorMsg =
  ({
    account,
    task,
    errorMsg,
    status,
  }: {
    account: string;
    task: UploadObject;
    errorMsg: string;
    status?: UploadObjectStatus;
  }) =>
  async (dispatch: AppDispatch) => {
    // const isFolder = task.waitObject.name.endsWith('/');
    dispatch(
      updateUploadTaskErrorMsg({
        account,
        id: task.id,
        msg: errorMsg || 'The object failed to be created.',
        status,
      }),
    );
    // isFolder && dispatch(cancelUploadFolder({ account, folderName: task.waitObject.name }));
  };

export const setupWaitTaskErrorMsg =
  ({ id, errorMsg }: { id: number; errorMsg: string }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { objectWaitQueue } = getState().global;
    const task = objectWaitQueue.find((t) => t.id === id);
    if (!task) return;
    // const isFolder = task.name.endsWith('/');
    dispatch(updateWaitTaskMsg({ id: id, msg: errorMsg || 'The object failed to be created.' }));
    // isFolder && dispatch(cancelWaitUploadFolder({ folderName: task.name }));
  };

// retry a task, or a batch of tasks
export const retryUploadTasks =
  ({ ids }: { ids: number[] }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const uploadQueue = getState().global.objectUploadQueue[loginAccount] || _emptyUploadQueue;
    const tasks = uploadQueue.filter((task) => ids.includes(task.id));
    tasks.forEach((task) => {
      if (!['ERROR', 'CANCEL'].includes(task.status) || task.waitObject.file.length === 0) {
        return; // Exit the current iteration of the loop.
      }
      dispatch(
        updateUploadStatus({ account: loginAccount, ids: [task.id], status: 'RETRY_CHECK' }),
      );
    });
  };

export const cancelUploadingRequests =
  ({ ids }: { ids: number[] }) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const uploadQueue = getState().global.objectUploadQueue[loginAccount] || _emptyUploadQueue;
    const tasks = uploadQueue.filter((task) => ids.includes(task.id));
    tasks.forEach(async (task) => {
      task.abortController && task.abortController.abort();
    });
  };

export default globalSlice.reducer;
