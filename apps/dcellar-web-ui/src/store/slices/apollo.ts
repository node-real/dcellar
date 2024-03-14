import { defaultApolloConfig } from '@/base/env';
import { createSlice } from '@reduxjs/toolkit';
import { isEmpty } from 'lodash-es';

interface ApolloState {
  TOKEN_HUB_CONTRACT_ADDRESS: string;
  CROSS_CHAIN_CONTRACT_ADDRESS: string;
  RECOMMEND_SPS: string;
  SP_RECOMMEND_META: string;
  CLIENT_FROZEN_ACCOUNT_BUFFER_TIME: string;
  LIST_FOR_SELL_ENDPOINT: string;
  GLOBAL_NOTIFICATION: string;
  GLOBAL_NOTIFICATION_ETA: string;
}

const initialState: ApolloState = {
  TOKEN_HUB_CONTRACT_ADDRESS: '',
  CROSS_CHAIN_CONTRACT_ADDRESS: '',
  RECOMMEND_SPS: '',
  SP_RECOMMEND_META: '',
  CLIENT_FROZEN_ACCOUNT_BUFFER_TIME: '',
  LIST_FOR_SELL_ENDPOINT: '',
  GLOBAL_NOTIFICATION: '',
  GLOBAL_NOTIFICATION_ETA: '',
};

export const apolloSlice = createSlice({
  name: 'apollo',
  initialState: () => {
    const globalConfig = (global as any).__GLOBAL_CONFIG;
    const config = isEmpty(globalConfig) ? defaultApolloConfig : globalConfig;

    return { ...initialState, ...config };
  },
  reducers: {},
});

export default apolloSlice.reducer;
