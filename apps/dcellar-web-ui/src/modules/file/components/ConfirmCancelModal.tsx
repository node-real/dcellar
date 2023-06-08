import { ModalCloseButton, ModalHeader, ModalFooter, Text, Flex, toast, Box } from '@totejs/uikit';
import { useAccount, useNetwork } from 'wagmi';
import React, { useContext, useEffect, useState } from 'react';
import { useLogin } from '@/hooks/useLogin';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  FILE_DESCRIPTION_CANCEL_ERROR,
  FILE_FAILED_URL,
  FILE_STATUS_CANCELING,
  FILE_TITLE_CANCEL_FAILED,
  FILE_TITLE_CANCELING,
  PENDING_ICON_URL,
} from '@/modules/file/constant';
import { USER_REJECT_STATUS_NUM } from '@/utils/constant';
import { useAvailableBalance } from '@/hooks/useAvailableBalance';
import { DCModal } from '@/components/common/DCModal';
import { Tips } from '@/components/common/Tips';
import { BnbPriceContext } from '@/context/GlobalContext/BnbPriceProvider';
import { DCButton } from '@/components/common/DCButton';
import { client } from '@/base/client';
import { signTypedDataV4 } from '@/utils/signDataV4';
import { IRawSPInfo } from '@/modules/buckets/type';

interface modalProps {
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  buttonText?: string;
  buttonOnClick?: () => void;
  bucketName: string;
  fileInfo?: { name: string; size: number };
  simulateGasFee: string;
  lockFee: string;
  setListObjects: React.Dispatch<React.SetStateAction<any[]>>;
  listObjects: Array<any>;
  setStatusModalIcon: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalTitle: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string | JSX.Element>>;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  outsideLoading: boolean;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
}

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

export const ConfirmCancelModal = (props: modalProps) => {
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
    title = 'Cancel Uploading',
    onClose,
    isOpen,
    bucketName,
    lockFee,
    fileInfo = { name: '', size: 0 },
    simulateGasFee,
    listObjects,
    setListObjects,
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    onStatusModalClose,
    setStatusModalButtonText,
    outsideLoading,
    setStatusModalErrorText,
  } = props;
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
  const { connector } = useAccount();
  const description = `Are you sure you want to cancel uploading the file "${name}"?`;

  const setFailedStatusModal = (description: string, error: any) => {
    onStatusModalClose();
    setStatusModalIcon(FILE_FAILED_URL);
    setStatusModalTitle(FILE_TITLE_CANCEL_FAILED);
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
      gaShowName="dc.file.cancel_modal.0.show"
      gaClickCloseName="dc.file.cancel_modal.close.click"
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
        gap={'4px'}
        flexDirection={'column'}
        borderRadius={'12px'}
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
                  We will unlock the storage fee after you cancel the file.
                </Box>
              </Box>
            }
          />,
        )}
        {renderFee('Gas Fee', simulateGasFee, exchangeRate)}
      </Flex>
      <Flex w={'100%'} justifyContent={'space-between'} mt="8px" mb={'32px'}>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
          {renderInsufficientBalance(simulateGasFee, lockFee, availableBalance || '0')}
        </Text>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
          Available balance: {renderBalanceNumber(availableBalance || '0')}
        </Text>
      </Flex>
      <ModalFooter margin={0} flexDirection={'row'}>
        <DCButton
          flex={1}
          variant={'dcDanger'}
          gaClickName="dc.file.cancel_modal.confirm.click"
          onClick={async () => {
            try {
              setLoading(true);
              onClose();
              setStatusModalIcon(PENDING_ICON_URL);
              setStatusModalTitle(FILE_TITLE_CANCELING);
              setStatusModalDescription(FILE_STATUS_CANCELING);
              setStatusModalErrorText('');
              setStatusModalButtonText('');
              onStatusModalOpen();
              const cancelObjectTx = await client.object.cancelCreateObject({
                bucketName,
                objectName: name,
                operator: address,
              });
              const simulateInfo = await cancelObjectTx.simulate({
                denom: 'BNB',
              });
              const txRes = await cancelObjectTx.broadcast({
                denom: 'BNB',
                gasLimit: Number(simulateInfo?.gasLimit),
                gasPrice: simulateInfo?.gasPrice || '5000000000',
                payer: address,
                granter: '',
                signTypedDataCallback: async (addr: string, message: string) => {
                  const provider = await connector?.getProvider();
                  return await signTypedDataV4(provider, addr, message);
                },
              });
              if (txRes.code === 0) {
                toast.success({ description: 'Uploading cancelled successfully.' });
              } else {
                toast.error({ description: 'Uploading cancelled failed.' });
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
              console.error('Cancel file error.', error);

              setFailedStatusModal(FILE_DESCRIPTION_CANCEL_ERROR, error);
            }
          }}
          colorScheme="danger"
          isLoading={loading || outsideLoading}
          isDisabled={buttonDisabled}
        >
          Confirm
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
