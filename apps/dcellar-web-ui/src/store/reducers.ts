import { AnyAction, CombinedState, combineReducers } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { persistReducer } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';

import { runtimeEnv } from '@/base/env';
import accounts from '@/store/slices/accounts';
import apollo from '@/store/slices/apollo';
import billing from '@/store/slices/billing';
import bucket from '@/store/slices/bucket';
import dashboard from '@/store/slices/dashboard';
import global from '@/store/slices/global';
import group from '@/store/slices/group';
import object from '@/store/slices/object';
import persist from '@/store/slices/persist';
import sp from '@/store/slices/sp';
import wallet from '@/store/slices/wallet';

const rootReducer = combineReducers({
  global,
  persist,
  sp,
  bucket,
  wallet,
  object,
  apollo,
  group,
  accounts,
  billing,
  dashboard,
});

export type RootState = ReturnType<typeof rootReducer>;

export const reducer = (state: RootState, action: AnyAction) => {
  if (action.type === HYDRATE) {
    return {
      ...state, // use previous state
      ...action.payload, // apply delta from hydration
    };
  } else {
    return rootReducer(state, action);
  }
};

export const persistConfig = {
  key: 'SESSION',
  storage,
  whitelist: ['persist'],
  throttle: 300,
  keyPrefix: `Dcellar_${runtimeEnv}`,
  stateReconciler: autoMergeLevel2,
};

// @ts-expect-error, strict null check
export const persistedReducer = persistReducer<CombinedState<RootState>>(persistConfig, reducer);
