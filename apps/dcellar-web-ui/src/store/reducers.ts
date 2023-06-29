import { AnyAction, CombinedState, combineReducers } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { persistReducer } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';
import counter from '@/store/slices/counter';
import global from '@/store/slices/global';
import sp from '@/store/slices/sp';
import persist from '@/store/slices/persist';
import bucket from '@/store/slices/bucket';

const rootReducer = combineReducers({
  counter,
  global,
  persist,
  sp,
  bucket,
});

export type RootState = ReturnType<typeof rootReducer>;

const reducer = (state: RootState, action: AnyAction) => {
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
  whitelist: ['counter'],
  throttle: 300,
  keyPrefix: `Dcellar_`,
  stateReconciler: autoMergeLevel2,
};

// @ts-ignore, strict null check
export const persistedReducer = persistReducer<CombinedState<RootState>>(persistConfig, reducer);
