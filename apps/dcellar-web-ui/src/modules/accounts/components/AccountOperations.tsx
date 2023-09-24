import { memo, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useModalValues } from '@/hooks/useModalValues';
import { selectAccount, setAccountOperation, setupAccountDetail } from '@/store/slices/accounts';
import { DCDrawer } from '@/components/common/DCDrawer';
import { DCModal } from '@/components/common/DCModal';
import { OwnerDetailOperation } from '@/modules/accounts/components/OwnerDetailOperation';
import { PaymentDetailOperation } from '@/modules/accounts/components/PaymentDetailOperation';
import { useUnmount } from 'ahooks';
import { ModalCloseButton } from '@totejs/uikit';

interface AccountOperationsProps {}

export const AccountOperations = memo<AccountOperationsProps>(function AccountOperations() {
  const dispatch = useAppDispatch();
  const { accountOperation } = useAppSelector((root) => root.accounts);
  const [id, operation] = accountOperation;
  const isDrawer = ['oaDetail', 'paDetail'].includes(operation);
  const isModal = ['delete'].includes(operation);
  const _operation = useModalValues<AccountOperationsProps>(operation);
  const accountDetail = useAppSelector(selectAccount(id));
  const _accountDetail = useModalValues(accountDetail);

  const onClose = () => {
    dispatch(setAccountOperation(['', '']));
  };

  useUnmount(onClose);

  useEffect(() => {
    if (!id) return;
    dispatch(setupAccountDetail(id));
  }, [id]);

  const modalContent = useMemo(() => {
    switch (_operation) {
      case 'oaDetail':
        return <OwnerDetailOperation selectAccount={_accountDetail} />;
      case 'paDetail':
        return <PaymentDetailOperation selectAccount={_accountDetail} selectAccountId={id} />;
      default:
        return null;
    }
  }, [_operation, id, _accountDetail]);

  return (
    <>
      <DCDrawer isOpen={!!operation && isDrawer} onClose={onClose}>
        {modalContent}
      </DCDrawer>
      <DCModal isOpen={!!operation && isModal} onClose={onClose}>
        <ModalCloseButton />
        {modalContent}
      </DCModal>
    </>
  );
});
