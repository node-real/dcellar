import React, { memo, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import {
  GroupMember,
  selectMemberList,
  setMemberListPage,
  setSelectedGroupMember,
  setupGroupMembers,
} from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { useAsyncEffect, useUnmount } from 'ahooks';
import {
  Box,
  Divider,
  Flex,
  MenuButton,
  QDrawerBody,
  QDrawerHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { DCComboBox } from '@/components/common/DCComboBox';
import { DCButton } from '@/components/common/DCButton';
import { addMemberToGroup, removeMemberFromGroup } from '@/facade/group';
import { RenderItem } from '@/components/common/DCComboBox/RenderItem';
import { MsgUpdateGroupMemberTypeUrl, toTimestamp } from '@bnb-chain/greenfield-js-sdk';
import { ConfirmModal } from '@/components/common/DCModal/ConfirmModal';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { SimplePagination } from '@/components/common/DCTable/SimplePagination';
import { trimAddress } from '@/utils/string';
import styled from '@emotion/styled';
import { Loading } from '@/components/common/Loading';
import { Avatar } from '@/components/Avatar';
import { ADDRESS_RE } from '@/utils/constant';
import { IconFont } from '@/components/IconFont';
import { DCMenu } from '@/components/common/DCMenu';
import { MenuOption } from '@/components/common/DCMenuList';
import { Animates } from '@/components/AnimatePng';
import { DCCheckbox } from '@/components/common/DCCheckbox';
import { uniq, without, xor } from 'lodash-es';
import cn from 'classnames';
import dayjs, { Dayjs } from 'dayjs';

const menus: MenuOption[] = [
  { label: 'Member', value: 'member' },
  { label: 'Remove', value: 'remove', variant: 'danger' },
];

const MAX_COUNT = 20;
const MEMBER_SIZE = 20;

interface GroupMemberOperationProps {
  selectGroup: GroupInfo;
  onClose?: () => void;
}

export const GroupMemberOperation = memo<GroupMemberOperationProps>(function GroupMemberOperation({
  selectGroup: addGroupMember,
}) {
  const dispatch = useAppDispatch();
  const [values, setValues] = useState<string[]>([]);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { memberListPage, groupMembers, selectedGroupMember } = useAppSelector(
    (root) => root.group,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const [confirmModal, setConfirmModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [removeAccount, setRemoveAccount] = useState<string[]>([]);
  const memberList = useAppSelector(selectMemberList(addGroupMember.id));
  const { spInfo, oneSp } = useAppSelector((root) => root.sp);
  const memberListLoading = addGroupMember.id && !(addGroupMember.id in groupMembers);
  const [expiration, setExpiration] = useState<Dayjs>();
  const { page, canPrev, canNext } = useTableNav<GroupMember>({
    list: memberList,
    sorter: ['UpdateAt', 'descend'],
    pageSize: MEMBER_SIZE,
    currentPage: memberListPage,
  });

  useUnmount(() => {
    dispatch(setMemberListPage(0));
  });

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: 'Update Failed',
            icon: 'status-failed',
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
          }),
        );
    }
  };

  const _onChange = (_e: string[]) => {
    const e = _e.map((i) => i.trim());
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
      setStatusDetail({ icon: Animates.group, title: 'Updating Group', desc: WALLET_CONFIRM }),
    );
    const membersToAdd = values.map((item) => ({
      member: item,
      expirationTime: toTimestamp(expiration!.toDate()),
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
      setStatusDetail({ icon: Animates.group, title: 'Updating Group', desc: WALLET_CONFIRM }),
    );
    const payload = {
      operator: loginAccount,
      groupOwner: loginAccount,
      groupName: addGroupMember.groupName,
      membersToAdd: [],
      membersToDelete: removeAccount,
    };
    const [txRes, txError] = await removeMemberFromGroup(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Members removed successfully!' });
    updateMemberList(removeAccount[0], true);
    dispatch(setSelectedGroupMember(without(selectedGroupMember, ...removeAccount)));
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

  const fee = gasObjects?.[MsgUpdateGroupMemberTypeUrl]?.gasFee || 0;

  const removeFee = (gasObjects?.[MsgUpdateGroupMemberTypeUrl]?.gasFee || 0) * removeAccount.length;

  const onSelectChange = (value: string) => {
    dispatch(setSelectedGroupMember(xor(selectedGroupMember, [value])));
  };

  const indeterminate = page.some((i) => selectedGroupMember.includes(i.AccountId));
  const accounts = without(
    page.map((i) => i.AccountId),
    loginAccount,
  );
  const allChecked = accounts.every((i) => selectedGroupMember.includes(i)) && !!accounts.length;

  const onSelectAllChange = () => {
    if (allChecked) {
      // cancel all
      dispatch(setSelectedGroupMember(without(selectedGroupMember, ...accounts)));
    } else {
      // select all
      dispatch(setSelectedGroupMember(uniq(selectedGroupMember.concat(accounts))));
    }
  };

  useUnmount(() => {
    dispatch(setSelectedGroupMember([]));
  });

  const members = selectedGroupMember.length;

  useEffect(() => {
    if (members > MAX_COUNT) {
      toast.error({
        description: `Exceed the permission limit (${MAX_COUNT}). Please select fewer items or repeat this action multiple times.`,
      });
    }
  }, [members]);

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
        confirmText="Remove"
        isOpen={deleteModal}
        ga={{
          gaClickCloseName: 'dc.group.remove_member_confirm.modal.show',
          gaShowName: 'dc.group.remove_member_confirm.close.click',
          balanceClickName: 'dc.group.remove_member_confirm.depost.show',
          balanceShowName: 'dc.group.remove_member_confirm.transferin.click',
          cancelButton: 'dc.group.remove_member_confirm.cancel.click',
          confirmButton: 'dc.group.remove_member_confirm.delete.click',
        }}
        title="Remove Member"
        fee={removeFee}
        onConfirm={onRemoveMember}
        onClose={() => {
          setDeleteModal(false);
        }}
        variant={'scene'}
        description={`Are you sure you want to remove ${
          removeAccount.length === 1 ? trimAddress(removeAccount[0]) : 'these members'
        } from the group?`}
      />
      <>
        <QDrawerHeader>Group Members</QDrawerHeader>
        <QDrawerBody>
          <Flex gap={12}>
            <DCComboBox
              dateChange={setExpiration}
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
              size={'lg'}
              w={90}
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
          <Box my={16}>
            <Divider />
            {memberListLoading ? (
              <Loading my={24} />
            ) : (
              <>
                <Thead>
                  <DCCheckbox
                    indeterminate={indeterminate && !allChecked}
                    checked={allChecked}
                    onChange={onSelectAllChange}
                    disabled={!accounts.length}
                  >
                    <Text fontWeight={600} color={'readable.normal'}>
                      Members{members > 0 && `(${members})`}
                    </Text>
                  </DCCheckbox>
                  <RemoveBtn
                    className={cn({ disabled: !members || members > MAX_COUNT })}
                    onClick={() => {
                      if (!members || members > MAX_COUNT) return;
                      setRemoveAccount(selectedGroupMember);
                      setDeleteModal(true);
                    }}
                  >
                    Remove
                  </RemoveBtn>
                </Thead>
                <Flex direction="column" gap={8}>
                  {page.map((p) => {
                    const owner = loginAccount === p.AccountId;
                    const expirationTime = p.ExpirationTime ? p.ExpirationTime * 1000 : 0;
                    return (
                      <Row
                        key={p.AccountId}
                        className={cn({
                          'select-disabled': owner,
                          selected: selectedGroupMember.includes(p.AccountId),
                        })}
                      >
                        <DCCheckbox
                          disabled={owner}
                          checked={selectedGroupMember.includes(p.AccountId)}
                          onChange={() => onSelectChange(p.AccountId)}
                        >
                          <Flex alignItems="center" h={40}>
                            <Box key={p.AccountId} title={p.AccountId}>
                              <Avatar id={p.AccountId} w={32} />
                            </Box>
                            <Flex lineHeight="normal" ml={8} flex={1} flexDirection="column">
                              <Text
                                flex={1}
                                fontWeight={500}
                                title={p.AccountId}
                                color={'readable.normal'}
                                lineHeight="17px"
                              >
                                {trimAddress(p.AccountId)}
                                {owner && <> (you)</>}
                              </Text>
                              {!owner && !!expirationTime && (
                                <Text
                                  fontSize={12}
                                  mt={2}
                                  lineHeight="15px"
                                  color={
                                    dayjs().isBefore(dayjs(expirationTime))
                                      ? 'readable.disabled'
                                      : 'scene.danger.normal'
                                  }
                                >
                                  Expire date: {dayjs(expirationTime).format('D MMM, YYYY')}
                                </Text>
                              )}
                            </Flex>
                          </Flex>
                        </DCCheckbox>
                        <Operation>
                          {owner ? (
                            <Text mr={4}>Owner</Text>
                          ) : (
                            <DCMenu
                              strategy="fixed"
                              value="member"
                              selectIcon
                              placement="bottom-start"
                              options={menus}
                              stopPropagation={false}
                              onMenuSelect={({ value }) => {
                                if (value !== 'remove') return;
                                setRemoveAccount([p.AccountId]);
                                setDeleteModal(true);
                              }}
                            >
                              {({ isOpen }) => (
                                <StyledMenuButton as={Text}>
                                  Viewer
                                  <IconFont type={isOpen ? 'menu-open' : 'menu-close'} w={16} />
                                </StyledMenuButton>
                              )}
                            </DCMenu>
                          )}
                        </Operation>
                      </Row>
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
      </>
    </>
  );
});

const RemoveBtn = styled.span`
  font-weight: 500;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  &.disabled {
    cursor: not-allowed;
    color: var(--ui-colors-readable-disable);
  }
  :not(.disabled):hover {
    background: #f5f5f5;
  }
`;

const Thead = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  height: 36px;
  margin: 8px 0;
  position: relative;
  .ant-checkbox {
    margin: 2px;
  }
`;

const Row = styled(Flex)`
  position: relative;
  .ant-checkbox-wrapper {
    flex: 1;
  }
  :not(.select-disabled, .selected):hover {
    background: var(--ui-colors-bg-bottom);
  }
  .ant-checkbox {
    margin: 2px;
  }
  &.selected {
    background: #00ba341a;
  }
`;

const Operation = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
`;

const StyledMenuButton = styled(MenuButton)`
  display: inline-flex;
  cursor: pointer;
  padding: 2px 0 2px 4px;
  border-radius: 2px;

  //:hover {
  //  background: #f5f5f5;
  //}
`;
