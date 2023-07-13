import { createSlice } from '@reduxjs/toolkit';

interface ApolloState {
  TOKEN_HUB_CONTRACT_ADDRESS: string;
  CROSS_CHAIN_CONTRACT_ADDRESS: string;
  RECOMMEND_SPS: string;
}

const initialState: ApolloState = {
  TOKEN_HUB_CONTRACT_ADDRESS: '',
  CROSS_CHAIN_CONTRACT_ADDRESS: '',
  RECOMMEND_SPS: '',
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
