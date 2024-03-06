import { Loading } from '@/components/common/Loading';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { BUTTON_GOT_IT } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { setGroupMemberListPage, setupGroupMembers } from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { Box, Divider, QDrawerBody, QDrawerHeader } from '@node-real/uikit';
import { useAsyncEffect } from 'ahooks';
import { memo } from 'react';
import { AddGroupMember } from '@/modules/group/components/AddGroupMember';
import { GroupMemberList } from '@/modules/group/components/GroupMemberList';
import { setSignatureAction } from '@/store/slices/global';

interface GroupMemberOperationProps {
  selectGroup: GroupInfo;
  onClose?: () => void;
}

export const GroupMemberOperation = memo<GroupMemberOperationProps>(function GroupMemberOperation({
  selectGroup: currentGroup,
}) {
  const dispatch = useAppDispatch();
  const groupMemberListRecords = useAppSelector((root) => root.group.groupMemberListRecords);
  const spRecords = useAppSelector((root) => root.sp.spRecords);
  const specifiedSp = useAppSelector((root) => root.sp.specifiedSp);

  const { setOpenAuthModal } = useOffChainAuth();

  const memberListLoading = currentGroup.id && !(currentGroup.id in groupMemberListRecords);

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setSignatureAction({
            title: 'Update Failed',
            icon: 'status-failed',
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setSignatureAction({})),
          }),
        );
    }
  };

  const updateMemberList = async (checkId: string, remove = false) => {
    dispatch(setGroupMemberListPage(0));
    const fetch = () => {
      return dispatch(setupGroupMembers(currentGroup.id, spRecords[specifiedSp].endpoint));
    };
    const members = await fetch();

    const needReFetch = remove
      ? members.some((m) => m.AccountId === checkId)
      : members.every((m) => m.AccountId !== checkId);

    if (!needReFetch) return;
    setTimeout(fetch, 1000);
  };

  useAsyncEffect(async () => {
    if (!currentGroup.id) return;
    dispatch(setupGroupMembers(currentGroup.id, spRecords[specifiedSp].endpoint));
  }, [dispatch, currentGroup.id]);

  return (
    <>
      <QDrawerHeader>Group Members</QDrawerHeader>
      <QDrawerBody>
        <AddGroupMember
          errorHandler={errorHandler}
          currentGroup={currentGroup}
          updateMemberList={updateMemberList}
        />
        <Box my={16}>
          <Divider />
          {memberListLoading ? (
            <Loading my={24} />
          ) : (
            <GroupMemberList
              errorHandler={errorHandler}
              currentGroup={currentGroup}
              updateMemberList={updateMemberList}
            />
          )}
        </Box>
      </QDrawerBody>
    </>
  );
});
