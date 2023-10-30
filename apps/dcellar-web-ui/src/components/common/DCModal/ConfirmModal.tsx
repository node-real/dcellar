import React, { memo, useEffect, useState } from 'react';
import { useAppSelector } from '@/store';
import { DCModal } from '@/components/common/DCModal/index';
import {
  ButtonProps,
  Divider,
  Flex,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
} from '@totejs/uikit';
import { DCButton } from '@/components/common/DCButton';
import BigNumber from 'bignumber.js';
import { useUnmount } from 'ahooks';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/object/utils';
import { GasFeeTips } from '@/modules/object/components/TotalFees/GasFeeTips';

interface ConfirmModalProps {
  onClose?: () => void;
  isOpen: boolean;
  description?: string;
  ga: {
    gaShowName?: string;
    gaClickCloseName?: string;
    balanceShowName: string;
    balanceClickName: string;
    cancelButton?: string;
    confirmButton?: string;
  };
  title: string;
  fee: string | number;
  onConfirm: () => void;
  variant?: ButtonProps['variant'];
  confirmText: string;
}

export const ConfirmModal = memo<ConfirmModalProps>(function ConfirmModal({
  onClose = () => {},
  isOpen,
  description,
  ga,
  title,
  fee,
  onConfirm,
  variant = 'brand',
  confirmText,
}) {
  const {
    gaClickCloseName,
    gaShowName,
    balanceClickName,
    balanceShowName,
    cancelButton,
    confirmButton,
  } = ga;
  const [open, setOpen] = useState(isOpen);
  const { price: exchangeRate } = useAppSelector((root) => root.global.bnb);
  const { bankBalance: availableBalance } = useAppSelector((root) => root.accounts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOpen(isOpen);
  }, [isOpen]);

  const _onClose = () => {
    // if (!isOpen) return;
    setOpen(false);
    setTimeout(onClose, 200);
  };

  useUnmount(_onClose);

  const _onConfirm = async () => {
    setLoading(true);
    _onClose();
    await onConfirm();
    setLoading(false);
  };

  const buttonDisabled = new BigNumber(availableBalance).minus(fee).isNegative();

  return (
    <DCModal
      isOpen={open}
      onClose={_onClose}
      w="568px"
      gaShowName={gaShowName}
      gaClickCloseName={gaClickCloseName}
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
              Owner Account balance: {renderBalanceNumber(availableBalance || '0')}
            </Text>
          </Flex>
        </Flex>
        {buttonDisabled && (
          <Flex w={'100%'} justifyContent={'space-between'} mt="8px">
            <Text fontSize={'14px'} color={'scene.danger.normal'}>
              {renderInsufficientBalance(fee + '', '0', availableBalance || '0', {
                gaShowName: balanceShowName,
                gaClickName: balanceClickName,
              })}
            </Text>
          </Flex>
        )}
      </ModalBody>
      <ModalFooter flexDirection={'row'}>
        <DCButton size="lg" variant="ghost" flex={1} onClick={_onClose} gaClickName={cancelButton}>
          Cancel
        </DCButton>

        <DCButton
          variant={variant !== 'brand' ? 'scene' : 'brand'}
          colorScheme={'danger'}
          size="lg"
          gaClickName={confirmButton}
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
