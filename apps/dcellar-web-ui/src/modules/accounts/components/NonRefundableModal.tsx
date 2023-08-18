import { DCModal } from '@/components/common/DCModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditDisablePaymentAccount } from '@/store/slices/accounts';
import React from 'react';
import { Image, ModalBody, ModalCloseButton, ModalFooter, Text } from '@totejs/uikit';
import { assetPrefix } from '@/base/env';
import { DCButton } from '@/components/common/DCButton';
import { disablePaymentAccountRefund } from '@/facade/account';
import { useAccount } from 'wagmi';
import { TStatusDetail, setStatusDetail } from '@/store/slices/object';
import { SET_ACCOUNT_NON_REFUNDABLE_ICON } from '@/modules/file/constant';

type Props = {
  refreshList: () => void;
};
export const NonRefundableModal = ({ refreshList }: Props) => {
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
        icon: SET_ACCOUNT_NON_REFUNDABLE_ICON,
        title: 'Set as Non-Refundable',
        desc: 'Confirm this transaction in your wallet.',
      }),
    );
    const [res, error] = await disablePaymentAccountRefund(
      { address: loginAccount, paymentAccount: editDisablePaymentAccount },
      connector,
    );
    if (error || res && res.code !== 0) {
      return dispatch(setStatusDetail({
        title: 'Set Failed',
        icon: SET_ACCOUNT_NON_REFUNDABLE_ICON,
        desc: error as string,
      }));
    }
    dispatch(setStatusDetail({} as TStatusDetail));
  };

  return (
    <DCModal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalBody display={'flex'} flexDirection={'column'} alignItems={'center'}>
      <Image
        alt="disable account icon"
        src={`${assetPrefix}/images/accounts/disable-account.svg`}
        width="120"
        height="120"
      />
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
          variant={'dcGhost'}
          flex={1}
          onClick={onClose}
          gaClickName="dc.payment_account.delete_confirm.cancel.click"
        >
          Cancel
        </DCButton>
        <DCButton
          gaClickName="dc.payment_account.delete_confirm.delete.click"
          variant={'dcDanger'}
          flex={1}
          onClick={onContinueClick}
          colorScheme="danger"
        >
          Continue
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
