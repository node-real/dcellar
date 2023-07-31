import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BnbPriceInfo, getDefaultBnbInfo, getBnbPrice } from '@/facade/common';
import { AppDispatch, AppState, GetState } from '@/store';
import { getClient } from '@/base/client';
import { QueryMsgGasParamsResponse } from '@bnb-chain/greenfield-cosmos-types/cosmos/gashub/v1beta1/query';
import { find, keyBy } from 'lodash-es';
import { setupListObjects, updateObjectStatus } from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { defaultBalance } from '@/store/slices/balance';
import Long from 'long';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';

export type TGasList = {
  [msgTypeUrl: string]: {
    gasLimit: number;
    msgTypeUrl: string;
    gasFee: number;
  };
};

type TGas = {
  gasPrice: number;
  gasObjects: TGasList;
};

export type TPreLockFeeParams = {
  spStorageStorePrice: string;
  secondarySpStorePrice: string;
  validatorTaxRate: string;
  minChargeSize: number;
  redundantDataChunkNum: number;
  redundantParityChunkNum: number;
  reserveTime: string;
}

type TPreLockFeeObjects = {
  [key: string]: TPreLockFeeParams
};

export type TFileStatus = 'CHECK' | 'WAIT' | 'ERROR';

export type TUploadStatus = 'WAIT' | 'HASH' | 'READY' | 'UPLOAD' | 'FINISH' | 'SEAL' | 'ERROR';

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
  lockFee: string;
};

export type UploadFile = {
  bucketName: string;
  prefixFolders: string[];
  id: number;
  spAddress: string;
  file: WaitFile;
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
  preLockFeeObjects: TPreLockFeeObjects;
  waitQueue: WaitFile[]; // max length two, share cross different accounts.
  uploadQueue: Record<string, UploadFile[]>;
  _availableBalance: string; // using static value, avoid rerender
  _lockFee: string;
  taskManagement: boolean;
  tmpAccount: TTmpAccount;
}

const initialState: GlobalState = {
  bnb: getDefaultBnbInfo(),
  gasHub: {
    gasPrice: 5e-9,
    gasObjects: {},
  },
  preLockFeeObjects: {},
  waitQueue: [],
  uploadQueue: {},
  _availableBalance: '0',
  _lockFee: '0',
  taskManagement: false,
  tmpAccount: {} as TTmpAccount,
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setTmpAvailableBalance(state, { payload }: PayloadAction<string>) {
      state._availableBalance = payload;
    },
    setTmpLockFee(state, { payload }: PayloadAction<string>) {
      state._lockFee = payload;
    },
    updateUploadMsg(
      state,
      { payload }: PayloadAction<{ account: string; id: number; msg: string }>,
    ) {
      const { account, msg, id } = payload;
      const task = find<UploadFile>(state.uploadQueue[account], (f) => f.id === id);
      if (!task) return;
      task.msg = msg;
      if (msg) {
        task.status = 'FINISH';
        task.file.file = {} as any;
      }
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
        task.file.file = {} as any;
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
      { payload }: PayloadAction<{ account: string; id: number; checksum: string[]; }>,
    ) {
      const { account, id, checksum } = payload;
      const queues = state.uploadQueue;
      const queue = queues[account]
      const task = find<UploadFile>(queue, (t) => t.id === id);
      if (!task) return;
      task.status = 'READY';
      task.checksum = checksum;
      if (queue.length === 1) return;
      // 为什么要移除啊？先不要移除，一定要以数据流动和管理进行思考
      // queue.shift(); // shift first ready item
    },
    updateWaitTaskMsg(state, { payload }: PayloadAction<{ id: number; msg: string, }>) {
      const { id, msg } = payload;
      const task = find<WaitFile>(state.waitQueue, (t) => t.id === id);
      if (!task) return;
      task.status = 'ERROR';
      task.msg = msg;

    },
    updateUploadTaskMsg(state, { payload }: PayloadAction<{ account: string, id: number, msg: string }>) {
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
    addToWaitQueue(state, { payload }: PayloadAction<{ id: number; file: File; time: number; }>) {
      const { id, file, time } = payload;
      const task: WaitFile = {
        file,
        status: 'CHECK',
        id,
        time,
        msg: '',
        type: file.type,
        size: file.size,
        name: file.name,
        lockFee: '',
      };
      state.waitQueue.push(task);
    },
    resetWaitQueue(state) {
      state.waitQueue = [];
    },
    removeFromWaitQueue(state, { payload }: PayloadAction<{ id: number }>) {
      const { id } = payload;
      state.waitQueue = state.waitQueue.filter((task) => task.id !== id);
    },
    addToUploadQueue(state, { payload }: PayloadAction<{ account: string, tasks: UploadFile[] }>) {
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
          const gasLimit = item.fixedType?.fixedGas.low || 0;
          const gasFee = gasPrice * gasLimit;
          return {
            msgTypeUrl: item.msgTypeUrl,
            gasLimit,
            gasFee,
          };
        }),
        'msgTypeUrl',
      );

      state.gasHub.gasObjects = gasObjects;
    },
    setTaskManagement(state, { payload }: PayloadAction<boolean>) {
      state.taskManagement = payload;
    },
    setPreLockFeeObjects(state, { payload }: PayloadAction<{ primarySpAddress: string, lockFeeParams: TPreLockFeeParams }>) {
      const { primarySpAddress, lockFeeParams } = payload;
      state.preLockFeeObjects[primarySpAddress] = lockFeeParams;
    },
    setTmpAccount(state, { payload }: PayloadAction<TTmpAccount>) {
      state.tmpAccount = payload;
    }
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
  updateUploadMsg,
  setTmpAvailableBalance,
  setTmpLockFee,
  setTaskManagement,
  removeFromWaitQueue,
  setTmpAccount,
  resetWaitQueue,
} = globalSlice.actions;

