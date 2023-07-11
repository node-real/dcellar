import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BnbPriceInfo, getDefaultBnbInfo, getBnbPrice } from '@/facade/common';
import { AppDispatch, AppState, GetState } from '@/store';
import { getAccountBalance } from '@/facade/account';
import { getStreamRecord } from '@/facade/payment';
import BigNumber from 'bignumber.js';
import { getClient } from '@/base/client';
import { QueryMsgGasParamsResponse } from '@bnb-chain/greenfield-cosmos-types/cosmos/gashub/v1beta1/query';
import { find, keyBy } from 'lodash-es';
import { setupListObjects } from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';

type Balance = {
  amount: string;
  denom: string;
  netflowRate: string;
  latestStaticBalance: string;
  lockFee: string;
  availableBalance: string;
  useMetamaskValue: boolean;
};

type TGasList = {
  [msgTypeUrl: string]: {
    gasLimit: number;
    msgTypeUrl: string;
    gasFee: number;
  };
};

type TGas = {
  gasPrice: number;
  gasList: TGasList;
};

export const getDefaultBalance = () => ({
  amount: '0',
  denom: 'BNB',
  netflowRate: '0',
  latestStaticBalance: '0',
  lockFee: '0',
  availableBalance: '0',
  useMetamaskValue: false,
});

export const defaultBalance = getDefaultBalance();

export type HashFile = {
  file: File;
  status: 'CHECK' | 'WAIT' | 'HASH' | 'READY';
  id: number;
  msg: string;
  type: string;
  size: number;
  name: string;
  checksum: string[];
  lockFee: string;
};

export type UploadFile = {
  bucketName: string;
  folders: string[];
  id: number;
  sp: string;
  file: HashFile;
  status: 'WAIT' | 'UPLOAD' | 'SEAL' | 'FINISH';
  createHash: string;
  msg: string;
  progress: number;
};

export interface GlobalState {
  bnb: BnbPriceInfo;
  balances: Record<string, Balance>;
  gasHub: TGas;
  hashQueue: HashFile[]; // max length two, share cross different accounts.
  uploadQueue: Record<string, UploadFile[]>;
}

const initialState: GlobalState = {
  bnb: getDefaultBnbInfo(),
  balances: {},
  gasHub: {
    gasPrice: 5e-9,
    gasList: {},
  },
  hashQueue: [],
  uploadQueue: {},
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
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
    updateHashQueue(state) {
      state.hashQueue = state.hashQueue.filter((task) => task.status === 'HASH');
    },
    updateHashChecksum(state, { payload }: PayloadAction<{ id: number; checksum: string[], lockFee: string }>) {
      const { id, checksum, lockFee } = payload;
      const queue = state.hashQueue;
      const task = find<HashFile>(queue, (t) => t.id === id);
      if (!task) return;
      task.status = 'READY';
      task.checksum = checksum;
      task.lockFee = lockFee;
      if (queue.length === 1) return;
      queue.shift(); // shift first ready item
    },
    updateHashTaskMsg(state, { payload }: PayloadAction<{ id: number; msg: string }>) {
      const { id, msg } = payload;
      const task = find<HashFile>(state.hashQueue, (t) => t.id === id);
      if (!task) return;
      task.msg = msg;
    },
    updateHashStatus(
      state,
      { payload }: PayloadAction<{ id: number; status: HashFile['status'] }>,
    ) {
      const { id, status } = payload;
      const task = find<HashFile>(state.hashQueue, (t) => t.id === id);
      if (!task) return;
      task.status = status;
    },
    addToHashQueue(state, { payload }: PayloadAction<{ id: number; file: File }>) {
      const { id, file } = payload;
      const task: HashFile = {
        file,
        status: 'CHECK',
        id,
        msg: '',
        type: file.type,
        size: file.size,
        name: file.name,
        checksum: Array<string>(),
        lockFee: '',
      };
      state.hashQueue = state.hashQueue.filter((task) => task.status === 'HASH');
      const queue = state.hashQueue;
      // max length 2
      queue.length >= 2 ? (queue[2] = task) : queue.push(task);
    },
    addToUploadQueue(state, { payload }: PayloadAction<UploadFile & { account: string }>) {
      const { account, ...task } = payload;
      const tasks = state.uploadQueue[account] || [];
      state.uploadQueue[account] = [...tasks, task];
    },
    setBnbInfo(state, { payload }: PayloadAction<BnbPriceInfo>) {
      state.bnb = payload;
    },
    setBalance(state, { payload }: PayloadAction<{ address: string; balance: Partial<Balance> }>) {
      const { address, balance } = payload;
      const _config = state.balances[address];
      state.balances[address] = { ..._config, ...balance };
    },
    updateStaticBalance(state, { payload }: PayloadAction<{ address: string; offset: string }>) {
      const { address, offset } = payload;
      const pre = state.balances[address].latestStaticBalance;
      state.balances[address].latestStaticBalance = BigNumber(pre).plus(offset).toString();
    },
    setGasList(state, { payload }: PayloadAction<QueryMsgGasParamsResponse>) {
      const { gasPrice } = state.gasHub;
      const gasList = keyBy(
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

      state.gasHub.gasList = gasList;
    },
  },
});

