import { Animates } from '@/components/AnimatePng';
import { DEFAULT_TAG, ManageTags, getValidTags } from '@/components/common/ManageTags';
import { TAGS_UPDATED_SUCCESS, TAGS_UPDATE_FAILED, TAGS_UPDATING } from '@/constants/tags';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { updateBucketTags } from '@/facade/bucket';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { BUTTON_GOT_IT, useStatusModal } from '@/hooks/useStatusModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { TBucket, setBucketTags, setEditBucketTagsData } from '@/store/slices/bucket';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { toast } from '@node-real/uikit';
import { useAccount } from 'wagmi';

export const UpdateBucketTagsOperation = ({
  bucket,
  onClose,
}: {
  bucket: TBucket;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();
  const { modal } = useStatusModal();
  const { setOpenAuthModal } = useOffChainAuth();
  const { editTagsData } = useAppSelector((root) => root.bucket);
  const { loginAccount } = useAppSelector((root) => root.persist);
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
    if (!bucket) return;
    modal.start({
      title: TAGS_UPDATING,
      icon: Animates.group,
    });
    const [res, error] = await updateBucketTags(
      {
        address: loginAccount,
        bucketName: bucket.BucketName,
        tags: validTags,
      },
      connector!,
    );
    if (error) {
      return errorHandler(error);
    }
    dispatch(setBucketTags({ bucketName: bucket.BucketName, tags: validTags }));
    modal.end();
    onClose();
    toast.success({
      description: TAGS_UPDATED_SUCCESS,
    });
    dispatch(setEditBucketTagsData([DEFAULT_TAG]));
  };

  return <ManageTags tags={editTagsData} onCancel={onClose} onSave={onUpdate} />;
};
