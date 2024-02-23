import { Animates } from '@/components/AnimatePng';
import { DCButton } from '@/components/common/DCButton';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { deleteBucket, pollingDeleteBucket, preExecDeleteBucket } from '@/facade/bucket';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { OBJECT_ERROR_TYPES } from '@/modules/object/ObjectError';
import { TotalFees } from '@/modules/object/components/TotalFees';
import { BUTTON_GOT_IT, FILE_TITLE_DELETE_FAILED, WALLET_CONFIRM } from '@/modules/object/constant';
import { PaymentInsufficientBalance } from '@/modules/object/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount } from '@/store/slices/accounts';
import { TBucket, setupBuckets } from '@/store/slices/bucket';
import { selectStoreFeeParams, setupStoreFeeParams } from '@/store/slices/global';
import { TStatusDetail, setStatusDetail } from '@/store/slices/object';
import { selectBucketSp } from '@/store/slices/sp';
import { reportEvent } from '@/utils/gtag';
import { BN } from '@/utils/math';
import { getQuotaNetflowRate } from '@/utils/payment';
import { MsgDeleteBucketTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { Box, Flex, ModalBody, ModalFooter, ModalHeader, Text, toast } from '@node-real/uikit';
import { useAsyncEffect } from 'ahooks';
import { isEmpty } from 'lodash-es';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';

interface DeleteBucketOperationProps {
  selectedBucketInfo: TBucket;
  onClose?: () => void;
}

export const DeleteBucketOperation = memo<DeleteBucketOperationProps>(
  function DeleteBucketOperation({ selectedBucketInfo: bucket, onClose = () => {} }) {
    const dispatch = useAppDispatch();
    const [isGasLoading, setIsGasLoading] = useState(false);
    // pending, fetching, failed, notEmpty
    const { connector } = useAccount();
    const { loginAccount } = useAppSelector((root) => root.persist);
    const { bankBalance } = useAppSelector((root) => root.accounts);
    const { chain } = useNetwork();
    const { gasObjects } = useAppSelector((root) => root.global.gasHub);
    const PaymentAddress = bucket.PaymentAddress;
    const { settlementFee } = useSettlementFee(PaymentAddress);
    const accountDetail = useAppSelector(selectAccount(PaymentAddress));
    const [balanceEnough, setBalanceEnough] = useState(true);
    const storeFeeParams = useAppSelector(selectStoreFeeParams);
    const chargeQuota = bucket.ChargedReadQuota;
    const { gasFee } = gasObjects?.[MsgDeleteBucketTypeUrl] || {};
    const [loading, setLoading] = useState(false);
    const { setOpenAuthModal } = useOffChainAuth();
    const bucketName = bucket.BucketName;
    const primarySp = useAppSelector(selectBucketSp(bucket))!;

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
              icon: 'status-failed',
              buttonText: BUTTON_GOT_IT,
              errorText: 'Error message: ' + error,
            }),
          );
      }
    };

    const quotaFee = useMemo(() => {
      if (isEmpty(storeFeeParams)) return '-1';
      const netflowRate = getQuotaNetflowRate(chargeQuota, storeFeeParams);
      return BN(netflowRate).times(storeFeeParams.reserveTime).toString();
    }, [storeFeeParams, chargeQuota]);

    const requestGetBucketFee = useCallback(async () => {
      setIsGasLoading(true);
      const [data, error] = await preExecDeleteBucket(bucketName, loginAccount);
      if (error) {
        if (error.toLowerCase().includes('not empty')) {
          onClose();
          dispatch(
            setStatusDetail({
              ...OBJECT_ERROR_TYPES['BUCKET_NOT_EMPTY'],
              buttonText: BUTTON_GOT_IT,
            }),
          );
        }
      }
      setIsGasLoading(false);
    }, [loginAccount, bucketName, gasObjects]);

    useEffect(() => {
      if (isEmpty(chain)) return;
      requestGetBucketFee();
    }, [chain, requestGetBucketFee]);

    const onDeleteClick = async () => {
      dispatch(
        setStatusDetail({
          title: 'Deleting Bucket',
          icon: Animates.delete,
          desc: WALLET_CONFIRM,
        }),
      );
      onClose();
      setLoading(true);
      const [txRes, error] = await deleteBucket({
        address: loginAccount,
        bucketName,
        connector: connector!,
      });

      if (error || txRes!.code !== 0) {
        return errorHandler(error || txRes!.rawLog!);
      }
      await pollingDeleteBucket({
        bucketName,
        address: loginAccount,
        endpoint: primarySp.endpoint,
      });
      setLoading(false);
      dispatch(setStatusDetail({} as TStatusDetail));
      dispatch(setupBuckets(loginAccount));
      toast.success({
        description: `Bucket deleted successfully!`,
      });
      reportEvent({
        name: 'dc.toast.bucket_delete.success.show',
      });
    };

    return (
      <>
        <ModalHeader lineHeight={'36px'}>Confirm Delete</ModalHeader>
        <ModalBody marginTop={'8px'}>
          <Box className="ui-modal-desc">{`Are you sure to delete this bucket "${bucketName}"?`}</Box>
          <TotalFees
            expandable={false}
            refund={true}
            gasFee={gasFee}
            prepaidFee={quotaFee}
            settlementFee={settlementFee}
            payStoreFeeAddress={PaymentAddress}
          />
          {!balanceEnough && (
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
            </Flex>
          )}
        </ModalBody>
        <ModalFooter>
          <DCButton
            size={'lg'}
            variant="ghost"
            width={'100%'}
            onClick={onClose}
            gaClickName="dc.bucket.delete_confirm.cancel.click"
          >
            Cancel
          </DCButton>
          <DCButton
            variant={'scene'}
            colorScheme={'danger'}
            disabled={isGasLoading || loading || !balanceEnough}
            size={'lg'}
            width={'100%'}
            onClick={() => onDeleteClick()}
            gaClickName="dc.bucket.delete_confirm.delete.click"
          >
            Delete
          </DCButton>
        </ModalFooter>
      </>
    );
  },
);
