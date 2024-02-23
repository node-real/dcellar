import { Animates } from '@/components/AnimatePng';
import { DCButton } from '@/components/common/DCButton';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { createTempAccount } from '@/facade/account';
import { E_OBJECT_NOT_EXISTS, E_OFF_CHAIN_AUTH } from '@/facade/error';
import { cancelCreateObject, deleteObject } from '@/facade/object';
import { getStoreFeeParams } from '@/facade/payment';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { TotalFees } from '@/modules/object/components/TotalFees';
import { BUTTON_GOT_IT, FILE_TITLE_DELETE_FAILED, WALLET_CONFIRM } from '@/modules/object/constant';
import { PaymentInsufficientBalance } from '@/modules/object/utils';
import { DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  TAccountInfo,
  selectAccount,
  selectAvailableBalance,
  setTempAccounts,
  setupAccountInfo,
} from '@/store/slices/accounts';
import { TBucket } from '@/store/slices/bucket';
import {
  TStatusDetail,
  addDeletedObject,
  setSelectedRowKeys,
  setStatusDetail,
} from '@/store/slices/object';
import { BN } from '@/utils/math';
import { getStoreNetflowRate } from '@/utils/payment';
import { getTimestampInSeconds } from '@/utils/time';
import {
  MsgCancelCreateObjectTypeUrl,
  MsgDeleteObjectTypeUrl,
  MsgGrantAllowanceTypeUrl,
  MsgPutPolicyTypeUrl,
} from '@bnb-chain/greenfield-js-sdk';
import { ColoredWaitingIcon } from '@node-real/icons';
import { Flex, ModalBody, ModalFooter, ModalHeader, Text, toast } from '@node-real/uikit';
import { useAsyncEffect } from 'ahooks';
import { parseEther } from 'ethers/lib/utils.js';
import { round } from 'lodash-es';
import { memo, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

interface BatchDeleteObjectOperationProps {
  selectBucket: TBucket;
  bucketAccountDetail: TAccountInfo;
  refetch?: (name?: string) => void;
  onClose?: () => void;
}

export const BatchDeleteObjectOperation = memo<BatchDeleteObjectOperationProps>(
  function BatchDeleteObjectOperation({
    refetch = () => {},
    onClose = () => {},
    selectBucket: bucket,
    bucketAccountDetail: accountDetail,
  }) {
    const dispatch = useAppDispatch();
    const { loginAccount } = useAppSelector((root) => root.persist);
    const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
    const { bucketName, objectsInfo } = useAppSelector((root) => root.object);
    const [loading, setLoading] = useState(false);
    const [buttonDisabled] = useState(false);
    const { bankBalance } = useAppSelector((root) => root.accounts);
    const { setOpenAuthModal } = useOffChainAuth();

    const { gasObjects } = useAppSelector((root) => root.global.gasHub);
    const [refundAmount, setRefundAmount] = useState<string | null>(null);
    const { crudTimestamp } = useAppSelector(selectAccount(bucket?.PaymentAddress));
    const availableBalance = useAppSelector(selectAvailableBalance(bucket?.PaymentAddress));
    const [balanceEnough, setBalanceEnough] = useState(true);
    const { loading: loadingSettlementFee, settlementFee } = useSettlementFee(
      bucket?.PaymentAddress,
    );
    const deleteObjects = selectedRowKeys.map((key) => {
      return objectsInfo[bucketName + '/' + key];
    });
    const deleteFee = (gasObjects[MsgDeleteObjectTypeUrl]?.gasFee || 0) * deleteObjects.length;
    const cancelFee = gasObjects[MsgCancelCreateObjectTypeUrl]?.gasFee || 0;

    const createTmpAccountGasFee = useMemo(() => {
      const grantAllowTxFee = BN(gasObjects[MsgGrantAllowanceTypeUrl].gasFee).plus(
        BN(gasObjects[MsgGrantAllowanceTypeUrl].perItemFee).times(1),
      );
      const putPolicyTxFee = BN(gasObjects[MsgPutPolicyTypeUrl].gasFee);

      return grantAllowTxFee.plus(putPolicyTxFee).toString(DECIMAL_NUMBER);
    }, [gasObjects]);

    useAsyncEffect(async () => {
      if (!crudTimestamp || !deleteObjects.length) return;
      const curTime = getTimestampInSeconds();
      const latestStoreFeeParams = await getStoreFeeParams({ time: crudTimestamp });

      const refundAmount = deleteObjects.reduce((acc, cur) => {
        const netflowRate = getStoreNetflowRate(cur.ObjectInfo.PayloadSize, latestStoreFeeParams);
        const offsetTime = curTime - cur.ObjectInfo.CreateAt;
        const reserveTime = Number(latestStoreFeeParams.reserveTime);
        const refundTime = offsetTime > reserveTime ? offsetTime - reserveTime : 0;
        const objectRefund = BN(netflowRate).times(refundTime).abs().toString();

        return BN(acc).plus(objectRefund).toString();
      }, '0');

      setRefundAmount(refundAmount);
    }, [crudTimestamp, deleteObjects]);

    const simulateGasFee = BN(
      deleteObjects.reduce(
        (pre, cur) => pre + (cur.ObjectInfo.ObjectStatus === 1 ? deleteFee : cancelFee),
        0,
      ),
    )
      .plus(createTmpAccountGasFee)
      .toString();

    const { connector } = useAccount();

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
              icon: 'status-failed',
              desc: 'Sorry, there’s something wrong when signing with the wallet.',
              buttonText: BUTTON_GOT_IT,
              errorText: 'Error message: ' + error,
            }),
          );
      }
    };

    const onConfirmDelete = async () => {
      setLoading(true);
      onClose();
      dispatch(
        setStatusDetail({
          icon: Animates.delete,
          title: 'Deleting File',
          desc: WALLET_CONFIRM,
        }),
      );
      const [tempAccount, err] = await createTempAccount({
        address: loginAccount,
        bucketName,
        amount: parseEther(round(Number(availableBalance), 6).toString()).toNumber(),
        connector: connector!,
        actionType: 'delete',
      });
      if (!tempAccount) return errorHandler(err);
      dispatch(setTempAccounts(tempAccount));

      async function deleteInRow() {
        if (!tempAccount) return;
        const { privateKey, address: operator } = tempAccount;
        for await (const obj of deleteObjects) {
          const { ObjectName: objectName, ObjectStatus } = obj.ObjectInfo;
          const payload = {
            bucketName,
            objectName,
            loginAccount,
            operator,
            connector: connector!,
            privateKey,
          };
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
        await dispatch(setupAccountInfo(bucket.PaymentAddress));
        return true;
      }

      toast.info({ description: 'Deleting objects', icon: <ColoredWaitingIcon /> });
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
      <>
        <ModalHeader>Confirm Delete</ModalHeader>

        <ModalBody>
          <Text className="ui-modal-desc">{description}</Text>
          <TotalFees
            expandable={false}
            refund={true}
            gasFee={simulateGasFee}
            prepaidFee={refundAmount || ''}
            settlementFee={settlementFee}
            payStoreFeeAddress={bucket.PaymentAddress}
          />
          {!balanceEnough && (
            <Flex w={'100%'} justifyContent={'space-between'} mt="8px">
              <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
                <PaymentInsufficientBalance
                  gasFee={simulateGasFee}
                  storeFee={'0'}
                  refundFee={refundAmount || ''}
                  settlementFee={settlementFee}
                  payGasFeeBalance={bankBalance}
                  payStoreFeeBalance={accountDetail.staticBalance}
                  ownerAccount={loginAccount}
                  payAccount={bucket.PaymentAddress}
                  onValidate={setBalanceEnough}
                />
              </Text>
            </Flex>
          )}
        </ModalBody>

        <ModalFooter flexDirection={'row'}>
          <DCButton
            size={'lg'}
            variant="ghost"
            flex={1}
            onClick={onClose}
            gaClickName="dc.file.delete_confirm.cancel.click"
          >
            Cancel
          </DCButton>
          <DCButton
            variant={'scene'}
            colorScheme={'danger'}
            size={'lg'}
            gaClickName="dc.file.delete_confirm.delete.click"
            flex={1}
            onClick={onConfirmDelete}
            isLoading={loading || loadingSettlementFee}
            isDisabled={
              buttonDisabled || loadingSettlementFee || refundAmount === null || !balanceEnough
            }
          >
            Delete
          </DCButton>
        </ModalFooter>
      </>
    );
  },
);
