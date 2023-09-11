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
import React, { useEffect, useMemo, useState } from 'react';
import { renderBalanceNumber, renderInsufficientBalance, renderPaymentInsufficientBalance } from '@/modules/file/utils';
import {
  BUTTON_GOT_IT,
  FILE_DELETE_GIF,
  FILE_DESCRIPTION_DELETE_ERROR,
  FILE_FAILED_URL,
  FILE_STATUS_DELETING,
  FILE_TITLE_DELETE_FAILED,
  FILE_TITLE_DELETING,
  FOLDER_DESC_NOT_EMPTY,
  FOLDER_NOT_EMPTY_ICON,
  FOLDER_TITLE_DELETING,
  FOLDER_TITLE_NOT_EMPTY,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { reportEvent } from '@/utils/reportEvent';
import { getClient } from '@/base/client';
import { signTypedDataV4 } from '@/utils/signDataV4';
import { E_USER_REJECT_STATUS_NUM, broadcastFault } from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ObjectItem,
  TStatusDetail,
  setEditDelete,
  setStatusDetail,
  addDeletedObject,
} from '@/store/slices/object';
import { MsgDeleteObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { useAsyncEffect } from 'ahooks';
import { selectStoreFeeParams } from '@/store/slices/global';
import { resolve } from '@/facade/common';
import { getListObjects } from '@/facade/object';
import { renderFee } from './CancelObject';
import { Tips } from '@/components/common/Tips';
import { selectAccount, selectAvailableBalance, setupAccountDetail } from '@/store/slices/accounts';
import { getStoreFeeParams } from '@/facade/payment';
import { BN } from '@/utils/BigNumber';
import { getNetflowRate } from '@/utils/payment';
import { getTimestampInSeconds } from '@/utils/time';
import { displayTime } from '@/utils/common';
import { useSettlementFee } from '@/hooks/useSettlementFee';
interface modalProps {
  refetch: () => void;
}

export const DeleteObject = ({ refetch }: modalProps) => {
  const dispatch = useAppDispatch();
  const [refundAmount, setRefundAmount] = useState<string | null>(null);
  const { loginAccount } = useAppSelector((root) => root.persist);
  // Since reserveTime rarely change, we can optimize performance by using global data.
  const {reserveTime} = useAppSelector(selectStoreFeeParams);
  const { price: bnbPrice } = useAppSelector((root) => root.global.bnb);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const { editDelete, bucketName } = useAppSelector((root) => root.object);
  const primarySp = primarySpInfo[bucketName];
  const exchangeRate = +bnbPrice ?? 0;
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const isOpen = !!editDelete.objectName;
  const isFolder = editDelete.objectName.endsWith('/');
  const [isFolderCanDelete, setFolderCanDelete] = useState(true);
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const bucket = bucketInfo[bucketName];
  const availableBalance = useAppSelector(selectAvailableBalance(bucket?.PaymentAddress))
  const accountDetail = useAppSelector(selectAccount(bucket.PaymentAddress));
  const { loading: loadingSettlementFee, settlementFee } = useSettlementFee(bucket.PaymentAddress);
  const onClose = () => {
    dispatch(setEditDelete({} as ObjectItem));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };
  const { gasObjects } = useAppSelector((root) => root.global.gasHub);
  const simulateGasFee = gasObjects[MsgDeleteObjectTypeUrl]?.gasFee ?? 0;
  const { connector } = useAccount();
  const isStoredAtMinimumTime = useMemo(() => {
    if (!reserveTime) return null;
    return BN(getTimestampInSeconds()).minus(editDelete.createAt).minus(reserveTime).isPositive();
  }, [editDelete.createAt, reserveTime]);
  const {crudTimestamp} = useAppSelector(selectAccount(bucket?.PaymentAddress));
  useAsyncEffect(async () => {
    if (isStoredAtMinimumTime === null) return;
    if (!isStoredAtMinimumTime) {
      return setRefundAmount('0');
    }
    const curTime = getTimestampInSeconds();
    const latestStoreFeeParams = await getStoreFeeParams(crudTimestamp);
    const netflowRate = getNetflowRate(editDelete.payloadSize, latestStoreFeeParams);
    if (BN(curTime).gt(BN(latestStoreFeeParams.reserveTime).plus(crudTimestamp))) {
      return setRefundAmount('0');
    }
    const refundAmount = BN(netflowRate)
      .times(BN(crudTimestamp).plus(latestStoreFeeParams.reserveTime).minus(curTime))
      .dividedBy(10 ** 18)
      .abs()
      .toString();
    setRefundAmount(refundAmount);
  }, [isOpen]);

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
    if (error || !res || res.code !== 0) return [null, String(error || res?.message)];
    const { GfSpListObjectsByBucketNameResponse } = res.body!;
    return (
      GfSpListObjectsByBucketNameResponse.KeyCount === '1' &&
      GfSpListObjectsByBucketNameResponse.Objects[0].ObjectInfo.ObjectName === objectName
    );
  };
  useAsyncEffect(async () => {
    if (!isFolder) return;
    setLoading(true);
    setButtonDisabled(true);
    const folderEmpty = await isFolderEmpty(editDelete.objectName);
    if (!folderEmpty) {
      dispatch(
        setStatusDetail({
          icon: FOLDER_NOT_EMPTY_ICON,
          title: FOLDER_TITLE_NOT_EMPTY,
          desc: '',
          buttonText: BUTTON_GOT_IT,
          errorText: FOLDER_DESC_NOT_EMPTY,
          buttonOnClick: () => {
            dispatch(setStatusDetail({} as TStatusDetail));
          },
        }),
      );
      setFolderCanDelete(false);
      onClose();
      return;
    } else {
      setLoading(false);
      setButtonDisabled(false);
    }
    dispatch(setStatusDetail({} as TStatusDetail));
    setFolderCanDelete(true);
  }, [isOpen, isFolder]);
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
  const filePath = editDelete.objectName.split('/');

  const showName = filePath[filePath.length - 1];
  const folderName = filePath[filePath.length - 2];
  const description = isFolder
    ? `Are you sure you want to delete folder "${folderName}"?`
    : `Are you sure you want to delete object "${showName}"?`;
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
    <>
      {isFolderCanDelete && (
        <DCModal
          isOpen={isOpen}
          onClose={onClose}
          w="568px"
          gaShowName="dc.file.delete_confirm.modal.show"
          gaClickCloseName="dc.file.delete_confirm.close.click"
        >
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalCloseButton />
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
              'Prepaid fee refund',
              refundAmount || '',
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
            {renderFee('Settlement fee', settlementFee + '', exchangeRate, loading)}
            {renderFee('Gas Fee', simulateGasFee + '', exchangeRate, loading)}
          </Flex>
          <Flex w={'100%'} justifyContent={'space-between'} mt="8px" mb={'36px'}>
            <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
              {renderInsufficientBalance(simulateGasFee + '', '0', availableBalance || '0', {
                gaShowName: 'dc.file.delete_confirm.depost.show',
                gaClickName: 'dc.file.delete_confirm.transferin.click',
              })}
              {renderPaymentInsufficientBalance({
                gasFee: simulateGasFee,
                refundFee: refundAmount || '',
                settlementFee,
                storeFee: '0',
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
                      signTypedDataCallback: async (addr: string, message: string) => {
                        const provider = await connector?.getProvider();
                        return await signTypedDataV4(provider, addr, message);
                      },
                    })
                    .then(resolve, broadcastFault);
                  if (txRes === null) {
                    dispatch(setStatusDetail({} as TStatusDetail));
                    return toast.error({ description: error || 'Delete object error.' });
                  }
                  if (txRes.code === 0) {
                    await dispatch(setupAccountDetail(bucket.PaymentAddress))
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
                        path: [bucketName, editDelete.objectName].join('/'),
                        ts: Date.now(),
                      }),
                    );
                  } else {
                    toast.error({ description: 'Delete object error.' });
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
                  console.error('Delete object error.', error);
                  setFailedStatusModal(FILE_DESCRIPTION_DELETE_ERROR, error);
                }
              }}
              colorScheme="danger"
              isLoading={loading || refundAmount === null || loadingSettlementFee}
              isDisabled={buttonDisabled || refundAmount === null || loadingSettlementFee}
            >
              Delete
            </DCButton>
          </ModalFooter>
        </DCModal>
      )}
    </>
  );
};
