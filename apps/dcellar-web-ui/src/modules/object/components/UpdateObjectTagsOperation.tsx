import { Animates } from '@/components/AnimatePng';
import { DEFAULT_TAG, ManageTags, getValidTags } from '@/components/common/ManageTags';
import { TAGS_UPDATED_SUCCESS, TAGS_UPDATE_FAILED, TAGS_UPDATING } from '@/constants/tags';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { updateObjectTags } from '@/facade/object';
import { useStatusModal } from '@/hooks/useStatusModal';
import { BUTTON_GOT_IT } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { setObjectEditTagsData, setObjectTags } from '@/store/slices/object';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { toast } from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import { useAccount } from 'wagmi';
import { memo } from 'react';

interface UpdateObjectTagsOperationProps {
  id: string;
  object: ObjectMeta;
  onClose: () => void;
}

export const UpdateObjectTagsOperation = memo<UpdateObjectTagsOperationProps>(
  function UpdateObjectTagsOperation({ id, object, onClose }) {
    const dispatch = useAppDispatch();
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const objectEditTagsData = useAppSelector((root) => root.object.objectEditTagsData);

    const { connector } = useAccount();
    const { modal } = useStatusModal();
    const { setOpenAuthModal } = useOffChainAuth();

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
      dispatch(setObjectEditTagsData([DEFAULT_TAG]));
    };

    useUnmount(onClose);

    return <ManageTags tags={objectEditTagsData} onCancel={onClose} onSave={onUpdate} />;
  },
);
