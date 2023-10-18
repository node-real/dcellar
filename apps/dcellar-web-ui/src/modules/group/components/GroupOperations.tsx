import { memo, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { DCDrawer } from '@/components/common/DCDrawer';
import { DCModal } from '@/components/common/DCModal';
import { useModalValues } from '@/hooks/useModalValues';
import { GroupOperationsType, selectGroupList, setGroupOperation } from '@/store/slices/group';
import { find } from 'lodash-es';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { DetailGroupOperation } from '@/modules/group/components/DetailGroupOperation';
import { CreateGroupOperation } from '@/modules/group/components/CreateGroupOperation';
import { EditGroupOperation } from '@/modules/group/components/EditGroupOperation';
import { useUnmount } from 'ahooks';
import { ModalCloseButton } from '@totejs/uikit';
import { GroupMemberOperation } from '@/modules/group/components/GroupMemberOperation';

interface GroupOperationsProps {
  level?: 0 | 1;
}

export const GroupOperations = memo<GroupOperationsProps>(function GroupOperations({ level = 0 }) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { groupOperation } = useAppSelector((root) => root.group);
  const [id, operation] = groupOperation[level];
  const _operation = useModalValues<GroupOperationsType>(operation);
  const isDrawer = ['detail', 'create', 'edit', 'add'].includes(operation);
  const isModal = ['delete'].includes(operation);
  const groupList = useAppSelector(selectGroupList(loginAccount));
  const groupInfo = useMemo(() => {
    return find<GroupInfo>(groupList, (g) => g.id === id);
  }, [groupList, id]);
  const _groupInfo = useModalValues<GroupInfo>(groupInfo!);

  const onClose = () => {
    dispatch(setGroupOperation({ level, operation: ['', ''] }));
  };

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
      default:
        return null;
    }
  }, [_operation, _groupInfo]);

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
