import { DCDrawer } from '@/components/common/DCDrawer';
import { DCModal } from '@/components/common/DCModal';
import { useModalValues } from '@/hooks/useModalValues';
import { OwnerDetailOperation } from '@/modules/accounts/components/OwnerDetailOperation';
import { PaymentDetailOperation } from '@/modules/accounts/components/PaymentDetailOperation';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount, setAccountOperation, setupAccountInfo } from '@/store/slices/accounts';
import { ModalCloseButton } from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import { memo, useEffect, useMemo } from 'react';

interface AccountOperationsProps {}

export const AccountOperations = memo<AccountOperationsProps>(function AccountOperations() {
  const dispatch = useAppDispatch();
  const accountOperation = useAppSelector((root) => root.accounts.accountOperation);

  const [id, operation] = accountOperation;
  const _operation = useModalValues<AccountOperationsProps>(operation);
  const accountDetail = useAppSelector(selectAccount(id));
  const _accountDetail = useModalValues(accountDetail);

  const isDrawer = ['oaDetail', 'paDetail'].includes(operation);
  const isModal = ['delete', 'paCreate'].includes(operation);

  const onClose = () => {
    dispatch(setAccountOperation(['', '']));
  };

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

  useEffect(() => {
    if (!id) return;
    dispatch(setupAccountInfo(id));
  }, [id, dispatch]);

  useUnmount(onClose);

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
