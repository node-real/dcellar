import { DCDrawer } from '@/components/common/DCDrawer';
import { DEFAULT_TAG, ManageTag, getValidTags } from '@/components/common/ManageTag';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditGroupTags, setEditGroupTagsData, setGroupTags } from '@/store/slices/group';
import { useUnmount } from 'ahooks';
import { useMemo } from 'react';
import { selectGroupList } from '@/store/slices/group';
import { find } from 'lodash-es';
import {
  GroupInfo,
  ResourceTags_Tag,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { updateGroupTags } from '@/facade/group';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { BUTTON_GOT_IT } from '@/modules/object/constant';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { useStatusModal } from '@/hooks/useStatusModal';
import { TAGS_UPDATED_SUCCESS, TAGS_UPDATE_FAILED, TAGS_UPDATING } from '@/constants/tags';
import { Animates } from '@/components/AnimatePng';
import { toast } from '@totejs/uikit';

export const ManageGroupTagDrawer = () => {
  const dispatch = useAppDispatch();
  const { modal } = useStatusModal();
  const { setOpenAuthModal } = useOffChainAuth();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { editTags, editTagsData } = useAppSelector((root) => root.group);
  const [id, from] = editTags;
  const groupList = useAppSelector(selectGroupList(loginAccount));
  const groupInfo = useMemo(() => {
    return find<GroupInfo>(groupList, (g) => g.id === id);
  }, [groupList, id]);

  const onClose = () => {
    dispatch(setEditGroupTags(['', '']));
  };

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        modal.error({
          title: TAGS_UPDATE_FAILED,
          buttonText: BUTTON_GOT_IT,
          errorText: 'Error message: ' + error,
        });
        return;
    }
  };

  const onSave = async (updateTags: ResourceTags_Tag[]) => {
    const validTags = getValidTags(updateTags);
    switch (from) {
      case 'detail':
        if (!groupInfo) return;
        modal.start({
          title: TAGS_UPDATING,
          icon: Animates.group,
        });
        const [res, error] = await updateGroupTags({
          address: loginAccount,
          groupName: groupInfo?.groupName,
          tags: validTags,
        });
        if (error) {
          return errorHandler(error);
        }
        dispatch(setGroupTags({ account: loginAccount, groupId: groupInfo.id, tags: validTags }));
        modal.end();
        onClose();
        toast.success({
          description: TAGS_UPDATED_SUCCESS
        })
        dispatch(setEditGroupTagsData([DEFAULT_TAG]));
        break;

      case 'create':
        dispatch(setEditGroupTagsData(validTags));
        onClose();
      default:
        break;
    }
  };

  useUnmount(onClose);

  return (
    <DCDrawer isOpen={!!id} onClose={onClose}>
      <ManageTag tags={editTagsData} onCancel={onClose} onSave={onSave} />
    </DCDrawer>
  );
};
