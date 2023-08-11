import { Box, Flex, ModalCloseButton, ModalFooter, ModalHeader, Text, toast } from '@totejs/uikit';
import { useAccount } from 'wagmi';
import React, { useEffect, useState } from 'react';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  FILE_DELETE_GIF,
  FILE_DESCRIPTION_DELETE_ERROR,
  FILE_FAILED_URL,
  FILE_STATUS_DELETING,
  FILE_TITLE_DELETE_FAILED,
  FILE_TITLE_DELETING,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { reportEvent } from '@/utils/reportEvent';
import { getClient } from '@/base/client';
import {
  broadcastFault,
  createTxFault,
  E_OBJECT_NOT_EXISTS,
  E_OFF_CHAIN_AUTH,
  E_USER_REJECT_STATUS_NUM,
  simulateFault,
} from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addDeletedObject,
  setSelectedRowKeys,
  setStatusDetail,
  TStatusDetail,
} from '@/store/slices/object';
import { MsgDeleteObjectTypeUrl } from '@bnb-chain/greenfield-chain-sdk';
import { setTmpAccount, setupTmpAvailableBalance, TTmpAccount } from '@/store/slices/global';
import { createTmpAccount } from '@/facade/account';
import { parseEther } from 'ethers/lib/utils.js';
import { round } from 'lodash-es';
import { ColoredWaitingIcon } from '@totejs/icons';
import { resolve } from '@/facade/common';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';

interface modalProps {
  refetch: () => void;
  isOpen: boolean;
  cancelFn: () => void;
}

const renderQuota = (key: string, value: string) => {
  return (
    <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
      <Text fontSize={'14px'} lineHeight={'17px'} fontWeight={400} color={'readable.tertiary'}>
        {key}
      </Text>
      <Text fontSize={'14px'} lineHeight={'17px'} fontWeight={400} color={'readable.tertiary'}>
        {value}
      </Text>
    </Flex>
  );
};

const renderFee = (
  key: string,
  bnbValue: string,
  exchangeRate: number,
  keyIcon?: React.ReactNode,
) => {
  return (
    <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
      <Flex alignItems="center" mb="4px">
        <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
          {key}
        </Text>
        {keyIcon && (
          <Box ml="6px" mt={'-5px'}>
            {keyIcon}
          </Box>
        )}
      </Flex>
      <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
        {renderFeeValue(bnbValue, exchangeRate)}
      </Text>
    </Flex>
  );
};

export const BatchDeleteObject = ({ refetch, isOpen, cancelFn }: modalProps) => {
  const dispatch = useAppDispatch();
  const [lockFee, setLockFee] = useState('');
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { price: bnbPrice } = useAppSelector((root) => root.global.bnb);
  const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
  const { bucketName, objectsInfo, path } = useAppSelector((root) => root.object);
  const exchangeRate = +bnbPrice ?? 0;
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const [isModalOpen, setModalOpen] = useState(isOpen);
  const { setOpenAuthModal } = useOffChainAuth();

  const deleteObjects = selectedRowKeys.map((key) => {
    return objectsInfo[bucketName + '/' + key];
  });

  const onClose = () => {
    document.documentElement.style.overflowY = '';
    setModalOpen(false);
    cancelFn();
  };
  const { gasObjects } = useAppSelector((root) => root.global.gasHub);
  const simulateGasFee = gasObjects[MsgDeleteObjectTypeUrl]?.gasFee * deleteObjects.length ?? 0;
  const { connector } = useAccount();

  useEffect(() => {
    if (!isOpen) return;
    setModalOpen(isOpen);
    dispatch(setupTmpAvailableBalance(loginAccount));
  }, [isOpen, dispatch, loginAccount]);

  // useAsyncEffect(async () => {
  //   const totalPayloadSize = deleteObjects.reduce((acc, cur) => {
  //     return acc + Number(cur.object_info.payload_size);
  //   }, 0);
  //   let lockFeeInBNB = await getLockFee(totalPayloadSize, primarySp.operatorAddress);
  //   setLockFee(lockFeeInBNB);
  // }, [isOpen]);

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

  const setFailedStatusModal = (description: string, error: any) => {
    dispatch(
      setStatusDetail({
        icon: FILE_FAILED_URL,
        title: FILE_TITLE_DELETE_FAILED,
        desc: description,
        buttonText: BUTTON_GOT_IT,
        errorText: 'Error message: ' + error?.message ?? '',
        buttonOnClick: () => {
          dispatch(setStatusDetail({} as TStatusDetail));
        },
      }),
    );
  };
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
  const deleteObject = async (objectName: string, tmpAccount: TTmpAccount) => {
    const client = await getClient();
    const [delObjTx, delError] = await client.object
      .deleteObject({
        bucketName,
        objectName,
        operator: tmpAccount.address,
      })
      .then(resolve, createTxFault);
    if (delError) return [false, delError];

    const [simulateInfo, simulateError] = await delObjTx!
      .simulate({
        denom: 'BNB',
      })
      .then(resolve, simulateFault);
    if (simulateError) return [false, simulateError];

    const [txRes, error] = await delObjTx!
      .broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: tmpAccount.address,
        granter: loginAccount,
        privateKey: tmpAccount.privateKey,
      })
      .then(resolve, broadcastFault);

    if (error) return [false, error];
    if (txRes!.code === 0) {
      toast.success({
        description: `${objectName} deleted successfully.`,
      });
      reportEvent({
        name: 'dc.toast.file_delete.success.show',
      });
    } else {
      toast.error({ description: 'Delete file error.' });
    }
    return [true, ''];
  };

  const onConfirmDelete = async () => {
    try {
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
      if (!tmpAccount) {
        return errorHandler(err);
      }
      dispatch(setTmpAccount(tmpAccount));

      async function deleteInRow() {
        if (!tmpAccount) return;
        for await (let obj of deleteObjects) {
          const [success, error] = await deleteObject(obj.object_info.object_name, tmpAccount);
          if (error && error !== E_OBJECT_NOT_EXISTS) {
            errorHandler(error as string);
            return false;
          }
          dispatch(
            addDeletedObject({
              path: [bucketName, obj.object_info.object_name].join('/'),
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
    } catch (error: any) {
      setLoading(false);
      const { code = '' } = error;
      if (code && String(code) === E_USER_REJECT_STATUS_NUM) {
        dispatch(setStatusDetail({} as TStatusDetail));
        onClose();
        return;
      }
      // eslint-disable-next-line no-console
      console.error('Delete file error.', error);
      setFailedStatusModal(FILE_DESCRIPTION_DELETE_ERROR, error);
    }
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
        {/* {renderFee(
          'Unlocked storage fee',
          lockFee,
          exchangeRate,
          <Tips
            iconSize={'14px'}
            containerWidth={'308px'}
            tips={
              <Box width={'308px'} p="8px 12px">
                <Box
                  color={'readable.secondary'}
                  fontSize="14px"
                  lineHeight={'150%'}
                  wordBreak={'break-word'}
                >
                  We will unlock the storage fee after you delete the file.
                </Box>
              </Box>
            }
          />,
        )} */}
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
};
