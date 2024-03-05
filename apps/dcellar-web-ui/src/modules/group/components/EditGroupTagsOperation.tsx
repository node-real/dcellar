import { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { getValidTags, ManageTags } from '@/components/common/ManageTags';
import { setGroupTagsEditData } from '@/store/slices/group';
import { useUnmount } from 'ahooks';

interface EditGroupTagsOperationProps {
  onClose: () => void;
}

export const EditGroupTagsOperation = memo<EditGroupTagsOperationProps>(
  function EditGroupTagsOperation({ onClose }) {
    const dispatch = useAppDispatch();
    const groupEditTagsData = useAppSelector((root) => root.group.groupEditTagsData);

    const onSave = async (updateTags: ResourceTags_Tag[]) => {
      const validTags = getValidTags(updateTags);
      dispatch(setGroupTagsEditData(validTags));
      onClose();
    };

    useUnmount(onClose);

    return <ManageTags tags={groupEditTagsData} onCancel={onClose} onSave={onSave} />;
  },
);
