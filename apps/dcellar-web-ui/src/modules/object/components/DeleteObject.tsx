import {
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  Text,
  Flex,
  toast,
  Box,
  Link,
} from '@totejs/uikit';
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
  FOLDER_TITLE_DELETING,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { Tips } from '@/components/common/Tips';
import { DCButton } from '@/components/common/DCButton';
import { reportEvent } from '@/utils/reportEvent';
import { getClient } from '@/base/client';
import { signTypedDataV4 } from '@/utils/signDataV4';
import { E_USER_REJECT_STATUS_NUM, broadcastFault } from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import { ObjectItem, TStatusDetail, setEditDelete, setStatusDetail } from '@/store/slices/object';
import { MsgDeleteObjectTypeUrl, getUtcZeroTimestamp } from '@bnb-chain/greenfield-chain-sdk';
import { useAsyncEffect } from 'ahooks';
import { getLockFee } from '@/utils/wallet';
import { setupTmpAvailableBalance } from '@/store/slices/global';
import { resolve } from '@/facade/common';

interface modalProps {
  refetch: () => void;
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
        ~{renderFeeValue(bnbValue, exchangeRate)}
      </Text>
    </Flex>
  );
};

export const DeleteObject = ({ refetch }: modalProps) => {
  const dispatch = useAppDispatch();
  const [lockFee, setLockFee] = useState('');
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { price: bnbPrice } = useAppSelector((root) => root.global.bnb);
  const {primarySpInfo}= useAppSelector((root) => root.sp);
  const { editDelete, bucketName } = useAppSelector((root) => root.object);
  const primarySp = primarySpInfo[bucketName];
  const exchangeRate = +bnbPrice ?? 0;
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const isOpen = !!editDelete.objectName;
  const onClose = () => {
    dispatch(setEditDelete({} as ObjectItem));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };
  const { gasList } = useAppSelector((root) => root.global.gasHub);
  const simulateGasFee = gasList[MsgDeleteObjectTypeUrl]?.gasFee ?? 0;
  const { connector } = useAccount();

  useEffect(() => {
    if (!isOpen) return;
    dispatch(setupTmpAvailableBalance(address));
  }, [isOpen, dispatch, address]);

  useAsyncEffect(async () => {
    const lockFeeInBNB = await getLockFee(editDelete.payloadSize, primarySp.operatorAddress);
    setLockFee(lockFeeInBNB);
  }, [isOpen]);

  useEffect(() => {
    if (!simulateGasFee || Number(simulateGasFee) < 0 || !lockFee || Number(lockFee) < 0) {
      setButtonDisabled(false);
      return;
    }
    const currentBalance = Number(availableBalance);
    if (currentBalance >= Number(simulateGasFee) + Number(lockFee)) {
      setButtonDisabled(false);
      return;
    }
    setButtonDisabled(true);
  }, [simulateGasFee, availableBalance, lockFee]);
  const filePath = editDelete.objectName.split('/');
  const isFolder = editDelete.objectName.endsWith('/');
  const isSavedSixMonths = getUtcZeroTimestamp() - editDelete.createAt * 1000 > 6 * 30 * 24 * 60 * 60 * 1000;
  const showName = filePath[filePath.length - 1];
  const folderName = filePath[filePath.length - 2];
  const description = isFolder
    ? `Are you sure you want to delete folder "${folderName}"?`
    : `Are you sure you want to delete file "${showName}"?`;

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

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w="568px"
      gaShowName="dc.file.delete_confirm.modal.show"
      gaClickCloseName="dc.file.delete_confirm.close.click"
    >
      <ModalHeader>Confirm Delete</ModalHeader>
      <ModalCloseButton />
      {!isFolder && isSavedSixMonths && (
        <Text
          fontSize="18px"
          lineHeight={'22px'}
          fontWeight={400}
          textAlign={'center'}
          marginTop="8px"
          color={'readable.secondary'}
          mb={'12px'}
        >
          You’ve paid 6 months locked storage fee for this object, but this object has been stored
          less than 6 months.{' '}
          <Link
            color="readable.normal"
            textDecoration={'underline'}
            cursor={'pointer'}
            href="https://docs.nodereal.io/docs/dcellar-faq#fee-related "
            target='_blank'
          >
            Learn more
          </Link>
        </Text>
      )}
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
        {renderFee('Gas Fee', simulateGasFee + '', exchangeRate)}
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
          onClick={async () => {
            try {
              setLoading(true);
              onClose();
              dispatch(
                setStatusDetail({
                  icon: FILE_DELETE_GIF,
                  title: isFolder ? FOLDER_TITLE_DELETING : FILE_TITLE_DELETING,
                  desc: FILE_STATUS_DELETING,
                  buttonText: '',
                  errorText: '',
                }),
              );
              const client = await getClient();
              const delObjTx = await client.object.deleteObject({
                bucketName,
                objectName: editDelete.objectName,
                operator: address,
              });
              const simulateInfo = await delObjTx.simulate({
                denom: 'BNB',
              });
              const [txRes, error] = await delObjTx
                .broadcast({
                  denom: 'BNB',
                  gasLimit: Number(simulateInfo?.gasLimit),
                  gasPrice: simulateInfo?.gasPrice || '5000000000',
                  payer: address,
                  granter: '',
                  signTypedDataCallback: async (addr: string, message: string) => {
                    const provider = await connector?.getProvider();
                    return await signTypedDataV4(provider, addr, message);
                  },
                })
                .then(resolve, broadcastFault);
              if (txRes === null) {
                dispatch(setStatusDetail({} as TStatusDetail));
                return toast.error({ description: error || 'Delete file error.' });
              }
              if (txRes.code === 0) {
                toast.success({
                  description: isFolder
                    ? 'Folder deleted successfully.'
                    : 'File deleted successfully.',
                });
                reportEvent({
                  name: 'dc.toast.file_delete.success.show',
                });
              } else {
                toast.error({ description: 'Delete file error.' });
              }
              refetch();
              onClose();
              dispatch(setStatusDetail({} as TStatusDetail));
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
          }}
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
