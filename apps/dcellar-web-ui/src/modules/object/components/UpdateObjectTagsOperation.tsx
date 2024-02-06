import { DEFAULT_TAG, ManageTags, getValidTags } from '@/components/common/ManageTags';
import { useAppDispatch, useAppSelector } from '@/store';
import { useUnmount } from 'ahooks';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { BUTTON_GOT_IT } from '@/modules/object/constant';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { useStatusModal } from '@/hooks/useStatusModal';
import { TAGS_UPDATED_SUCCESS, TAGS_UPDATE_FAILED, TAGS_UPDATING } from '@/constants/tags';
import { Animates } from '@/components/AnimatePng';
import { toast } from '@totejs/uikit';
import { setObjectTags, setEditObjectTagsData } from '@/store/slices/object';
import { updateObjectTags } from '@/facade/object';
import { useAccount } from 'wagmi';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';

export const UpdateObjectTagsOperation = ({
  id,
  object,
  onClose,
}: {
  id: string;
  object: ObjectMeta;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const { modal } = useStatusModal();
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { editTagsData } = useAppSelector((root) => root.object);
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

    if (!object) return;
    modal.start({
      title: TAGS_UPDATING,
      icon: Animates.group,
    });
    const [res, error] = await updateObjectTags(
      {
        tags: validTags,
        address: loginAccount,
        bucketName: object.ObjectInfo.BucketName,
        objectName: object.ObjectInfo.ObjectName,
      },
      connector!,
    );
    if (error) {
      return errorHandler(error);
    }
    dispatch(setObjectTags({ id, tags: validTags }));
    modal.end();
    onClose();
    toast.success({
      description: TAGS_UPDATED_SUCCESS,
    });
    dispatch(setEditObjectTagsData([DEFAULT_TAG]));
  };

  useUnmount(onClose);

  return <ManageTags tags={editTagsData} onCancel={onClose} onSave={onUpdate} />;
};
