import { createSlice } from '@reduxjs/toolkit';

export interface BucketState {}

const initialState: BucketState = {};

export const bucketSlice = createSlice({
  name: 'bucket',
  initialState,
  reducers: {},
});

export default bucketSlice.reducer;
