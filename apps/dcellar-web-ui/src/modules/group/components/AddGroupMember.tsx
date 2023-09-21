import React, { memo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import {
  GroupMember,
  selectMemberList,
  setAddGroupMember,
  setMemberListPage,
  setupGroupMembers,
} from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  GROUP_ICON,
  GROUP_UPDATE_EXTRA,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/file/constant';
import { useAsyncEffect, useUnmount, useUpdateEffect } from 'ahooks';
import { DCDrawer } from '@/components/common/DCDrawer';
import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  QDrawerBody,
  QDrawerHeader,
  rgba,
  Text,
  toast,
} from '@totejs/uikit';
import { DCComboBox } from '@/components/common/DCComboBox';
import { DCButton } from '@/components/common/DCButton';
import { addMemberToGroup, removeMemberFromGroup } from '@/facade/group';
import { RenderItem } from '@/components/common/DCComboBox/RenderItem';
import { ADDRESS_RE } from '@/utils/regex';
import { MsgUpdateGroupMemberTypeUrl, toTimestamp } from '@bnb-chain/greenfield-js-sdk';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import { ConfirmModal } from '@/components/common/DCModal/ConfirmModal';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { SimplePagination } from '@/components/common/DCTable/SimplePagination';
import { GROUP_MEMBER_AVATARS } from '@/modules/group/components/GroupDetail';
import { trimAddress } from '@/utils/string';
import TickIcon from '@/components/common/SvgIcon/TickIconLarge.svg';
import styled from '@emotion/styled';
import { Loading } from '@/components/common/Loading';
import { getTimestampInSeconds } from '@/utils/time';

const MAX_COUNT = 20;
const MEMBER_SIZE = 20;

interface AddMemberProps {}

