import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getGroupMembers, getGroups } from '@/facade/group';
import { BucketInfo, GroupInfo, ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { toast } from '@totejs/uikit';
import { DEFAULT_TAG } from '@/components/common/ManageTags';

export type GroupMember = {
  AccountId: string;
  Operator: string;
  CreateAt: number;
  CreateTime: number;
  UpdateAt: number;
  Removed: boolean;
  ExpirationTime: number;
};

export type GroupOperationsType = 'create' | 'detail' | 'edit' | 'add' | 'remove' | 'delete' | 'edit_tags' | 'update_tags' | '';

interface GroupState {
  groups: Record<string, GroupInfo[]>;
  loading: boolean;
  currentPage: number;
  memberListPage: number;
  removeGroup: GroupInfo;
  groupMembers: Record<string, GroupMember[]>;
  groupOperation: Record<0 | 1, [string, GroupOperationsType, Record<string, any>?]>;
  selectedGroupMember: string[];
  editTags: [string, string];
  editTagsData: ResourceTags_Tag[];
}

const initialState: GroupState = {
  groups: {},
  loading: false,
  currentPage: 0,
  memberListPage: 0,
  removeGroup: {} as GroupInfo,
  groupMembers: {},
  groupOperation: { 0: ['', '', {}], 1: ['', '', {}] },
  selectedGroupMember: [],
  editTags: ['', '',],
  editTagsData: [DEFAULT_TAG]
};

export const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setSelectedGroupMember(state, { payload }: PayloadAction<string[]>) {
      state.selectedGroupMember = payload;
    },
    setGroupOperation(
      state,
      {
        payload,
      }: PayloadAction<{
        level?: 0 | 1;
        operation: [string, GroupOperationsType, Record<string, any>?];
      }>,
    ) {
      state.groupOperation[payload.level || 0] = payload.operation;
    },
    setGroupMembers(state, { payload }: PayloadAction<{ id: string; members: GroupMember[] }>) {
      const { id, members } = payload;
      state.groupMembers[id] = members;
    },
    setRemoveGroup(state, { payload }: PayloadAction<GroupInfo>) {
      state.removeGroup = payload;
    },
    setCurrentGroupPage(state, { payload }: PayloadAction<number>) {
      state.currentPage = payload;
    },
    setMemberListPage(state, { payload }: PayloadAction<number>) {
      state.memberListPage = payload;
    },
    setLoading(state, { payload }: PayloadAction<boolean>) {
      state.loading = payload;
    },
    setGroups(state, { payload }: PayloadAction<{ account: string; list: GroupInfo[] }>) {
      const { account, list } = payload;
      state.groups[account] = list;
    },
    setGroupTags(state, { payload }: PayloadAction<{ account: string, groupId: string, tags: ResourceTags_Tag[] }>) {
      const { account, groupId, tags } = payload;
      const group = state.groups[account].find(item => item.id === groupId);
      if (!group) return;
      group['tags'] = {
        tags,
      };
    },
    setEditGroupTags(state, { payload }: PayloadAction<[string, string]>) {
      state.editTags = payload;
    },
    setEditGroupTagsData(state, { payload }: PayloadAction<ResourceTags_Tag[]>) {
      state.editTagsData = payload;
    },
  },
});

export const {
  setGroups,
  setLoading,
  setCurrentGroupPage,
  setRemoveGroup,
  setGroupMembers,
  setMemberListPage,
  setGroupOperation,
  setSelectedGroupMember,
  setEditGroupTags,
  setEditGroupTagsData,
  setGroupTags,
} = groupSlice.actions;

export const setupGroupMembers =
  (id: string, endpoint: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    let members = Array<GroupMember>().concat(await getGroupMembers(id, endpoint));
    if (!members.some((m) => m.AccountId === loginAccount)) {
      const now = Date.now();
      members.unshift({
        AccountId: loginAccount,
        CreateTime: now,
        ExpirationTime: now,
        CreateAt: now,
        Operator: loginAccount,
        Removed: false,
        UpdateAt: now,
      });
    }
    dispatch(setGroupMembers({ id, members }));
    return members;
  };

const defaultMemberList = Array<GroupMember>();
export const selectMemberList = (id: string) => (root: AppState) => {
  return root.group.groupMembers[id] || defaultMemberList;
};

const defaultGroupList = Array<BucketInfo>();
export const selectGroupList = (address: string) => (root: AppState) => {
  return root.group.groups[address] || defaultGroupList;
};

export const setupGroups =
  (loginAccount: string, forceLoading = false) =>
    async (dispatch: AppDispatch, getState: GetState) => {
      const { groups, loading } = getState().group;
      if (loading) return;
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
