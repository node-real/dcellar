import { memo, useEffect, useState } from 'react';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { useUnmount } from 'ahooks';
import {
  GroupMember,
  selectMemberList,
  setGroupMemberListPage,
  setGroupSelectedMembers,
} from '@/store/slices/group';
import { TxConfirmModal } from '@/components/common/DCModal/TxConfirmModal';
import { trimAddress } from '@/utils/string';
import { GAContextProvider } from '@/context/GAContext';
import { MsgUpdateGroupMemberTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { Animates } from '@/components/AnimatePng';
import { UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { removeMemberFromGroup } from '@/facade/group';
import { Box, Flex, MenuButton, Text, toast } from '@node-real/uikit';
import { uniq, without, xor } from 'lodash-es';
import { useAccount } from 'wagmi';
import { DCCheckbox } from '@/components/common/DCCheckbox';
import cn from 'classnames';
import styled from '@emotion/styled';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { Avatar } from '@/components/Avatar';
import dayjs from 'dayjs';
import { DCMenu } from '@/components/common/DCMenu';
import { IconFont } from '@/components/IconFont';
import { SimplePagination } from '@/components/common/DCTable/SimplePagination';
import { MenuOption } from '@/components/common/DCMenuList';

const MEMBER_ACTIONS: MenuOption[] = [
  { label: 'Member', value: 'member' },
  { label: 'Remove', value: 'remove', variant: 'danger' },
];

const ITEM_LIMIT = 20;
const MEMBER_LIST_PAGE_SIZE = 20;

interface GroupMemberListProps {
  errorHandler: (error: string) => void;
  currentGroup: GroupInfo;
  updateMemberList: (checkId: string, remove?: boolean) => Promise<void>;
}

export const GroupMemberList = memo<GroupMemberListProps>(function GroupMemberList({
  errorHandler,
  currentGroup,
  updateMemberList,
}) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const groupSelectedMembers = useAppSelector((root) => root.group.groupSelectedMembers);
  const groupMemberListPage = useAppSelector((root) => root.group.groupMemberListPage);
  const gasObjects = useAppSelector((root) => root.global.gasInfo.gasObjects) || {};
  const memberList = useAppSelector(selectMemberList(currentGroup.id));

  const [deleteModal, setDeleteModal] = useState(false);
  const [removeAccount, setRemoveAccount] = useState<string[]>([]);

  const { connector } = useAccount();

  const fee = gasObjects?.[MsgUpdateGroupMemberTypeUrl]?.gasFee || 0;
  const memberCount = groupSelectedMembers.length;
  const { page, canPrev, canNext } = useTableNav<GroupMember>({
    list: memberList,
    sorter: ['UpdateAt', 'descend'],
    pageSize: MEMBER_LIST_PAGE_SIZE,
    currentPage: groupMemberListPage,
  });
  const indeterminate = page.some((i) => groupSelectedMembers.includes(i.AccountId));
  const accounts = without(
    page.map((i) => i.AccountId),
    loginAccount,
  );
  const allChecked = accounts.every((i) => groupSelectedMembers.includes(i)) && !!accounts.length;

  const onRemoveMember = async () => {
    dispatch(
      setStatusDetail({ icon: Animates.group, title: 'Updating Group', desc: WALLET_CONFIRM }),
    );
    const payload = {
      operator: loginAccount,
      groupOwner: loginAccount,
      groupName: currentGroup.groupName,
      membersToAdd: [],
      membersToDelete: removeAccount,
    };
    const [txRes, txError] = await removeMemberFromGroup(payload, connector!);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Members removed successfully!' });
    updateMemberList(removeAccount[0], true);
    dispatch(setGroupSelectedMembers(without(groupSelectedMembers, ...removeAccount)));
  };

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setGroupMemberListPage(groupMemberListPage + (next ? 1 : -1)));
    }
    dispatch(setGroupMemberListPage(0));
  };

  const onSelectChange = (value: string) => {
    dispatch(setGroupSelectedMembers(xor(groupSelectedMembers, [value])));
  };

  const onSelectAllChange = () => {
    const action = allChecked
      ? setGroupSelectedMembers(without(groupSelectedMembers, ...accounts))
      : setGroupSelectedMembers(uniq(groupSelectedMembers.concat(accounts)));
    dispatch(action);
  };

  useEffect(() => {
    if (memberCount > ITEM_LIMIT) {
      toast.error({
        description: `Exceed the permission limit (${ITEM_LIMIT}). Please select fewer items or repeat this action multiple times.`,
      });
    }
  }, [memberCount]);

  useUnmount(() => {
    dispatch(setGroupMemberListPage(0));
    dispatch(setGroupSelectedMembers([]));
  });

  return (
    <>
      <GAContextProvider prefix={'remove_member_confirm'}>
        <TxConfirmModal
          confirmText="Remove"
          isOpen={deleteModal}
          title="Remove Member"
          fee={fee}
          onConfirm={onRemoveMember}
          onClose={() => setDeleteModal(false)}
          variant={'scene'}
          description={`Are you sure you want to remove ${
            removeAccount.length === 1 ? trimAddress(removeAccount[0]) : 'these members'
          } from the group?`}
        />
      </GAContextProvider>
      <Thead>
        <DCCheckbox
          indeterminate={indeterminate && !allChecked}
          checked={allChecked}
          onChange={onSelectAllChange}
          disabled={!accounts.length}
        >
          <Text fontWeight={600} color={'readable.normal'}>
            Members{memberCount > 0 && `(${memberCount})`}
          </Text>
        </DCCheckbox>
        <RemoveBtn
          className={cn({ disabled: !memberCount || memberCount > ITEM_LIMIT })}
          onClick={() => {
            if (!memberCount || memberCount > ITEM_LIMIT) return;
            setRemoveAccount(groupSelectedMembers);
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
                selected: groupSelectedMembers.includes(p.AccountId),
              })}
            >
              <DCCheckbox
                disabled={owner}
                checked={groupSelectedMembers.includes(p.AccountId)}
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
                    zIndex={1300}
                    strategy="fixed"
                    value="member"
                    selectIcon
                    placement="bottom-start"
                    options={MEMBER_ACTIONS}
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
      {memberList.length > MEMBER_LIST_PAGE_SIZE && (
        <SimplePagination
          pageSize={MEMBER_LIST_PAGE_SIZE}
          canNext={canNext}
          canPrev={canPrev}
          pageChange={onPageChange}
          simple
        />
      )}
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
`;
