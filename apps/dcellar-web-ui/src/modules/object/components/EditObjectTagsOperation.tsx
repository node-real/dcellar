import { ManageTags, getValidTags } from '@/components/common/ManageTags';
import { useAppDispatch, useAppSelector } from '@/store';
import { useUnmount } from 'ahooks';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { setEditObjectTagsData } from '@/store/slices/object';

export const EditObjectTagsOperation = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const { editTagsData } = useAppSelector((root) => root.object);

  const onSave = async (updateTags: ResourceTags_Tag[]) => {
    const validTags = getValidTags(updateTags);
    dispatch(setEditObjectTagsData(validTags));
    onClose();
  };

  useUnmount(onClose);

  return <ManageTags tags={editTagsData} onCancel={onClose} onSave={onSave} />;
};
