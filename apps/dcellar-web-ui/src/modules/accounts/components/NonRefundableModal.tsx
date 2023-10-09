import { DCModal } from '@/components/common/DCModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditDisablePaymentAccount, setupAccountDetail } from '@/store/slices/accounts';
import React, { memo } from 'react';
import { ModalBody, ModalCloseButton, ModalFooter, Text } from '@totejs/uikit';
import { DCButton } from '@/components/common/DCButton';
import { disablePaymentAccountRefund } from '@/facade/account';
import { useAccount } from 'wagmi';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { IconFont } from '@/components/IconFont';

interface NonRefundableModal {}

export const NonRefundableModal = memo<NonRefundableModal>(function NonRefundableModal() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { editDisablePaymentAccount } = useAppSelector((state) => state.accounts);
  const isOpen = !!editDisablePaymentAccount;
  const onClose = () => {
    dispatch(setEditDisablePaymentAccount(''));
  };
  const { connector } = useAccount();

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
      { address: loginAccount, paymentAccount: editDisablePaymentAccount },
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
    dispatch(setupAccountDetail(editDisablePaymentAccount));
    dispatch(setStatusDetail({} as TStatusDetail));
  };

  return (
    <DCModal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalBody display={'flex'} flexDirection={'column'} alignItems={'center'}>
        <IconFont type={'account-failed'} w={120} />
        <Text mb={16} fontSize={24} fontWeight={600}>
          Set as Non-Refundable
        </Text>
        <Text
          fontSize="18px"
          lineHeight={'22px'}
          fontWeight={400}
          textAlign={'center'}
          marginTop="8px"
          color={'readable.secondary'}
          mb={'32px'}
        >
          Making this payment account non-refundable means it can't be refunded anymore and this
          action can't be undone.
        </Text>
      </ModalBody>
      <ModalFooter margin={0} flexDirection={'row'}>
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
