import { ManageTags, getValidTags } from '@/components/common/ManageTags';
import { useAppDispatch, useAppSelector } from '@/store';
import { setObjectEditTagsData } from '@/store/slices/object';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { useUnmount } from 'ahooks';
import { memo } from 'react';

interface EditObjectTagsOperationProps {
  onClose: () => void;
}

export const EditObjectTagsOperation = memo<EditObjectTagsOperationProps>(
  function EditObjectTagsOperation({ onClose }) {
    const dispatch = useAppDispatch();
    const objectEditTagsData = useAppSelector((root) => root.object.objectEditTagsData);

    const onSave = async (updateTags: ResourceTags_Tag[]) => {
      const validTags = getValidTags(updateTags);
      dispatch(setObjectEditTagsData(validTags));
      onClose();
    };

    useUnmount(onClose);

    return <ManageTags tags={objectEditTagsData} onCancel={onClose} onSave={onSave} />;
  },
);
