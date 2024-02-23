import { ManageTags, getValidTags } from '@/components/common/ManageTags';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditGroupTagsData } from '@/store/slices/group';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { useUnmount } from 'ahooks';

export const EditGroupTagsOperation = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const { editTagsData } = useAppSelector((root) => root.group);

  const onSave = async (updateTags: ResourceTags_Tag[]) => {
    const validTags = getValidTags(updateTags);
    dispatch(setEditGroupTagsData(validTags));
    onClose();
  };

  useUnmount(onClose);

  return <ManageTags tags={editTagsData} onCancel={onClose} onSave={onSave} />;
};
