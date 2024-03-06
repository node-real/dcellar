import { Animates } from '@/components/AnimatePng';
import { DCButton } from '@/components/common/DCButton';
import { Tips } from '@/components/common/Tips';
import { USER_REJECT_STATUS_NUM } from '@/constants/legacy';
import { getClient } from '@/facade';
import { resolve } from '@/facade/common';
import { commonFault } from '@/facade/error';
import { queryLockFee } from '@/facade/object';
import { signTypedDataCallback } from '@/facade/wallet';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import {
  BUTTON_GOT_IT,
  FILE_DESCRIPTION_CANCEL_ERROR,
  FILE_TITLE_CANCEL_FAILED,
  GAS_FEE_DOC,
  WALLET_CONFIRM,
} from '@/modules/object/constant';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderPaymentInsufficientBalance,
} from '@/modules/object/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { AccountInfo, selectAvailableBalance } from '@/store/slices/accounts';
import { TBucket, setupBucketQuota } from '@/store/slices/bucket';
import { selectGnfdGasFeesConfig, setSignatureAction } from '@/store/slices/global';
import { setDeletedObject, setObjectSelectedKeys } from '@/store/slices/object';
import { SpEntity } from '@/store/slices/sp';
import { formatLockFee } from '@/utils/object';
import { Long, MsgCancelCreateObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import {
  Box,
  Flex,
  Link,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  toast,
} from '@node-real/uikit';
import { useAsyncEffect } from 'ahooks';
import { without } from 'lodash-es';
import React, { memo, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

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
          {key?.toLowerCase() === 'gas fee' && (
            <>
              {' '}
              (
              <Link
                href={GAS_FEE_DOC}
                textDecoration={'underline'}
                color="readable.disabled"
                target="_blank"
              >
                Pay by Owner Account
              </Link>
              )
            </>
          )}
        </Text>
        {keyIcon && <Box>{keyIcon}</Box>}
      </Flex>
      <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
        {renderFeeValue(bnbValue, exchangeRate)}
      </Text>
    </Flex>
  );
};

interface CancelObjectOperationProps {
  selectObjectInfo: ObjectMeta;
  selectBucket: TBucket;
  bucketAccountDetail: AccountInfo;
  primarySp: SpEntity;
  refetch?: () => void;
  onClose?: () => void;
}

export const CancelObjectOperation = memo<CancelObjectOperationProps>(
  function CancelObjectOperation({
    refetch = () => {},
    onClose = () => {},
    selectObjectInfo,
    selectBucket: bucket,
    bucketAccountDetail: accountDetail,
    primarySp,
  }) {
    const dispatch = useAppDispatch();
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);
    const exchangeRateStr = +useAppSelector((root) => root.global.bnbUsdtExchangeRate);
    const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
    const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
    const objectSelectedKeys = useAppSelector((root) => root.object.objectSelectedKeys);

    const availableBalance = useAppSelector(selectAvailableBalance(bucket?.PaymentAddress));
    const { loading: isLoadingSF, settlementFee } = useSettlementFee(bucket.PaymentAddress);
    const [refundStoreFee, setRefundStoreFee] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const { connector } = useAccount();

    const exchangeRate = +exchangeRateStr ?? 0;
    const objectInfo = selectObjectInfo.ObjectInfo;
    const simulateGasFee = gnfdGasFeesConfig[MsgCancelCreateObjectTypeUrl]?.gasFee + '';
    const filePath = objectInfo.ObjectName.split('/');
    const showName = filePath[filePath.length - 1];
    const description = `Are you sure you want to cancel uploading the object "${showName}"?`;

    const setFailedStatusModal = (description: string, error: any) => {
      setSignatureAction({
        icon: 'status-failed',
        title: FILE_TITLE_CANCEL_FAILED,
        desc: description,
        buttonText: BUTTON_GOT_IT,
        errorText: 'Error message: ' + error?.message ?? '',
      });
    };

    useAsyncEffect(async () => {
      const params = {
        createAt: Long.fromString(String(objectInfo.CreateAt)),
        payloadSize: Long.fromString(String(objectInfo.PayloadSize)),
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
    }, []);

    useEffect(() => {
      if (
        !simulateGasFee ||
        Number(simulateGasFee) < 0 ||
        !refundStoreFee ||
        Number(refundStoreFee) < 0
      ) {
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

    return (
      <>
        <ModalHeader>Cancel Uploading</ModalHeader>
        <ModalBody>
          <Text className="ui-modal-desc">{description}</Text>
          <Flex
            bg={'bg.secondary'}
            padding={'16px'}
            width={'100%'}
            gap={'4px'}
            flexDirection={'column'}
            borderRadius={'12px'}
            alignItems={'center'}
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
            {renderFee('Gas fee', simulateGasFee, exchangeRate)}
          </Flex>
          <Flex w={'100%'} justifyContent={'space-between'} mt="8px">
            <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
              {renderPaymentInsufficientBalance({
                gasFee: simulateGasFee,
                settlementFee,
                storeFee: '0',
                refundFee: refundStoreFee || '',
                payGasFeeBalance: bankBalance,
                payStoreFeeBalance: accountDetail.staticBalance,
                ownerAccount: loginAccount,
                payAccount: bucket.PaymentAddress,
              })}
            </Text>
            <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
              Available balance: {renderBalanceNumber(availableBalance || '0')}
            </Text>
          </Flex>
        </ModalBody>
        <ModalFooter flexDirection={'row'}>
          <DCButton
            size="lg"
            flex={1}
            gaClickName="dc.file.cancel_modal.confirm.click"
            onClick={async () => {
              try {
                setLoading(true);
                onClose();
                dispatch(
                  setSignatureAction({
                    icon: Animates.object,
                    title: 'Canceling Uploading',
                    desc: WALLET_CONFIRM,
                  }),
                );
                const client = await getClient();
                const cancelObjectTx = await client.object.cancelCreateObject({
                  bucketName: currentBucketName,
                  objectName: objectInfo.ObjectName,
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
                    signTypedDataCallback: signTypedDataCallback(connector!),
                  })
                  .then(resolve, commonFault);
                dispatch(setSignatureAction({}));
                if (txRes === null) {
                  toast.error({ description: error || 'Upload cancellation failed.' });
                  return;
                }
                if (txRes && txRes.code === 0) {
                  toast.success({ description: 'Upload cancelled successfully.' });
                  dispatch(
                    setDeletedObject({
                      path: [currentBucketName, objectInfo.ObjectName].join('/'),
                      ts: Date.now(),
                    }),
                  );
                  // unselected
                  dispatch(
                    setObjectSelectedKeys(without(objectSelectedKeys, objectInfo.ObjectName)),
                  );
                  refetch();
                  dispatch(setupBucketQuota(currentBucketName));
                } else {
                  toast.error({ description: 'Upload cancellation failed.' });
                }
                setLoading(false);
              } catch (error: any) {
                setLoading(false);
                const { code = '' } = error;
                if (code && parseInt(code) === USER_REJECT_STATUS_NUM) {
                  return;
                }
                // eslint-disable-next-line no-console
                console.error('Cancel object error.', error);

                setFailedStatusModal(FILE_DESCRIPTION_CANCEL_ERROR, error);
              }
            }}
            isLoading={loading}
            isDisabled={buttonDisabled || isLoadingSF || refundStoreFee === null}
          >
            Confirm
          </DCButton>
        </ModalFooter>
      </>
    );
  },
);
