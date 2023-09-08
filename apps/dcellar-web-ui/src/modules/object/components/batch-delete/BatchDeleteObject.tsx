import { Flex, ModalCloseButton, ModalFooter, ModalHeader, Text, toast } from '@totejs/uikit';
import { useAccount } from 'wagmi';
import React, { memo, useEffect, useState } from 'react';
import { renderBalanceNumber, renderInsufficientBalance } from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  FILE_DELETE_GIF,
  FILE_FAILED_URL,
  FILE_STATUS_DELETING,
  FILE_TITLE_DELETE_FAILED,
  FILE_TITLE_DELETING,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { E_OBJECT_NOT_EXISTS, E_OFF_CHAIN_AUTH } from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addDeletedObject,
  setSelectedRowKeys,
  setStatusDetail,
  TStatusDetail,
} from '@/store/slices/object';
import { MsgCancelCreateObjectTypeUrl, MsgDeleteObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { setTmpAccount, setupTmpAvailableBalance } from '@/store/slices/global';
import { createTmpAccount } from '@/facade/account';
import { parseEther } from 'ethers/lib/utils.js';
import { round } from 'lodash-es';
import { ColoredWaitingIcon } from '@totejs/icons';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { cancelCreateObject, deleteObject } from '@/facade/object';
import { renderFee } from '../CancelObject';

interface modalProps {
  refetch: () => void;
  isOpen: boolean;
  cancelFn: () => void;
}

export const BatchDeleteObject = memo<modalProps>(function BatchDeleteObject({
  refetch,
  isOpen,
  cancelFn,
}) {
  const dispatch = useAppDispatch();
  const [lockFee, setLockFee] = useState('');
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { price: bnbPrice } = useAppSelector((root) => root.global.bnb);
  const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
  const { bucketName, objectsInfo } = useAppSelector((root) => root.object);
  const exchangeRate = +bnbPrice ?? 0;
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { bankBalance: availableBalance } = useAppSelector((root) => root.accounts);
  const [isModalOpen, setModalOpen] = useState(isOpen);
  const { setOpenAuthModal } = useOffChainAuth();
  const { gasObjects } = useAppSelector((root) => root.global.gasHub);
  const deleteFee = gasObjects[MsgDeleteObjectTypeUrl]?.gasFee || 0;
  const cancelFee = gasObjects[MsgCancelCreateObjectTypeUrl]?.gasFee || 0;

  const deleteObjects = selectedRowKeys.map((key) => {
    return objectsInfo[bucketName + '/' + key];
  });

  const onClose = () => {
    document.documentElement.style.overflowY = '';
    setModalOpen(false);
    cancelFn();
  };

  const simulateGasFee = deleteObjects.reduce(
    // @ts-ignore
    (pre, cur) => pre + (cur.ObjectInfo.ObjectStatus === 1 ? deleteFee : cancelFee),
    0,
  );
  const { connector } = useAccount();

  useEffect(() => {
    if (!isOpen) return;
    setModalOpen(isOpen);
    dispatch(setupTmpAvailableBalance(loginAccount));
  }, [isOpen, dispatch, loginAccount]);

  useEffect(() => {
    if (!simulateGasFee || Number(simulateGasFee) < 0) {
      setButtonDisabled(false);
      return;
    }
    const currentBalance = Number(availableBalance);
    if (currentBalance >= Number(simulateGasFee)) {
      setButtonDisabled(false);
      return;
    }
    setButtonDisabled(true);
  }, [simulateGasFee, availableBalance]);

  const description = 'Are you sure you want to delete these objects?';

  const errorHandler = (error: string) => {
    setLoading(false);
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: FILE_TITLE_DELETE_FAILED,
            icon: FILE_FAILED_URL,
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
          }),
        );
    }
  };

  const onConfirmDelete = async () => {
    setLoading(true);
    onClose();
    dispatch(
      setStatusDetail({
        icon: FILE_DELETE_GIF,
        title: FILE_TITLE_DELETING,
        desc: FILE_STATUS_DELETING,
      }),
    );
    const [tmpAccount, err] = await createTmpAccount({
      address: loginAccount,
      bucketName,
      amount: parseEther(round(Number(lockFee), 6).toString()).toString(),
      connector,
      actionType: 'delete',
    });
    if (!tmpAccount) return errorHandler(err);
    dispatch(setTmpAccount(tmpAccount));

    async function deleteInRow() {
      if (!tmpAccount) return;
      const { privateKey, address: operator } = tmpAccount;
      for await (let obj of deleteObjects) {
        const { ObjectName: objectName, ObjectStatus } = obj.ObjectInfo;
        const payload = {
          bucketName,
          objectName,
          loginAccount,
          operator,
          connector: connector!,
          privateKey,
        };
        // @ts-ignore
        const [txRes, error] = await (ObjectStatus === 1
          ? deleteObject(payload)
          : cancelCreateObject(payload));
        if (error && error !== E_OBJECT_NOT_EXISTS) {
          errorHandler(error as string);
          return false;
        }
        toast.success({ description: `${objectName} deleted successfully.` });
        dispatch(
          addDeletedObject({
            path: [bucketName, obj.ObjectInfo.ObjectName].join('/'),
            ts: Date.now(),
          }),
        );
      }
      return true;
    }

    toast.info({ description: 'Objects deleting', icon: <ColoredWaitingIcon /> });
    const success = await deleteInRow();
    refetch();
    onClose();

    if (success) {
      dispatch(setSelectedRowKeys([]));
      dispatch(setStatusDetail({} as TStatusDetail));
    }
    setLoading(false);
  };

  return (
    <DCModal
      isOpen={isModalOpen}
      onClose={onClose}
      w="568px"
      gaShowName="dc.file.delete_confirm.modal.show"
      gaClickCloseName="dc.file.delete_confirm.close.click"
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
        {renderFee('Gas Fee', simulateGasFee + '', exchangeRate, loading)}
      </Flex>
      <Flex w={'100%'} justifyContent={'space-between'} mt="8px" mb={'36px'}>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
          {renderInsufficientBalance(simulateGasFee + '', lockFee, availableBalance || '0', {
            gaShowName: 'dc.file.delete_confirm.depost.show',
            gaClickName: 'dc.file.delete_confirm.transferin.click',
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
          onClick={onConfirmDelete}
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