export const {
  setBnbInfo,
  setBalance,
  updateStaticBalance,
  updateHashStatus,
  addToHashQueue,
  updateHashTaskMsg,
  updateHashChecksum,
  updateHashQueue,
  addToUploadQueue,
  updateUploadStatus,
  updateUploadProgress,
  updateUploadMsg,
} = globalSlice.actions;

const _emptyUploadQueue = Array<UploadFile>();
export const selectUploadQueue = (address: string) => (root: AppState) => {
  return root.global.uploadQueue[address] || _emptyUploadQueue;
};

export const selectBnbPrice = (state: AppState) => state.global.bnb.price;

export const selectBalances = (state: AppState) => state.global.balances;

export const selectBalance = (address: string) => (state: AppState) =>
  selectBalances(state)[address] || defaultBalance;

export const selectHashTask = (state: AppState) => {
  const queue = state.global.hashQueue;
  return !queue.length ? null : queue[0].status === 'WAIT' ? queue[0] : null;
};

export const selectHashFile = (id: number) => (state: AppState) => {
  return find<HashFile>(state.global.hashQueue, (f) => f.id === id);
};

export const setupBnbPrice = () => async (dispatch: AppDispatch) => {
  const res = await getBnbPrice();
  dispatch(setBnbInfo(res));
};

export const setupGasList = () => async (dispatch: AppDispatch) => {
  const client = await getClient();
  const res = await client.gashub.getMsgGasParams({ msgTypeUrls: [] });
  dispatch(globalSlice.actions.setGasList(res));
};

export const uploadQueueAndRefresh =
  (task: UploadFile) => async (dispatch: AppDispatch, getState: GetState) => {
    const { spInfo } = getState().sp;
    const { loginAccount } = getState().persist;
    const primarySp = spInfo[task.sp];
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
    await dispatch(setupListObjects(params, [task.bucketName, ...task.folders].join('/')));
    dispatch(updateUploadStatus({ ids: [task.id], status: 'FINISH', account: loginAccount }));
  };

export const addTaskToUploadQueue =
  (id: number, hash: string, sp: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { hashQueue } = getState().global;
    const { bucketName, folders } = getState().object;
    const { loginAccount } = getState().persist;
    const task = find(hashQueue, (t) => t.id === id);
    if (!task) return;
    const _task: UploadFile & { account: string } = {
      bucketName,
      folders,
      sp,
      account: loginAccount,
      id,
      file: task,
      createHash: hash,
      msg: '',
      status: 'WAIT',
      progress: 0,
    };
    dispatch(addToUploadQueue(_task));
  };

export const setupBalance =
  (address: string, metamaskValue = '0') =>
  async (dispatch: AppDispatch) => {
    const [balance, { netflowRate, latestStaticBalance, lockFee, useMetamaskValue }] =
      await Promise.all([getAccountBalance({ address }), getStreamRecord(address)]);
    const _amount = BigNumber(balance.amount).dividedBy(10 ** 18);
    const availableBalance = useMetamaskValue
      ? metamaskValue
      : _amount.plus(BigNumber.max(0, latestStaticBalance)).toString();

    const _balance = {
      ...balance,
      netflowRate,
      latestStaticBalance,
      lockFee,
      useMetamaskValue,
      availableBalance,
    };
    dispatch(setBalance({ address, balance: _balance }));
  };

export default globalSlice.reducer;
