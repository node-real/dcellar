import {
  Box,
  Flex,
  Link,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { useAccount } from 'wagmi';
import React, { useEffect, useState } from 'react';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
  renderPaymentInsufficientBalance,
} from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  FILE_DESCRIPTION_CANCEL_ERROR,
  FILE_FAILED_URL,
  FILE_STATUS_CANCELING,
  FILE_TITLE_CANCEL_FAILED,
  FILE_TITLE_CANCELING,
  GAS_FEE_DOC,
  PENDING_ICON_URL,
} from '@/modules/file/constant';
import { USER_REJECT_STATUS_NUM } from '@/utils/constant';
import { DCModal } from '@/components/common/DCModal';
import { Tips } from '@/components/common/Tips';
import { DCButton } from '@/components/common/DCButton';
import { getClient } from '@/base/client';
import { signTypedDataV4 } from '@/utils/signDataV4';
import {
  addDeletedObject,
  ObjectItem,
  setEditCancel,
  setStatusDetail,
  TStatusDetail,
} from '@/store/slices/object';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAsyncEffect } from 'ahooks';
import { queryLockFee } from '@/facade/object';
import { formatLockFee } from '@/utils/object';
import { setupTmpAvailableBalance } from '@/store/slices/global';
import { setupBucketQuota } from '@/store/slices/bucket';
import { commonFault } from '@/facade/error';
import { resolve } from '@/facade/common';
import { Long, MsgCancelCreateObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { selectAccount, selectAvailableBalance } from '@/store/slices/accounts';
import { useSettlementFee } from '@/hooks/useSettlementFee';

interface modalProps {
  refetch: () => void;
}

export const renderFee = (
  key: string,
  bnbValue: string,
  exchangeRate: number | string,
  keyIcon?: React.ReactNode,
) => {
  return (
    <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
      <Flex alignItems="center" mb="4px">
        <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
          {key}
          {key.toLowerCase() === 'gas fee' && (
            <>
              {' '}(
              <Link href={GAS_FEE_DOC} textDecoration={'underline'} color="readable.disabled" target='_blank'>
                Pay by Owner Account
              </Link>
              )
            </>
          )}
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

export const CancelObject = ({ refetch }: modalProps) => {
  const dispatch = useAppDispatch();
  const [refundStoreFee, setRefundStoreFee] = useState<string | null>(null);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { gasObjects } = useAppSelector((root) => root.global.gasHub);
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const {
    bnb: { price: bnbPrice },
  } = useAppSelector((root) => root.global);
  const { bucketName, editCancel } = useAppSelector((root) => root.object);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const bucket = bucketInfo[bucketName];
  const availableBalance = useAppSelector(selectAvailableBalance(bucket?.PaymentAddress))
  const primarySp = primarySpInfo[bucketName];
  const exchangeRate = +bnbPrice ?? 0;
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const isOpen = !!editCancel.objectName;
  const accountDetail = useAppSelector(selectAccount(bucket.PaymentAddress));
  const onClose = () => {
    dispatch(setEditCancel({} as ObjectItem));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };
  const onStatusDetailClose = () => {
    dispatch(setStatusDetail({} as TStatusDetail));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };

  const simulateGasFee = gasObjects[MsgCancelCreateObjectTypeUrl]?.gasFee + '';

  useEffect(() => {
    if (!isOpen) return;
    dispatch(setupTmpAvailableBalance(loginAccount));
  }, [isOpen, dispatch, loginAccount]);

  useAsyncEffect(async () => {
    const params = {
      createAt: Long.fromInt(editCancel.createAt),
      payloadSize: Long.fromInt(editCancel.payloadSize),
      primarySpAddress: primarySp.operatorAddress,
    };
    const [data, error] = await queryLockFee(params);
    if (error) {
      toast.error({
        description: error || 'Query lock fee failed!',
      });
      return;
    }

    setRefundStoreFee(formatLockFee(data?.amount));
  }, [isOpen]);
  const { loading: isLoadingSF, settlementFee } = useSettlementFee(bucket.PaymentAddress);

  useEffect(() => {
    if (!simulateGasFee || Number(simulateGasFee) < 0 || !refundStoreFee || Number(refundStoreFee) < 0) {
      setButtonDisabled(false);
      return;
    }
    const currentBalance = Number(availableBalance);
    if (currentBalance >= Number(simulateGasFee) + Number(refundStoreFee)) {
      setButtonDisabled(false);
      return;
    }
    setButtonDisabled(true);
  }, [simulateGasFee, availableBalance, refundStoreFee]);
  const { connector } = useAccount();

  const filePath = editCancel.name.split('/');
  const showName = filePath[filePath.length - 1];
  const description = `Are you sure you want to cancel uploading the object "${showName}"?`;

  const setFailedStatusModal = (description: string, error: any) => {
    setStatusDetail({
      icon: FILE_FAILED_URL,
      title: FILE_TITLE_CANCEL_FAILED,
      desc: description,
      buttonText: BUTTON_GOT_IT,
      errorText: 'Error message: ' + error?.message ?? '',
      buttonOnClick: onStatusDetailClose,
    });
  };

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w="568px"
      gaShowName="dc.file.cancel_modal.0.show"
      gaClickCloseName="dc.file.cancel_modal.close.click"
    >
      <ModalHeader>Cancel Uploading</ModalHeader>
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
          'Prepaid fee refund',
          refundStoreFee || '',
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
                  We will unlock the storage fee after you cancel the object.
                </Box>
              </Box>
            }
          />,
        )}
        {renderFee('Settlement fee', settlementFee, exchangeRate)}
        {renderFee('Gas Fee', simulateGasFee, exchangeRate)}
      </Flex>
      <Flex w={'100%'} justifyContent={'space-between'} mt="8px" mb={'32px'}>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
          {renderPaymentInsufficientBalance({
            gasFee: simulateGasFee,
            settlementFee,
            storeFee: '0',
            refundFee: refundStoreFee || '',
            payGasFeeBalance: bankBalance,
            payStoreFeeBalance: accountDetail.staticBalance,
            ownerAccount: loginAccount,
            payAccount: bucket.PaymentAddress
          })}
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
              dispatch(
                setStatusDetail({
                  icon: PENDING_ICON_URL,
                  title: FILE_TITLE_CANCELING,
                  desc: FILE_STATUS_CANCELING,
                  buttonText: '',
                  errorText: '',
                }),
              );
              const client = await getClient();
              const cancelObjectTx = await client.object.cancelCreateObject({
                bucketName,
                objectName: editCancel.objectName,
                operator: loginAccount,
              });
              const simulateInfo = await cancelObjectTx.simulate({
                denom: 'BNB',
              });
              const [txRes, error] = await cancelObjectTx
                .broadcast({
                  denom: 'BNB',
                  gasLimit: Number(simulateInfo?.gasLimit),
                  gasPrice: simulateInfo?.gasPrice || '5000000000',
                  payer: loginAccount,
                  granter: '',
                  signTypedDataCallback: async (addr: string, message: string) => {
                    const provider = await connector?.getProvider();
                    return await signTypedDataV4(provider, addr, message);
                  },
                })
                .then(resolve, commonFault);
              if (txRes === null) {
                onStatusDetailClose();
                toast.error({ description: error || 'Uploading cancelled failed.' });
                return;
              }
              if (txRes && txRes.code === 0) {
                toast.success({ description: 'Uploading cancelled successfully.' });
                dispatch(
                  addDeletedObject({
                    path: [bucketName, editCancel.objectName].join('/'),
                    ts: Date.now(),
                  }),
                );
                refetch();
                dispatch(setupBucketQuota(bucketName));
              } else {
                toast.error({ description: 'Uploading cancelled failed.' });
              }
              onStatusDetailClose();
              setLoading(false);
            } catch (error: any) {
              setLoading(false);
              const { code = '' } = error;
              if (code && parseInt(code) === USER_REJECT_STATUS_NUM) {
                onStatusDetailClose();
                return;
              }
              // eslint-disable-next-line no-console
              console.error('Cancel object error.', error);

              setFailedStatusModal(FILE_DESCRIPTION_CANCEL_ERROR, error);
            }
          }}
          colorScheme="danger"
          isLoading={loading}
          isDisabled={buttonDisabled || isLoadingSF || refundStoreFee === null}
        >
          Confirm
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
