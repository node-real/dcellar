import { DCDrawer } from '@/components/common/DCDrawer';
import { DEFAULT_TAG, ManageTag, getValidTags } from '@/components/common/ManageTag';
import { useAppDispatch, useAppSelector } from '@/store';
import { useUnmount } from 'ahooks';
import {
  ResourceTags_Tag,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { BUTTON_GOT_IT } from '@/modules/object/constant';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { useStatusModal } from '@/hooks/useStatusModal';
import { TAGS_UPDATED_SUCCESS, TAGS_UPDATE_FAILED, TAGS_UPDATING } from '@/constants/tags';
import { Animates } from '@/components/AnimatePng';
import { toast } from '@totejs/uikit';
import { updateBucketTags } from '@/facade/bucket';
import { setBucketTags, setEditBucketTags, setEditBucketTagsData } from '@/store/slices/bucket';
import { useAccount } from 'wagmi';

export const ManageBucketTagsDrawer = () => {
  const dispatch = useAppDispatch();
  const { modal } = useStatusModal();
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { editTags, editTagsData, bucketInfo} = useAppSelector((root) => root.bucket);
  const [bucketName, from] = editTags;
  const bucket = bucketInfo[bucketName];

  const onClose = () => {
    dispatch(setEditBucketTags(['', '']));
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
        if (!bucket) return;
        modal.start({
          title: TAGS_UPDATING,
          icon: Animates.group,
        });
        const [res, error] = await updateBucketTags({
          address: loginAccount,
          bucketName: bucket.BucketName,
          tags: validTags,
        }, connector!);
        if (error) {
          return errorHandler(error);
        }
        dispatch(setBucketTags({ bucketName: bucket.BucketName, tags: validTags }));
        modal.end();
        onClose();
        toast.success({
          description: TAGS_UPDATED_SUCCESS
        })
        dispatch(setEditBucketTagsData([DEFAULT_TAG]));
        break;
      case 'create':
        dispatch(setEditBucketTagsData(validTags));
        onClose();
      default:
        break;
    }
  };

  useUnmount(onClose);

  return (
    <DCDrawer isOpen={!!bucketName} onClose={onClose}>
      <ManageTag tags={editTagsData} onCancel={onClose} onSave={onSave} />
    </DCDrawer>
  );
};
