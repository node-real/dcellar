import { DCDrawer } from '@/components/common/DCDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import { useUnmount } from 'ahooks';
import { setEditBucketPaymentAccount } from '@/store/slices/bucket';
import { ManagePaymentAccount } from './ManagePaymentAccount';

export const ManagePaymentAccountDrawer = () => {
  const dispatch = useAppDispatch();
  const { editPaymentAccount } = useAppSelector((root) => root.bucket);
  const [bucketName] = editPaymentAccount;
  const onClose = () => {
    dispatch(setEditBucketPaymentAccount(['', '']));
  };

  useUnmount(onClose);

  return (
    <DCDrawer isOpen={!!bucketName} onClose={onClose}>
      <ManagePaymentAccount onClose={onClose} />
    </DCDrawer>
  );
};
