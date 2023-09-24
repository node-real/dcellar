import React, { memo, useEffect, useState } from 'react';
import { useAppSelector } from '@/store';
import { DCModal } from '@/components/common/DCModal/index';
import {
  ButtonProps,
  Flex,
  Link,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
} from '@totejs/uikit';
import { GAS_FEE_DOC } from '@/modules/object/constant';
import { DCButton } from '@/components/common/DCButton';
import BigNumber from 'bignumber.js';
import { useUnmount } from 'ahooks';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/object/utils';

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
          bg={'bg.secondary'}
          padding={'16px'}
          width={'100%'}
          flexDirection={'column'}
          borderRadius="12px"
          gap={'4px'}
        >
          <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
            <Flex alignItems="center" mb="4px">
              <Text
                fontSize={'14px'}
                lineHeight={'28px'}
                fontWeight={400}
                color={'readable.tertiary'}
              >
                Gas Fee (
                <Link
                  href={GAS_FEE_DOC}
                  textDecoration={'underline'}
                  color="readable.disabled"
                  target="_blank"
                >
                  Pay by Owner Account
                </Link>
                )
              </Text>
            </Flex>
            <Text
              fontSize={'14px'}
              lineHeight={'28px'}
              fontWeight={400}
              color={'readable.tertiary'}
            >
              {renderFeeValue(String(fee), exchangeRate)}
            </Text>
          </Flex>
        </Flex>
        <Flex w={'100%'} justifyContent={'space-between'} mt="8px" mb={'36px'}>
          <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
            {renderInsufficientBalance(fee + '', '0', availableBalance || '0', {
              gaShowName: balanceShowName,
              gaClickName: balanceClickName,
            })}
          </Text>
          <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
            Available balance: {renderBalanceNumber(availableBalance || '0')}
          </Text>
        </Flex>
      </ModalBody>
      <ModalFooter margin={0} flexDirection={'row'}>
        <DCButton size="lg" variant="ghost" flex={1} onClick={_onClose} gaClickName={cancelButton}>
          Cancel
        </DCButton>

        <DCButton
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
