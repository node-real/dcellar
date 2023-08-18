import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getGroups } from '@/facade/group';
import { BucketInfo, GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { toast } from '@totejs/uikit';

interface GroupState {
  groups: Record<string, GroupInfo[]>;
  loading: boolean;
  currentPage: number;
  creatingGroup: boolean;
  editGroup: GroupInfo;
  removeGroup: GroupInfo;
  addGroupMember: GroupInfo;
  removeGroupMember: GroupInfo;
}

const initialState: GroupState = {
  groups: {},
  loading: true,
  currentPage: 0,
  creatingGroup: false,
  editGroup: {} as GroupInfo,
  removeGroup: {} as GroupInfo,
  addGroupMember: {} as GroupInfo,
  removeGroupMember: {} as GroupInfo,
};

export const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setAddGroupMember(state, { payload }: PayloadAction<GroupInfo>) {
      state.addGroupMember = payload;
    },
    setRemoveGroupMember(state, { payload }: PayloadAction<GroupInfo>) {
      state.removeGroupMember = payload;
    },
    setRemoveGroup(state, { payload }: PayloadAction<GroupInfo>) {
      state.removeGroup = payload;
    },
    setEditGroup(state, { payload }: PayloadAction<GroupInfo>) {
      state.editGroup = payload;
    },
    setCreatingGroup(state, { payload }: PayloadAction<boolean>) {
      state.creatingGroup = payload;
    },
    setCurrentGroupPage(state, { payload }: PayloadAction<number>) {
      state.currentPage = payload;
    },
    setLoading(state, { payload }: PayloadAction<boolean>) {
      state.loading = payload;
    },
    setGroups(state, { payload }: PayloadAction<{ account: string; list: GroupInfo[] }>) {
      const { account, list } = payload;
      state.groups[account] = list;
    },
  },
});

export const {
  setGroups,
  setLoading,
  setCurrentGroupPage,
  setCreatingGroup,
  setRemoveGroup,
  setEditGroup,
  setRemoveGroupMember,
  setAddGroupMember,
} = groupSlice.actions;

const defaultGroupList = Array<BucketInfo>();
export const selectGroupList = (address: string) => (root: AppState) => {
  return root.group.groups[address] || defaultGroupList;
};

export const setupGroups =
  (loginAccount: string, forceLoading = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { groups } = getState().group;
    if (!(loginAccount in groups) || forceLoading) {
      dispatch(setLoading(true));
    }
    const [list, error] = await getGroups(loginAccount);
    dispatch(setLoading(false));
    if (!list) {
      toast.error({ description: error });
      return;
    }
    dispatch(setGroups({ account: loginAccount, list: list || [] }));
  };

export default groupSlice.reducer;
