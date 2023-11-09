import { Flex, Link, ModalBody, ModalFooter, ModalHeader, Text, toast } from '@totejs/uikit';
import { useAccount } from 'wagmi';
import React, { memo, useMemo, useState } from 'react';
import {
  BUTTON_GOT_IT,
  FILE_DESCRIPTION_DELETE_ERROR,
  FILE_TITLE_DELETE_FAILED,
  FOLDER_DESC_NOT_EMPTY,
  FOLDER_TITLE_NOT_EMPTY,
  WALLET_CONFIRM,
} from '@/modules/object/constant';
import { DCButton } from '@/components/common/DCButton';
import { broadcastFault, E_USER_REJECT_STATUS_NUM } from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addDeletedObject,
  setObjectList,
  setSelectedRowKeys,
  setStatusDetail,
  TStatusDetail,
} from '@/store/slices/object';
import { MsgDeleteObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { useAsyncEffect } from 'ahooks';
import { selectStoreFeeParams } from '@/store/slices/global';
import { resolve } from '@/facade/common';
import { getListObjects } from '@/facade/object';
import { selectAccount, setupAccountInfo, TAccountInfo } from '@/store/slices/accounts';
import { getStoreFeeParams } from '@/facade/payment';
import { getStoreNetflowRate } from '@/utils/payment';
import { getTimestampInSeconds } from '@/utils/time';
import { displayTime } from '@/utils/common';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { AllBucketInfo } from '@/store/slices/bucket';
import { SpItem } from '@/store/slices/sp';
import { useModalValues } from '@/hooks/useModalValues';
import { BN } from '@/utils/math';
import { PaymentInsufficientBalance } from '@/modules/object/utils';
import { getClient } from '@/facade';
import { signTypedDataCallback } from '@/facade/wallet';
import { reportEvent } from '@/utils/gtag';
import { Animates } from '@/components/AnimatePng';
import { TotalFees } from '@/modules/object/components/TotalFees';
import { without } from 'lodash-es';

interface DeleteObjectOperationProps {
  selectObjectInfo: ObjectMeta;
  selectBucket: AllBucketInfo;
  bucketAccountDetail: TAccountInfo;
  primarySp: SpItem;
  refetch?: () => void;
  onClose?: () => void;
  objectName: string;
}

export const DeleteObjectOperation = memo<DeleteObjectOperationProps>(
  function DeleteObjectOperation({
    refetch = () => {},
    onClose = () => {},
    selectObjectInfo,
    selectBucket: bucket,
    bucketAccountDetail: accountDetail,
    primarySp,
    objectName: _objectName,
  }) {
    const dispatch = useAppDispatch();
    const [refundAmount, setRefundAmount] = useState<string | null>(null);
    const { loginAccount } = useAppSelector((root) => root.persist);
    // Since reserveTime rarely change, we can optimize performance by using global data.
    const { reserveTime } = useAppSelector(selectStoreFeeParams);
    const { bucketName, path, selectedRowKeys } = useAppSelector((root) => root.object);
    const [balanceEnough, setBalanceEnough] = useState(true);
    const [loading, setLoading] = useState(false);
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const objectInfo = selectObjectInfo.ObjectInfo || {};
    const objectName = useModalValues(_objectName);
    const isFolder = objectName.endsWith('/');
    const { bankBalance } = useAppSelector((root) => root.accounts);
    const { loading: loadingSettlementFee, settlementFee } = useSettlementFee(
      bucket.PaymentAddress,
    );
    const { gasObjects } = useAppSelector((root) => root.global.gasHub);
    const simulateGasFee = gasObjects[MsgDeleteObjectTypeUrl]?.gasFee ?? 0;
    const { connector } = useAccount();
    const isStoredAtMinimumTime = useMemo(() => {
      if (!reserveTime) return null;
      return BN(getTimestampInSeconds()).minus(objectInfo.CreateAt).minus(reserveTime).isPositive();
    }, [objectInfo.CreateAt, reserveTime]);
    const { crudTimestamp } = useAppSelector(selectAccount(bucket?.PaymentAddress));

    useAsyncEffect(async () => {
      if (!objectInfo.CreateAt) return;
      const curTime = getTimestampInSeconds();
      const latestStoreFeeParams = await getStoreFeeParams({ time: crudTimestamp });
      const netflowRate = getStoreNetflowRate(objectInfo.PayloadSize, latestStoreFeeParams);
      const offsetTime = curTime - objectInfo.CreateAt;
      const refundTime = Math.min(offsetTime, Number(latestStoreFeeParams.reserveTime));
      const refundAmount = BN(netflowRate)
        .times(refundTime)
        .dividedBy(10 ** 18)
        .abs()
        .toString();
      setRefundAmount(refundAmount);
    }, [crudTimestamp, objectInfo.CreateAt]);

    const isFolderEmpty = async (objectName: string) => {
      const _query = new URLSearchParams();
      _query.append('delimiter', '/');
      _query.append('maxKeys', '2');
      _query.append('prefix', `${objectName}`);

      const params = {
        address: primarySp.operatorAddress,
        bucketName: bucketName,
        prefix: objectName,
        query: _query,
        endpoint: primarySp.endpoint,
        seedString: '',
      };
      const [res, error] = await getListObjects(params);
      // should never happen
      if (error || !res || res.code !== 0) return false;
      const { GfSpListObjectsByBucketNameResponse } = res.body!;
      // 更新文件夹objectInfo
      dispatch(
        setObjectList({ path, list: GfSpListObjectsByBucketNameResponse || [], infoOnly: true }),
      );
      return (
        GfSpListObjectsByBucketNameResponse.KeyCount === '1' &&
        GfSpListObjectsByBucketNameResponse.Objects[0].ObjectInfo.ObjectName === objectName
      );
    };

    useAsyncEffect(async () => {
      if (!isFolder) return;
      setLoading(true);
      setButtonDisabled(true);
      const folderEmpty = await isFolderEmpty(objectName);
      if (!folderEmpty) {
        dispatch(
          setStatusDetail({
            icon: 'empty-bucket',
            title: FOLDER_TITLE_NOT_EMPTY,
            desc: '',
            buttonText: BUTTON_GOT_IT,
            errorText: FOLDER_DESC_NOT_EMPTY,
          }),
        );
        onClose();
        return;
      } else {
        setLoading(false);
        setButtonDisabled(false);
      }
      dispatch(setStatusDetail({} as TStatusDetail));
    }, [isFolder]);

    const filePath = objectName.split('/');

    const showName = filePath[filePath.length - 1];
    const folderName = filePath[filePath.length - 2];
    const description = isFolder
      ? `Are you sure you want to delete folder "${folderName}"?`
      : `Are you sure you want to delete object "${showName}"?`;
    const setFailedStatusModal = (description: string, error: any) => {
      dispatch(
        setStatusDetail({
          icon: 'status-failed',
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
      <>
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalBody>
          {!isFolder && isStoredAtMinimumTime !== null && !isStoredAtMinimumTime && (
            <Text
              fontSize="18px"
              lineHeight={'22px'}
              fontWeight={400}
              textAlign={'center'}
              marginTop="8px"
              color={'readable.secondary'}
              mb={'12px'}
            >
              You’ve paid {displayTime(reserveTime)} locked storage fee for this object, but this
              object has been stored less than {displayTime(reserveTime)}.{' '}
              <Link
                color="readable.normal"
                textDecoration={'underline'}
                cursor={'pointer'}
                href="https://docs.nodereal.io/docs/dcellar-faq#fee-related "
                target="_blank"
              >
                Learn more
              </Link>
            </Text>
          )}
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

        <ModalFooter mt={32} flexDirection={'row'}>
          <DCButton
            size="lg"
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
            size="lg"
            gaClickName="dc.file.delete_confirm.delete.click"
            flex={1}
            onClick={async () => {
              try {
                setLoading(true);
                onClose();
                dispatch(
                  setStatusDetail({
                    icon: Animates.delete,
                    title: isFolder ? 'Deleting Folder' : 'Deleting File',
                    desc: WALLET_CONFIRM,
                  }),
                );
                const client = await getClient();
                const delObjTx = await client.object.deleteObject({
                  bucketName,
                  objectName: objectName,
                  operator: loginAccount,
                });
                const simulateInfo = await delObjTx.simulate({
                  denom: 'BNB',
                });
                const [txRes, error] = await delObjTx
                  .broadcast({
                    denom: 'BNB',
                    gasLimit: Number(simulateInfo?.gasLimit),
                    gasPrice: simulateInfo?.gasPrice || '5000000000',
                    payer: loginAccount,
                    granter: '',
                    signTypedDataCallback: signTypedDataCallback(connector!),
                  })
                  .then(resolve, broadcastFault);
                if (txRes === null) {
                  dispatch(setStatusDetail({} as TStatusDetail));
                  return toast.error({ description: error || 'Object deletion failed.' });
                }
                if (txRes.code === 0) {
                  await dispatch(setupAccountInfo(bucket.PaymentAddress));
                  toast.success({
                    description: isFolder
                      ? 'Folder deleted successfully.'
                      : 'Object deleted successfully.',
                  });
                  reportEvent({
                    name: 'dc.toast.file_delete.success.show',
                  });
                  dispatch(
                    addDeletedObject({
                      path: [bucketName, objectName].join('/'),
                      ts: Date.now(),
                    }),
                  );
                  // unselected
                  dispatch(setSelectedRowKeys(without(selectedRowKeys, objectInfo.ObjectName)));
                } else {
                  toast.error({ description: 'Object deletion failed.' });
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
                  return;
                }
                // eslint-disable-next-line no-console
                console.error('Object deletion failed.', error);
                setFailedStatusModal(FILE_DESCRIPTION_DELETE_ERROR, error);
              }
            }}
            isLoading={loading || refundAmount === null || loadingSettlementFee}
            isDisabled={
              buttonDisabled || refundAmount === null || loadingSettlementFee || !balanceEnough
            }
          >
            Delete
          </DCButton>
        </ModalFooter>
      </>
    );
  },
);
