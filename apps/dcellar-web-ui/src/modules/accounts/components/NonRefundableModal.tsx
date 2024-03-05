import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { DCModal } from '@/components/common/DCModal';
import { disablePaymentAccountRefund } from '@/facade/account';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditingPaymentAccountRefundable, setupAccountInfo } from '@/store/slices/accounts';
import { TStatusDetail, setStatusDetail } from '@/store/slices/object';
import { ModalBody, ModalCloseButton, ModalFooter, Text } from '@node-real/uikit';
import { memo } from 'react';
import { useAccount } from 'wagmi';

interface NonRefundableModal {}

export const NonRefundableModal = memo<NonRefundableModal>(function NonRefundableModal() {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const editingPaymentAccountRefundable = useAppSelector(
    (root) => root.accounts.editingPaymentAccountRefundable,
  );

  const { connector } = useAccount();

  const isOpen = !!editingPaymentAccountRefundable;

  const onClose = () => {
    dispatch(setEditingPaymentAccountRefundable(''));
  };

  const onContinueClick = async () => {
    if (!connector) return;
    onClose();
    dispatch(
      setStatusDetail({
        icon: 'account-failed',
        title: 'Set as Non-Refundable',
        desc: 'Please confirm the transaction in your wallet.',
      }),
    );
    const [res, error] = await disablePaymentAccountRefund(
      { address: loginAccount, paymentAccount: editingPaymentAccountRefundable },
      connector,
    );
    if (error || (res && res.code !== 0)) {
      let msg = error as string;
      if (
        error?.toLocaleLowerCase().includes('payment account has already be set as non-refundable')
      ) {
        msg = 'This payment account has already be set as non-refundable.';
      }
      return dispatch(
        setStatusDetail({
          title: 'Set Failed',
          icon: 'account-failed',
          desc: msg,
        }),
      );
    }
    dispatch(setupAccountInfo(editingPaymentAccountRefundable));
    dispatch(setStatusDetail({} as TStatusDetail));
  };

  return (
    <DCModal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalBody display={'flex'} flexDirection={'column'} alignItems={'center'}>
        <IconFont type={'account-failed'} w={120} />
        <Text mt={32} fontSize={24} fontWeight={600}>
          Set as Non-Refundable
        </Text>
        <Text fontSize="16px" textAlign={'center'} marginTop="8px" color={'readable.tertiary'}>
          Making this payment account non-refundable means it can&apos;t be refunded anymore and
          this action can&apos;t be undone.
        </Text>
      </ModalBody>
      <ModalFooter flexDirection={'row'}>
        <DCButton
          size={'lg'}
          variant="ghost"
          flex={1}
          onClick={onClose}
          gaClickName="dc.payment_account.delete_confirm.cancel.click"
        >
          Cancel
        </DCButton>
        <DCButton
          size={'lg'}
          gaClickName="dc.payment_account.delete_confirm.delete.click"
          flex={1}
          onClick={onContinueClick}
        >
          Continue
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
});
