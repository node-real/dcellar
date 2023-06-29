import { createSlice } from '@reduxjs/toolkit';

export interface PersistState {}

const initialState: PersistState = {};

export const persistSlice = createSlice({
  name: 'persist',
  initialState,
  reducers: {},
});

export default persistSlice.reducer;
