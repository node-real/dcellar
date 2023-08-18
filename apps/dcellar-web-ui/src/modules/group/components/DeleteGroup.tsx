import React, { memo, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { setRemoveGroup, setupGroups } from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import {
  BUTTON_GOT_IT,
  FILE_DELETE_GIF,
  FILE_FAILED_URL,
  GROUP_DELETE,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/file/constant';
import { useUnmount } from 'ahooks';
import { Flex, ModalCloseButton, ModalFooter, ModalHeader, Text, toast } from '@totejs/uikit';
import { DCModal } from '@/components/common/DCModal';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/file/utils';
import { setupTmpAvailableBalance } from '@/store/slices/global';
import { MsgDeleteGroupTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { trimLongStr } from '@/utils/string';
import { DCButton } from '@/components/common/DCButton';
import BigNumber from 'bignumber.js';
import { deleteGroup } from '@/facade/group';

interface DeleteGroupProps {}

export const DeleteGroup = memo<DeleteGroupProps>(function DeleteGroup() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { removeGroup } = useAppSelector((root) => root.group);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { price: exchangeRate } = useAppSelector((root) => root.global.bnb);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const [loading, setLoading] = useState(false);
  const isOpen = !!removeGroup.groupName;
  const [open, setOpen] = useState(isOpen); // for modal close animation

  useEffect(() => {
    if (!isOpen) return;
    setOpen(isOpen);
  }, [isOpen, dispatch]);

  const onClose = () => {
    setOpen(false);
    setTimeout(() => {
      dispatch(setRemoveGroup({} as GroupInfo));
    }, 200);
  };

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: 'Delete Failed',
            icon: FILE_FAILED_URL,
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
          }),
        );
    }
  };

  const onRemove = async () => {
    setLoading(true);
    onClose();
    const payload = {
      operator: loginAccount,
      groupName: removeGroup.groupName,
    };
    dispatch(setStatusDetail({ icon: FILE_DELETE_GIF, title: GROUP_DELETE, desc: WALLET_CONFIRM }));
    const [txRes, txError] = await deleteGroup(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Group deleted successfully!' });
    dispatch(setupGroups(loginAccount));
  };

  useEffect(() => {
    dispatch(setupTmpAvailableBalance(loginAccount));
  }, [isOpen]);

  useUnmount(() => {
    onClose();
  });

  const description = `Are you sure to delete this group ”${trimLongStr(
    removeGroup.groupName,
    16,
    16,
    0,
  )}”? `;
  const fee = gasObjects?.[MsgDeleteGroupTypeUrl]?.gasFee || 0;

  const buttonDisabled = new BigNumber(availableBalance).minus(fee).isNegative();

  return (
    <DCModal
      isOpen={open}
      onClose={onClose}
      w="568px"
      gaShowName="dc.group.delete_confirm.modal.show"
      gaClickCloseName="dc.group.delete_confirm.close.click"
    >
      <ModalHeader>Confirm Delete</ModalHeader>
      <ModalCloseButton />
      <Text
        fontSize="18px"
        lineHeight={'22px'}
        fontWeight={400}
        textAlign={'center'}
        marginTop="8px"
        color={'readable.secondary'}
        mb={'32px'}
      >
        {description}
      </Text>
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
              Gas Fee
            </Text>
          </Flex>
          <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
            {renderFeeValue(String(fee), exchangeRate)}
          </Text>
        </Flex>
      </Flex>
      <Flex w={'100%'} justifyContent={'space-between'} mt="8px" mb={'36px'}>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
          {renderInsufficientBalance(fee + '', '0', availableBalance || '0', {
            gaShowName: 'dc.group.delete_confirm.depost.show',
            gaClickName: 'dc.group.delete_confirm.transferin.click',
          })}
        </Text>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
          Available balance: {renderBalanceNumber(availableBalance || '0')}
        </Text>
      </Flex>
      <ModalFooter margin={0} flexDirection={'row'}>
        <DCButton
          variant={'dcGhost'}
          flex={1}
          onClick={onClose}
          gaClickName="dc.file.delete_confirm.cancel.click"
        >
          Cancel
        </DCButton>
        <DCButton
          gaClickName="dc.file.delete_confirm.delete.click"
          variant={'dcDanger'}
          flex={1}
          onClick={onRemove}
          colorScheme="danger"
          isLoading={loading}
          isDisabled={buttonDisabled}
        >
          Delete
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
});
