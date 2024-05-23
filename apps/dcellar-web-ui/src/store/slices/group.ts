import {
  BucketInfo,
  GroupInfo,
  ResourceTags_Tag,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { toast } from '@node-real/uikit';
import { DEFAULT_TAG } from '@/components/common/ManageTags';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getGroupActivities, getGroupMembers, getGroups } from '@/facade/group';
import { AppDispatch, AppState, GetState } from '@/store';
import { Activity } from './object';
import { numberToHex } from 'viem';

export type GroupMember = {
  AccountId: string;
  Operator: string;
  CreateAt: number;
  CreateTime: number;
  UpdateAt: number;
  Removed: boolean;
  ExpirationTime: number;
};

export type GroupOperationsType =
  | 'create'
  | 'detail'
  | 'edit'
  | 'add'
  | 'remove'
  | 'delete'
  | 'edit_tags'
  | 'update_tags'
  | '';

interface GroupInitialState {
  groupListRecords: Record<string, GroupInfo[]>;
  groupListLoading: boolean;
  groupListPage: number;
  groupMemberListPage: number;
  groupRemoving: GroupInfo;
  groupMemberListRecords: Record<string, GroupMember[]>;
  groupOperation: Record<0 | 1, [string, GroupOperationsType, Record<string, any>?]>;
  groupSelectedMembers: string[];
  editTags: [string, string];
  groupEditTagsData: ResourceTags_Tag[];
  groupActivityRecords: Record<string, Activity[]>;
}
const defaultGroupInfo: GroupInfo = {
  owner: '',
  groupName: '',
  sourceType: -1,
  id: '',
  extra: '',
  tags: { tags: [] },
};
const initialState: GroupInitialState = {
  groupListRecords: {},
  groupListLoading: false,
  groupListPage: 0,
  groupMemberListPage: 0,
  groupRemoving: defaultGroupInfo,
  groupMemberListRecords: {},
  groupOperation: { 0: ['', '', {}], 1: ['', '', {}] },
  groupSelectedMembers: [],
  editTags: ['', ''],
  groupEditTagsData: [DEFAULT_TAG],
  groupActivityRecords: {},
};

export const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setGroupSelectedMembers(state, { payload }: PayloadAction<string[]>) {
      state.groupSelectedMembers = payload;
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
    setGroupMemberList(state, { payload }: PayloadAction<{ id: string; members: GroupMember[] }>) {
      const { id, members } = payload;
      state.groupMemberListRecords[id] = members;
    },
    setGroupRemoving(state, { payload }: PayloadAction<GroupInfo>) {
      state.groupRemoving = payload;
    },
    setGroupListPage(state, { payload }: PayloadAction<number>) {
      state.groupListPage = payload;
    },
    setGroupMemberListPage(state, { payload }: PayloadAction<number>) {
      state.groupMemberListPage = payload;
    },
    setGroupListLoading(state, { payload }: PayloadAction<boolean>) {
      state.groupListLoading = payload;
    },
    setGroupList(state, { payload }: PayloadAction<{ account: string; list: GroupInfo[] }>) {
      const { account, list } = payload;
      state.groupListRecords[account] = list;
    },
    setGroupTags(
      state,
      { payload }: PayloadAction<{ account: string; groupId: string; tags: ResourceTags_Tag[] }>,
    ) {
      const { account, groupId, tags } = payload;
      const group = state.groupListRecords[account].find((item) => item.id === groupId);
      if (!group) return;
      group['tags'] = { tags };
    },
    setEditGroupTags(state, { payload }: PayloadAction<[string, string]>) {
      state.editTags = payload;
    },
    setGroupTagsEditData(state, { payload }: PayloadAction<ResourceTags_Tag[]>) {
      state.groupEditTagsData = payload;
    },
    setGroupActivity(
      state,
      { payload }: PayloadAction<{ activities: Activity[]; groupName: string }>,
    ) {
      const { groupName, activities } = payload;
      state.groupActivityRecords[groupName] = activities;
    },
  },
});

export const {
  setGroupList,
  setGroupListLoading,
  setGroupListPage,
  setGroupRemoving,
  setGroupMemberList,
  setGroupMemberListPage,
  setGroupOperation,
  setGroupSelectedMembers,
  setGroupTagsEditData,
  setGroupTags,
  setGroupActivity,
} = groupSlice.actions;

const defaultGroupList = Array<BucketInfo>();
export const selectGroupList = (address: string) => (root: AppState) => {
  return root.group.groupListRecords[address] || defaultGroupList;
};

export const selectGroupSpinning = (address: string) => (root: AppState) => {
  const { groupListRecords, groupListLoading } = root.group;
  return !(address in groupListRecords) || groupListLoading;
};

const defaultMemberList = Array<GroupMember>();
export const selectMemberList = (id: string) => (root: AppState) => {
  return root.group.groupMemberListRecords[id] || defaultMemberList;
};

export const setupGroupList =
  (loginAccount: string, forceLoading = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { groupListRecords, groupListLoading } = getState().group;
    if (groupListLoading) return;
    if (!(loginAccount in groupListRecords) || forceLoading) {
      dispatch(setGroupListLoading(true));
    }
    const [list, error] = await getGroups(loginAccount);
    dispatch(setGroupListLoading(false));
    if (!list) {
      toast.error({ description: error });
      return;
    }
    dispatch(setGroupList({ account: loginAccount, list: list || [] }));
  };

export const setupGroupMembers =
  (id: string, endpoint: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const members = Array<GroupMember>().concat(await getGroupMembers(id, endpoint));
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
    dispatch(setGroupMemberList({ id, members }));
    return members;
  };

export const setupGroupActivity =
  (groupName: string, id: string) => async (dispatch: AppDispatch) => {
    const activities = await getGroupActivities(numberToHex(Number(id), { size: 32 }));

    dispatch(setGroupActivity({ groupName, activities }));
  };

export default groupSlice.reducer;
