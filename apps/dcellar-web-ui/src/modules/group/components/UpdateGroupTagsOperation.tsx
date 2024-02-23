import { Animates } from '@/components/AnimatePng';
import { DEFAULT_TAG, ManageTags, getValidTags } from '@/components/common/ManageTags';
import { TAGS_UPDATED_SUCCESS, TAGS_UPDATE_FAILED, TAGS_UPDATING } from '@/constants/tags';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { updateGroupTags } from '@/facade/group';
import { useStatusModal } from '@/hooks/useStatusModal';
import { BUTTON_GOT_IT } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditGroupTagsData, setGroupTags } from '@/store/slices/group';
import {
  GroupInfo,
  ResourceTags_Tag,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { toast } from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import { useAccount } from 'wagmi';

export const UpdateGroupTagsOperation = ({
  group,
  onClose,
}: {
  group?: GroupInfo;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const { modal } = useStatusModal();
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { editTagsData } = useAppSelector((root) => root.group);

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

  const onUpdate = async (updateTags: ResourceTags_Tag[]) => {
    const validTags = getValidTags(updateTags);
    if (!group) return;
    modal.start({
      title: TAGS_UPDATING,
      icon: Animates.group,
    });
    const [res, error] = await updateGroupTags(
      {
        address: loginAccount,
        groupName: group?.groupName,
        tags: validTags,
      },
      connector!,
    );
    if (error) {
      return errorHandler(error);
    }
    dispatch(setGroupTags({ account: loginAccount, groupId: group.id, tags: validTags }));
    modal.end();
    onClose();
    toast.success({
      description: TAGS_UPDATED_SUCCESS,
    });
    dispatch(setEditGroupTagsData([DEFAULT_TAG]));
  };

  useUnmount(onClose);

  return <ManageTags tags={editTagsData} onCancel={onClose} onSave={onUpdate} />;
};