const _emptyUploadQueue = Array<UploadFile>();

export const selectUploadQueue = (address: string) => (root: AppState) => {
  return root.global.uploadQueue[address] || _emptyUploadQueue;
};

export const selectHashTask = (address: string) => (root: AppState) => {
  const uploadQueue = root.global.uploadQueue[address] || _emptyUploadQueue;
  const hashQueue = uploadQueue.filter((task) => task.status === 'HASH');
  const waitQueue = uploadQueue.filter((task) => task.status === 'WAIT');

  const res = !!hashQueue.length ? null : waitQueue[0] ? waitQueue[0] : null;

  return res;
}
export const selectBnbPrice = (state: AppState) => state.global.bnb.price;

export const setupBnbPrice = () => async (dispatch: AppDispatch) => {
  const res = await getBnbPrice();
  dispatch(setBnbInfo(res));
};

export const setupGasObjects = () => async (dispatch: AppDispatch) => {
  const client = await getClient();
  const res = await client.gashub.getMsgGasParams({ msgTypeUrls: [] });
  dispatch(globalSlice.actions.setGasObjects(res));
};

export const setupPreLockFeeObjects = (primarySpAddress: string) => async (dispatch: AppDispatch) => {
  const client = await getClient();
  const spStoragePrice = await client.sp.getStoragePriceByTime(primarySpAddress);
  const secondarySpStoragePrice = await client.sp.getSecondarySpStorePrice();
  const { params: storageParams } = await client.storage.params();
  const {
    minChargeSize = new Long(0),
    redundantDataChunkNum = 0,
    redundantParityChunkNum = 0,
  } = (storageParams && storageParams.versionedParams) || {};
  const { params: paymentParams } = await client.payment.params();
  const { reserveTime, validatorTaxRate } = paymentParams?.versionedParams || {};

  const lockFeeParamsPayload = {
    spStorageStorePrice: spStoragePrice?.storePrice || '',
    secondarySpStorePrice: secondarySpStoragePrice?.storePrice || '',
    validatorTaxRate,
    minChargeSize: minChargeSize.toNumber(),
    redundantDataChunkNum,
    redundantParityChunkNum,
    reserveTime: reserveTime?.toString() || '',
  };
  dispatch(globalSlice.actions.setPreLockFeeObjects({
    primarySpAddress, lockFeeParams: lockFeeParamsPayload
  }))
}

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
    dispatch(
      updateObjectStatus({
        bucketName: task.bucketName,
        folders: task.prefixFolders,
        name: task.file.name,
        objectStatus: 1,
      }),
    );
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
  (spAddress: string, visibility: VisibilityType) => async (dispatch: AppDispatch, getState: GetState) => {
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
        file: task,
        msg: '',
        status: 'WAIT',
        progress: 0,
        checksum: [],
        visibility,
        createHash: '',
      }
      return uploadTask;
    });
    dispatch(addToUploadQueue({ account: loginAccount, tasks: newUploadQueue }));
  };

export const setupTmpAvailableBalance =
  (address: string, _balance?: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { balances } = getState().balance;
    const balance = balances[address] || defaultBalance;
    dispatch(setTmpAvailableBalance(_balance || balance.availableBalance));
  };

export const setupTmpLockFee =
  (address: string, _lockFee?: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { balances } = getState().balance;
    const balance = balances[address] || defaultBalance;
    dispatch(setTmpLockFee(_lockFee || balance.lockFee));
  };

export default globalSlice.reducer;
