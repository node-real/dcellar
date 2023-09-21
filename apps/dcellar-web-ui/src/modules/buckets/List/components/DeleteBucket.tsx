import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { useAccount, useNetwork } from 'wagmi';
import { isEmpty } from 'lodash-es';
import { BucketNotEmpty } from '@/modules/buckets/List/components/BucketNotEmpty';
import { DeletingBucket } from '@/modules/buckets/List/components/DeletingBucket';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { reportEvent } from '@/utils/reportEvent';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectStoreFeeParams, setupStoreFeeParams } from '@/store/slices/global';
import { deleteBucket, preExecDeleteBucket } from '@/facade/bucket';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { selectAccount, selectAvailableBalance } from '@/store/slices/accounts';
import { useAsyncEffect } from 'ahooks';
import { getQuotaNetflowRate } from '@/utils/payment';
import { BN } from '@/utils/BigNumber';
import { renderFee } from '@/modules/object/components/CancelObject';
import { PaymentInsufficientBalance, renderBalanceNumber } from '@/modules/file/utils';
import { MsgDeleteBucketTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { BUTTON_GOT_IT, FILE_FAILED_URL, FILE_TITLE_DELETE_FAILED } from '@/modules/file/constant';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { pollingDeleteBucket } from '@/modules/buckets/List/utils';

export const DeleteBucket = ({ isOpen, onClose, bucketName, refetch, sp }: any) => {
  const dispatch = useAppDispatch();
  const [isGasLoading, setIsGasLoading] = useState(false);
  const { price: bnbPrice } = useAppSelector((root) => root.global.bnb);
  const exchangeRate = +bnbPrice ?? 0;
  // pending, fetching, failed, notEmpty
  const [status, setStatus] = useState('pending');
  const { connector } = useAccount();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const { chain } = useNetwork();
  const { gasObjects } = useAppSelector((root) => root.global.gasHub);
  const bucket = bucketInfo[bucketName] || {};
  const PaymentAddress = bucket.PaymentAddress;
  const { settlementFee } = useSettlementFee(PaymentAddress);
  const accountDetail = useAppSelector(selectAccount(PaymentAddress));
  const [balanceEnough, setBalanceEnough] = useState(true);
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const chargeQuota = bucket.ChargedReadQuota;
  const { gasFee } = gasObjects?.[MsgDeleteBucketTypeUrl] || {};
  const availableBalance = useAppSelector(selectAvailableBalance(PaymentAddress));
  const [loading, setLoading] = useState(false);
  const { setOpenAuthModal } = useOffChainAuth();

  useAsyncEffect(async () => {
    if (!isEmpty(storeFeeParams)) return;
    dispatch(setupStoreFeeParams());
  }, [dispatch]);

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

  const quotaFee = useMemo(() => {
    if (isEmpty(storeFeeParams)) return '-1';
    const netflowRate = getQuotaNetflowRate(chargeQuota, storeFeeParams);
    return BN(netflowRate)
      .times(storeFeeParams.reserveTime)
      .dividedBy(10 ** 18)
      .toString();
  }, [storeFeeParams, chargeQuota]);

  const requestGetBucketFee = useCallback(async () => {
    setIsGasLoading(true);
    const [data, error] = await preExecDeleteBucket(bucketName, loginAccount);
    if (error) {
      if (error.toLowerCase().includes('not empty')) {
        setStatus('notEmpty');
      }
    }
    setIsGasLoading(false);
  }, [loginAccount, bucketName, gasObjects]);

  useEffect(() => {
    if (isEmpty(chain)) return;
    requestGetBucketFee();
  }, [chain, requestGetBucketFee]);

  const onDeleteClick = async () => {
    setStatus('operating');
    setLoading(true);
    const [txRes, error] = await deleteBucket({
      address: loginAccount,
      bucketName,
      connector: connector!,
    });

    if (error || txRes!.code !== 0) {
      return errorHandler(error || txRes!.rawLog!);
    }
    await pollingDeleteBucket({ bucketName, address: loginAccount, endpoint: sp.endpoint });
    setLoading(false);
    refetch();
    onClose();
    toast.success({
      description: `Bucket deleted successfully!`,
    });
    reportEvent({
      name: 'dc.toast.bucket_delete.success.show',
    });
    setTimeout(() => {
      setStatus('pending');
    }, 200);
  };

  const DeleteBucket = () => {
    return (
      <>
        <ModalHeader lineHeight={'36px'}>Confirm Delete</ModalHeader>
        <ModalBody marginTop={'8px'}>
          <Box textAlign={'center'} color={'#474D57'} fontSize={'18px'} mb={32}>
            {`Are you sure to delete this bucket "${bucketName}"?`}
          </Box>
          <Flex
            bg={'bg.secondary'}
            padding={'16px'}
            width={'100%'}
            flexDirection={'column'}
            borderRadius="12px"
            gap={'4px'}
          >
            {renderFee('Prepaid fee refund', quotaFee || '', exchangeRate, loading)}
            {renderFee('Settlement fee', !chargeQuota ? '0' : settlementFee, exchangeRate, loading)}
            {renderFee('Gas Fee', gasFee + '', exchangeRate, loading)}
          </Flex>
          <Flex w={'100%'} justifyContent={'space-between'} mt="8px">
            <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
              <PaymentInsufficientBalance
                gasFee={gasFee}
                storeFee={'0'}
                refundFee={quotaFee}
                settlementFee={!chargeQuota ? '0' : settlementFee}
                payGasFeeBalance={bankBalance}
                payStoreFeeBalance={accountDetail.staticBalance}
                ownerAccount={loginAccount}
                payAccount={PaymentAddress}
                onValidate={setBalanceEnough}
              />
            </Text>
            <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
              Available balance: {renderBalanceNumber(availableBalance || '0')}
            </Text>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <DCButton
            variant="ghost"
            width={'100%'}
            onClick={onClose}
            gaClickName="dc.bucket.delete_confirm.cancel.click"
          >
            Cancel
          </DCButton>
          <DCButton
            variant="scene"
            disabled={isGasLoading || loading || !balanceEnough}
            height={'48px'}
            width={'100%'}
            onClick={() => onDeleteClick()}
            gaClickName="dc.bucket.delete_confirm.delete.click"
          >
            Delete
          </DCButton>
        </ModalFooter>
      </>
    );
  };

  const gaOptions = getGAOptions(status);

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      gaShowName={gaOptions.showName}
      gaClickCloseName={gaOptions.closeName}
    >
      <ModalCloseButton />
      {status === 'pending' && <DeleteBucket />}
      {status === 'operating' && <DeletingBucket />}
      {status === 'notEmpty' && <BucketNotEmpty onClose={onClose} />}
    </DCModal>
  );
};

function getGAOptions(status: string) {
  const options: Record<string, { showName: string; closeName: string }> = {
    pending: {
      showName: 'dc.bucket.delete_confirm.modal.show',
      closeName: 'dc.bucket.delete_confirm.close.click',
    },
    operating: {
      showName: 'dc.bucket.deleting_modal.0.show',
      closeName: 'dc.bucket.deleting_modal.close.click',
    },
    notEmpty: {
      showName: 'dc.bucket.not_empty_modal.0.show',
      closeName: 'dc.bucket.not_empty_modal.close.click',
    },
    failed: {
      showName: 'dc.bucket.delete_fail_modal.0.show',
      closeName: 'dc.bucket.delete_fail_modal.close.click',
    },
  };

  return options[status] ?? {};
}
