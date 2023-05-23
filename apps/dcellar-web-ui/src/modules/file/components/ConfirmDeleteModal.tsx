import {
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  Button,
  Text,
  Flex,
  toast,
  Box,
} from '@totejs/uikit';
import { useAccount, useNetwork } from 'wagmi';
import React, { useContext, useEffect, useState } from 'react';
import { DelObjectTx, getAccount, recoverPk, makeCosmsPubKey } from '@bnb-chain/gnfd-js-sdk';

import { useLogin } from '@/hooks/useLogin';
import { GREENFIELD_CHAIN_RPC_URL } from '@/base/env';

import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  FILE_DELETE_GIF,
  FILE_DESCRIPTION_DELETE_ERROR,
  FILE_EMPTY_URL,
  FILE_FAILED_URL,
  FILE_STATUS_DELETING,
  FILE_TITLE_DELETE_FAILED,
  FILE_TITLE_DELETING,
} from '@/modules/file/constant';
import { USER_REJECT_STATUS_NUM } from '@/utils/constant';
import { useAvailableBalance } from '@/hooks/useAvailableBalance';
import { DCModal } from '@/components/common/DCModal';
import { Tips } from '@/components/common/Tips';
import { BnbPriceContext } from '@/context/GlobalContext/BnbPriceProvider';
import { DCButton } from '@/components/common/DCButton';
import { reportEvent } from '@/utils/reportEvent';

interface modalProps {
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  buttonText?: string;
  buttonOnClick?: () => void;
  bucketName: string;
  fileInfo?: { name: string; size: number };
  endpoint?: string;
  gasFeeLoading?: boolean;
  simulateGasFee: string;
  gasLimit: number;
  gasPrice: string;
  setListObjects: React.Dispatch<React.SetStateAction<any[]>>;
  listObjects: Array<any>;
  setStatusModalIcon: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalTitle: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string | JSX.Element>>;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  outsideLoading: boolean;
  lockFee: string;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
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

export const ConfirmDeleteModal = (props: modalProps) => {
  const loginData = useLogin();
  const { loginState } = loginData;
  const { address } = loginState;
  const { chain } = useNetwork();
  const { value: bnbPrice } = useContext(BnbPriceContext);
  const exchangeRate = bnbPrice?.toNumber() ?? 0;
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { availableBalance } = useAvailableBalance();
  const {
    title = 'Confirm Delete',
    onClose,
    isOpen,
    bucketName,
    fileInfo = { name: '', size: 0 },
    endpoint = '',
    gasLimit = 0,
    gasPrice = '0',
    lockFee,
    outsideLoading,
    simulateGasFee,
    setListObjects,
    listObjects,
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    onStatusModalClose,
    setStatusModalButtonText,
    setStatusModalErrorText,
  } = props;
  const { connector } = useAccount();
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
  const { name = '', size = 0 } = fileInfo;

  const description = `Are you sure you want to delete file "${name}"?`;
  const delObjTx = new DelObjectTx(GREENFIELD_CHAIN_RPC_URL, String(chain?.id)!);

  const setFailedStatusModal = (description: string, error: any) => {
    onStatusModalClose();
    setStatusModalIcon(FILE_FAILED_URL);
    setStatusModalTitle(FILE_TITLE_DELETE_FAILED);
    setStatusModalDescription(description);
    setStatusModalButtonText(BUTTON_GOT_IT);
    setStatusModalErrorText('Error message: ' + error?.message ?? '');
    onStatusModalOpen();
  };

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w="568px"
      overflow="hidden"
      gaShowName="dc.file.delete_confirm.modal.show"
      gaClickCloseName="dc.file.delete_confirm.close.click"
    >
      <ModalHeader>{title}</ModalHeader>
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
        {renderFee(
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
        )}
        {renderFee('Gas Fee', simulateGasFee, exchangeRate)}
      </Flex>
      <Flex w={'100%'} justifyContent={'space-between'} mt="8px" mb={'36px'}>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
          {renderInsufficientBalance(simulateGasFee, lockFee, availableBalance || '0', {
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
              setStatusModalIcon(FILE_DELETE_GIF);
              setStatusModalTitle(FILE_TITLE_DELETING);
              setStatusModalDescription(FILE_STATUS_DELETING);
              setStatusModalErrorText('');
              setStatusModalButtonText('');
              onStatusModalOpen();
              const { sequence, accountNumber } = await getAccount(
                GREENFIELD_CHAIN_RPC_URL!,
                address!,
              );
              const provider = await connector?.getProvider();
              const signInfo = await delObjTx.signTx(
                {
                  accountNumber: accountNumber + '',
                  bucketName,
                  from: address,
                  sequence: sequence + '',
                  gasLimit,
                  gasPrice,
                  objectName: name,
                  denom: 'BNB',
                },
                provider,
              );

              const pk = recoverPk({
                signature: signInfo.signature,
                messageHash: signInfo.messageHash,
              });
              const pubKey = makeCosmsPubKey(pk);
              const rawInfoParams = {
                accountNumber: accountNumber + '',
                bucketName,
                from: address,
                sequence: sequence + '',
                gasLimit,
                gasPrice,
                pubKey,
                sign: signInfo.signature,
                objectName: name,
                denom: 'BNB',
              };
              const rawBytes = await delObjTx.getRawTxInfo(rawInfoParams);
              const txRes = await delObjTx.broadcastTx(rawBytes.bytes);

              if (txRes.code === 0) {
                toast.success({ description: 'File deleted successfully.' });
                reportEvent({
                  name: 'dc.toast.file_delete.success.show',
                });
              } else {
                toast.error({ description: 'Delete file error.' });
              }
              const newListObject = listObjects.filter((v, i) => {
                return v?.object_name !== name;
              });
              setListObjects(newListObject);
              onStatusModalClose();
              setLoading(false);
            } catch (error: any) {
              setLoading(false);
              const { code = '' } = error;
              if (code && parseInt(code) === USER_REJECT_STATUS_NUM) {
                onStatusModalClose();
                return;
              }
              // eslint-disable-next-line no-console
              console.error('Delete file error.', error);

              setFailedStatusModal(FILE_DESCRIPTION_DELETE_ERROR, error);
            }
          }}
          colorScheme="danger"
          isLoading={loading || outsideLoading}
          isDisabled={buttonDisabled}
        >
          Delete
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