export const AddGroupMember = memo<AddMemberProps>(function AddMember() {
  const dispatch = useAppDispatch();
  const [values, setValues] = useState<string[]>([]);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const {
    addGroupMember: _addGroupMember,
    memberListPage,
    groupMembers,
  } = useAppSelector((root) => root.group);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const { record: addGroupMember, from } = _addGroupMember;
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const [confirmModal, setConfirmModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [removeAccount, setRemoveAccount] = useState('');
  const memberList = useAppSelector(selectMemberList(addGroupMember.id));
  const { spInfo, oneSp } = useAppSelector((root) => root.sp);
  const memberListLoading = addGroupMember.id && !(addGroupMember.id in groupMembers);
  const { page, canPrev, canNext } = useTableNav<GroupMember>({
    list: memberList,
    sorter: ['UpdateAt', 'descend'],
    pageSize: MEMBER_SIZE,
    currentPage: memberListPage,
  });

  const onClose = () => {
    dispatch(setMemberListPage(0));
    dispatch(setAddGroupMember({ record: {} as GroupInfo, from: '' }));
  };

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: 'Update Failed',
            icon: FILE_FAILED_URL,
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
          }),
        );
    }
  };

  const _onChange = (e: string[]) => {
    setValues(e);
    const invalid = e.filter((i) => !i.match(ADDRESS_RE));
    setInvalidIds(invalid);
    if (e.length > MAX_COUNT) {
      setError(`Please enter less than ${MAX_COUNT} addresses. `);
    } else if (!e.length) {
      setError(`Please enter addresses. `);
    } else {
      setError('');
    }
  };

  const invalid = !!error || invalidIds.length > 0;

  const updateMemberList = async (checkId: string, remove = false) => {
    dispatch(setMemberListPage(0));
    const fetch = () => {
      return dispatch(setupGroupMembers(addGroupMember.id, spInfo[oneSp].endpoint));
    };
    const members = await fetch();

    const needReFetch = remove
      ? members.some((m) => m.AccountId === checkId)
      : members.every((m) => m.AccountId !== checkId);

    if (!needReFetch) return;
    setTimeout(fetch, 1000);
  };

  const onAddMember = async () => {
    setLoading(true);
    dispatch(
      setStatusDetail({ icon: GROUP_ICON, title: GROUP_UPDATE_EXTRA, desc: WALLET_CONFIRM }),
    );
    const curTimeStamp = await getTimestampInSeconds();
    const expirationTimestamp = Math.floor(curTimeStamp + 10 * 60 * 60);
    const expirationDate = new Date(expirationTimestamp);
    const membersToAdd = values.map((item) => ({
      member: item,
      expirationTime: toTimestamp(expirationDate),
    }));

    const payload = {
      operator: loginAccount,
      groupOwner: loginAccount,
      groupName: addGroupMember.groupName,
      membersToAdd,
      membersToDelete: [],
    };

    const [txRes, txError] = await addMemberToGroup(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Members added successfully!' });
    updateMemberList(values[0]);
    setValues([]);
  };

  const onRemoveMember = async () => {
    setLoading(true);
    dispatch(
      setStatusDetail({ icon: GROUP_ICON, title: GROUP_UPDATE_EXTRA, desc: WALLET_CONFIRM }),
    );
    const payload = {
      operator: loginAccount,
      groupOwner: loginAccount,
      groupName: addGroupMember.groupName,
      membersToAdd: [],
      membersToDelete: [removeAccount],
    };
    const [txRes, txError] = await removeMemberFromGroup(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Members removed successfully!' });
    updateMemberList(removeAccount, true);
  };

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setMemberListPage(memberListPage + (next ? 1 : -1)));
    }
    dispatch(setMemberListPage(0));
  };

  useAsyncEffect(async () => {
    if (!addGroupMember.id) return;
    dispatch(setupGroupMembers(addGroupMember.id, spInfo[oneSp].endpoint));
  }, [dispatch, addGroupMember.id]);

  useUnmount(onClose);

  useUpdateEffect(() => {
    if (addGroupMember.groupName) return;
    setError('');
    setValues([]);
    setInvalidIds([]);
  }, [addGroupMember.groupName]);

  const fee = gasObjects?.[MsgUpdateGroupMemberTypeUrl]?.gasFee || 0;

  return (
    <>
      <ConfirmModal
        confirmText="Confirm"
        isOpen={confirmModal}
        ga={{
          gaClickCloseName: 'dc.group.add_member_confirm.modal.show',
          gaShowName: 'dc.group.add_member_confirm.close.click',
          balanceClickName: 'dc.group.add_member_confirm.depost.show',
          balanceShowName: 'dc.group.add_member_confirm.transferin.click',
          cancelButton: 'dc.group.add_member_confirm.cancel.click',
          confirmButton: 'dc.group.add_member_confirm.delete.click',
        }}
        title="Confirm Action"
        fee={fee}
        onConfirm={onAddMember}
        onClose={() => {
          setConfirmModal(false);
        }}
        description="Are you sure you want to add members to this group?"
      />
      <ConfirmModal
        confirmText="Confirm"
        isOpen={deleteModal}
        ga={{
          gaClickCloseName: 'dc.group.remove_member_confirm.modal.show',
          gaShowName: 'dc.group.remove_member_confirm.close.click',
          balanceClickName: 'dc.group.remove_member_confirm.depost.show',
          balanceShowName: 'dc.group.remove_member_confirm.transferin.click',
          cancelButton: 'dc.group.remove_member_confirm.cancel.click',
          confirmButton: 'dc.group.remove_member_confirm.delete.click',
        }}
        title="Confirm Action"
        fee={fee}
        onConfirm={onRemoveMember}
        onClose={() => {
          setDeleteModal(false);
        }}
        description={`Are you sure you want to remove ${trimAddress(
          removeAccount,
        )} from this group?`}
      />
      <DCDrawer isOpen={!!addGroupMember.groupName} onClose={onClose}>
        <QDrawerHeader alignItems="center" lineHeight="normal">
          Group Members
        </QDrawerHeader>
        <QDrawerBody>
          <Flex gap={12}>
            <DCComboBox
              value={values}
              tokenSeparators={[',']}
              placeholder="Add address, comma separated"
              bordered={false}
              mode="tags"
              onChange={_onChange}
              tagRender={(props) => <RenderItem invalidIds={invalidIds} value={props} />}
              suffixIcon={
                <Text color="#1E2026" fontSize={14}>
                  Member
                </Text>
              }
            />
            <DCButton
              w={90}
              h={48}
              onClick={() => {
                _onChange(values);
                if (!values.length || loading || invalid) return;
                setConfirmModal(true);
              }}
            >
              Add
            </DCButton>
          </Flex>
          {invalid && (
            <Text color="#EE3911">{!invalidIds.length ? error : 'Invalid addresses.'}</Text>
          )}
          <Box my={8}>
            {memberListLoading ? (
              <Loading my={24} />
            ) : (
              <>
                <Flex direction="column" gap={8}>
                  {page.map((p) => {
                    const Avatar = GROUP_MEMBER_AVATARS[p.AccountId.charCodeAt(20) % 5];
                    const owner = loginAccount === p.AccountId;
                    return (
                      <Flex key={p.AccountId} alignItems="center" h={40}>
                        <Box key={p.AccountId} title={p.AccountId}>
                          <Avatar />
                        </Box>
                        <Text flex={1} ml={8} fontWeight={500} title={p.AccountId}>
                          {trimAddress(p.AccountId)}
                          {owner && <> (you)</>}
                        </Text>
                        {owner ? (
                          'Owner'
                        ) : (
                          <Menu placement="bottom-start">
                            {({ isOpen }) => (
                              <>
                                <StyledMenuButton as={Text}>
                                  Member
                                  {isOpen ? (
                                    <MenuOpenIcon boxSize={16} color="#76808F" />
                                  ) : (
                                    <MenuCloseIcon boxSize={16} color="#76808F" />
                                  )}
                                </StyledMenuButton>
                                <StyledMenuList>
                                  <MenuItem bg={rgba('#00BA34', 0.1)} _hover={{ bg: undefined }}>
                                    <Tick />
                                    Member
                                  </MenuItem>
                                  <MenuItem
                                    _hover={{
                                      bg: 'bg.bottom',
                                    }}
                                    onClick={() => {
                                      setRemoveAccount(p.AccountId);
                                      setDeleteModal(true);
                                    }}
                                  >
                                    <Text color="#EE3911">Remove</Text>
                                  </MenuItem>
                                </StyledMenuList>
                              </>
                            )}
                          </Menu>
                        )}
                      </Flex>
                    );
                  })}
                </Flex>
                {memberList.length > MEMBER_SIZE && (
                  <SimplePagination
                    pageSize={MEMBER_SIZE}
                    canNext={canNext}
                    canPrev={canPrev}
                    pageChange={onPageChange}
                    simple
                  />
                )}
              </>
            )}
          </Box>
        </QDrawerBody>
      </DCDrawer>
    </>
  );
});

const StyledMenuButton = styled(MenuButton)`
  cursor: pointer;
  padding: 2px 0 2px 4px;
  border-radius: 2px;

  :hover {
    background: #f5f5f5;
  }

  svg {
    pointer-events: none;
  }
`;

const StyledMenuList = styled(MenuList)`
  border-radius: 4px;
  border: 1px solid #e6e8ea;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.08);
  margin-top: -6px;

  .ui-menu-item {
    padding-left: 32px;
    font-weight: 400;
  }
`;

const Tick = styled(TickIcon)`
  color: #00ba34;
  position: absolute;
  left: 8px;
`;
