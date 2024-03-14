import { DCButton } from '@/components/common/DCButton';
import { DCModal } from '@/components/common/DCModal/index';
import { GasFeeTips } from '@/modules/object/components/TotalFees/GasFeeTips';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/object/utils';
import { useAppSelector } from '@/store';
import {
  ButtonProps,
  Divider,
  Flex,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
} from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import BigNumber from 'bignumber.js';
import { memo, useContext, useEffect, useState } from 'react';
import { GAContext } from '@/context/GAContext';

interface TxConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  fee: string | number;
  variant?: ButtonProps['variant'];
  confirmText: string;
  onClose?: () => void;
  onConfirm: () => void | Promise<void>;
}

export const TxConfirmModal = memo<TxConfirmModalProps>(function TxConfirmModal({
  isOpen,
  title,
  description,
  fee,
  variant = 'brand',
  confirmText,
  onClose = () => {},
  onConfirm,
}) {
  const exchangeRate = useAppSelector((root) => root.global.bnbUsdtExchangeRate);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const { prefix } = useContext(GAContext);
  const [open, setOpen] = useState(isOpen);
  const [loading, setLoading] = useState(false);

  const buttonDisabled = new BigNumber(bankBalance).minus(fee).isNegative();

  const _onClose = () => {
    // if (!isOpen) return;
    setOpen(false);
    setTimeout(onClose, 200);
  };

  const _onConfirm = async () => {
    setLoading(true);
    _onClose();
    await onConfirm();
    setLoading(false);
  };

  useUnmount(_onClose);

  useEffect(() => {
    if (!isOpen) return;
    setOpen(isOpen);
  }, [isOpen]);

  return (
    <DCModal
      isOpen={open}
      onClose={_onClose}
      w="568px"
      gaShowName={`${prefix}.modal.show`}
      gaClickCloseName={`${prefix}.close.click`}
    >
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text className="ui-modal-desc">{description}</Text>
        <Flex
          flexDirection={'column'}
          bg={'bg.bottom'}
          padding={'8px 12px'}
          width={'100%'}
          borderRadius="4px"
          gap={'8px'}
          alignItems={'stretch'}
        >
          <Flex
            fontSize={'14px'}
            fontWeight={600}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            <Text>Total Fees</Text>
            <Flex
              color={'readable.secondary'}
              alignItems="center"
              gap={4}
              justifySelf={'flex-end'}
              fontWeight={'400'}
            >
              {renderFeeValue(String(fee), exchangeRate)}
            </Flex>
          </Flex>
          <Divider borderColor={'readable.disable'} />
          <Flex alignItems={'center'} justifyContent={'space-between'} color={'readable.secondary'}>
            <Flex alignItems="center">
              <Text>Gas fee</Text>
              <GasFeeTips />
            </Flex>
            <Text>{renderFeeValue(String(fee), exchangeRate)}</Text>
          </Flex>
          <Flex justifyContent={'flex-end'}>
            <Text fontSize={'12px'} color={'readable.disabled'}>
              Owner Account balance: {renderBalanceNumber(bankBalance || '0')}
            </Text>
          </Flex>
        </Flex>
        {buttonDisabled && (
          <Flex w={'100%'} justifyContent={'space-between'} mt="8px">
            <Text fontSize={'14px'} color={'scene.danger.normal'}>
              {renderInsufficientBalance(fee + '', '0', bankBalance || '0', {
                gaShowName: `${prefix}.deposit.show`,
                gaClickName: `${prefix}.transferin.click`,
              })}
            </Text>
          </Flex>
        )}
      </ModalBody>
      <ModalFooter flexDirection={'row'}>
        <DCButton
          size="lg"
          variant="ghost"
          flex={1}
          onClick={_onClose}
          gaClickName={`${prefix}.cancel.click`}
        >
          Cancel
        </DCButton>

        <DCButton
          variant={variant !== 'brand' ? 'scene' : 'brand'}
          colorScheme={'danger'}
          size="lg"
          gaClickName={`${prefix}.${confirmText.toLowerCase()}.click`}
          flex={1}
          onClick={_onConfirm}
          isLoading={loading}
          isDisabled={buttonDisabled}
        >
          {confirmText}
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
});
