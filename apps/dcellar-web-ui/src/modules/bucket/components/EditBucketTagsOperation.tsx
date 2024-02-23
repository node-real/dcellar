import { ManageTags, getValidTags } from '@/components/common/ManageTags';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditBucketTagsData } from '@/store/slices/bucket';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';

export const EditBucketTagsOperation = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const { editTagsData } = useAppSelector((root) => root.bucket);
  const onSave = async (updateTags: ResourceTags_Tag[]) => {
    const validTags = getValidTags(updateTags);
    dispatch(setEditBucketTagsData(validTags));
    onClose();
  };

  return <ManageTags tags={editTagsData} onCancel={onClose} onSave={onSave} />;
};
