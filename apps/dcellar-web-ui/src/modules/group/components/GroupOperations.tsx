import { DCDrawer } from '@/components/common/DCDrawer';
import { DCModal } from '@/components/common/DCModal';
import { useModalValues } from '@/hooks/useModalValues';
import { CreateGroupOperation } from '@/modules/group/components/CreateGroupOperation';
import { DetailGroupOperation } from '@/modules/group/components/DetailGroupOperation';
import { EditGroupOperation } from '@/modules/group/components/EditGroupOperation';
import { GroupMemberOperation } from '@/modules/group/components/GroupMemberOperation';
import { useAppDispatch, useAppSelector } from '@/store';
import { GroupOperationsType, selectGroupList, setGroupOperation } from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { ModalCloseButton } from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import { find } from 'lodash-es';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { EditGroupTagsOperation } from './EditGroupTagsOperation';
import { UpdateGroupTagsOperation } from './UpdateGroupTagsOperation';

interface GroupOperationsProps {
  level?: 0 | 1;
}

export const GroupOperations = memo<GroupOperationsProps>(function GroupOperations({ level = 0 }) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const groupOperation = useAppSelector((root) => root.group.groupOperation);
  const groupList = useAppSelector(selectGroupList(loginAccount));

  const [id, operation] = groupOperation[level];
  const _operation = useModalValues<GroupOperationsType>(operation);
  const isDrawer = ['detail', 'create', 'edit', 'add', 'edit_tags', 'update_tags'].includes(
    operation,
  );
  const isModal = ['delete'].includes(operation);
  const groupInfo = useMemo(() => {
    return find<GroupInfo>(groupList, (g) => g.id === id);
  }, [groupList, id]);
  const _groupInfo = useModalValues<GroupInfo>(groupInfo!);

  const onClose = useCallback(() => {
    dispatch(setGroupOperation({ level, operation: ['', ''] }));
  }, [level, dispatch]);

  const modalContent = useMemo(() => {
    switch (_operation) {
      case 'detail':
        return <DetailGroupOperation selectGroup={_groupInfo} />;
      case 'create':
        return <CreateGroupOperation onClose={onClose} />;
      case 'edit':
        return <EditGroupOperation selectGroup={_groupInfo} onClose={onClose} />;
      case 'add':
        return <GroupMemberOperation selectGroup={_groupInfo} onClose={onClose} />;
      case 'edit_tags':
        return <EditGroupTagsOperation onClose={onClose} />;
      case 'update_tags':
        return <UpdateGroupTagsOperation group={groupInfo} onClose={onClose} />;
      default:
        return null;
    }
  }, [_operation, _groupInfo, onClose, groupInfo]);

  useEffect(() => {
    const className = 'overflow-hidden';
    const operation0 = groupOperation[0][1];
    const operation1 = groupOperation[1][1];
    if (!!operation0 || !!operation1) {
      document.documentElement.classList.add(className);
    } else {
      document.documentElement.classList.remove(className);
    }
  }, [groupOperation]);

  useUnmount(onClose);

  return (
    <>
      <DCDrawer isOpen={!!operation && isDrawer} onClose={onClose}>
        {modalContent}
      </DCDrawer>
      <DCModal isOpen={!!operation && isModal} onClose={onClose}>
        <ModalCloseButton />
        {modalContent}
      </DCModal>
    </>
  );
});
