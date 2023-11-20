import { createSlice } from '@reduxjs/toolkit';

interface ApolloState {
  TOKEN_HUB_CONTRACT_ADDRESS: string;
  CROSS_CHAIN_CONTRACT_ADDRESS: string;
  RECOMMEND_SPS: string;
  SP_RECOMMEND_META: string;
  CLIENT_FROZEN_ACCOUNT_BUFFER_TIME: string;
  LIST_FOR_SELL_ENDPOINT: string;
}

const initialState: ApolloState = {
  TOKEN_HUB_CONTRACT_ADDRESS: '',
  CROSS_CHAIN_CONTRACT_ADDRESS: '',
  RECOMMEND_SPS: '',
  SP_RECOMMEND_META: '',
  CLIENT_FROZEN_ACCOUNT_BUFFER_TIME: '',
  LIST_FOR_SELL_ENDPOINT: '',
};

export const apolloSlice = createSlice({
  name: 'apollo',
  initialState: () => {
    const config = ((global as any).__GLOBAL_CONFIG || {}) as ApolloState;
    return { ...initialState, ...config };
  },
  reducers: {},
});

export default apolloSlice.reducer;
