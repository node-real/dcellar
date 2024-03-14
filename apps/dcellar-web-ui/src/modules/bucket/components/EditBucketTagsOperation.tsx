import { ManageTags, getValidTags } from '@/components/common/ManageTags';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBucketTagsEditData } from '@/store/slices/bucket';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { memo } from 'react';

interface EditBucketTagsOperationProps {
  onClose: () => void;
}

export const EditBucketTagsOperation = memo<EditBucketTagsOperationProps>(
  function EditBucketTagsOperation({ onClose }) {
    const dispatch = useAppDispatch();
    const bucketEditTagsData = useAppSelector((root) => root.bucket.bucketEditTagsData);

    const onSave = async (updateTags: ResourceTags_Tag[]) => {
      const validTags = getValidTags(updateTags);
      dispatch(setBucketTagsEditData(validTags));
      onClose();
    };

    return <ManageTags tags={bucketEditTagsData} onCancel={onClose} onSave={onSave} />;
  },
);
