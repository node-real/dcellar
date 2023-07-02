import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Link,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
  toast,
} from '@totejs/uikit';
import BigNumber from 'bignumber.js';
import { useAccount, useNetwork } from 'wagmi';
import { isEmpty } from 'lodash-es';
import NextLink from 'next/link';

import { GasFee } from '@/modules/buckets/List/components/GasFee';
import { deleteBucket, getDeleteBucketFee } from '@/modules/buckets/List/utils';
import { DeleteBucketFailed } from './DeleteFailed';
import { BucketNotEmpty } from '@/modules/buckets/List/components/BucketNotEmpty';
import { DeletingBucket } from '@/modules/buckets/List/components/DeletingBucket';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { InternalRoutePaths } from '@/constants/paths';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { reportEvent } from '@/utils/reportEvent';
import { useAppSelector } from '@/store';
import { selectBalance } from '@/store/slices/global';

export const DeleteBucket = ({ isOpen, onClose, bucketName, refetch, sp }: any) => {
  const [gasFee, setGasFee] = useState(BigNumber('0'));
  const [isGasLoading, setIsGasLoading] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  // pending, fetching, failed, notEmpty
  const [status, setStatus] = useState('pending');
  const { connector } = useAccount();
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { availableBalance } = useAppSelector(selectBalance(address));
  const balance = BigNumber(availableBalance || 0);
  const { chain } = useNetwork();

  const requestGetBucketFee = useCallback(async () => {
    setIsGasLoading(true);
    let decimalGasFee = '0';
    try {
      decimalGasFee = await getDeleteBucketFee({ bucketName, address, chainId: chain?.id });
      setGasFee(BigNumber(decimalGasFee));
    } catch (e: any) {
      if (e?.message.toLowerCase().includes('bucket is not empty')) {
        setStatus('notEmpty');
      }
      // eslint-disable-next-line no-console
      console.log('get Bucket fee', e);
    }
    setIsGasLoading(false);
  }, [address, bucketName, chain?.id]);

  useEffect(() => {
    if (isEmpty(chain)) return;
    requestGetBucketFee();
  }, [chain, requestGetBucketFee]);

  const isEnoughBalance = useMemo(() => {
    if (balance.comparedTo(MIN_AMOUNT) > 0 && balance.comparedTo(gasFee) >= 0) {
      return true;
    }

    return false;
  }, [balance, gasFee]);

  const onDeleteClick = async () => {
    setStatus('operating');
    try {
      const provider = await connector?.getProvider();
      const txRes = await deleteBucket({
        address,
        chain,
        bucketName: bucketName,
        sp,
        provider,
      });
      if (txRes.code === 0) {
        refetch();
        onClose();
        toast.success({
          description: `Bucket deleted successfully!`,
        });
        setTimeout(() => {
          setStatus('pending');
        }, 200);
        reportEvent({
          name: 'dc.toast.bucket_delete.success.show',
        });
      } else {
        throw txRes;
      }
    } catch (e: any) {
      const message = e?.message;
      message && setDeleteErrorMsg(message);
      setStatus('failed');
    }
  };

  const DeleteBucket = () => {
    return (
      <>
        <ModalHeader lineHeight={'36px'}>Confirm Delete</ModalHeader>
        <ModalBody marginTop={'8px'} paddingBottom={'32px'}>
          <Box textAlign={'center'} color={'#474D57'} fontSize={'18px'}>
            {`Are you sure to delete this bucket "${bucketName}"?`}
          </Box>
          <GasFee hasError={!!deleteErrorMsg} gasFee={gasFee} isGasLoading={isGasLoading} />
          {!isEnoughBalance && !isGasLoading && (
            <Flex marginTop={'4px'} color={'#ee3911'} textAlign={'right'}>
              <Text>Insufficient balance. </Text>
              <GAShow name="dc.bucket.delete_confirm.transferin.show" />
              <GAClick name="dc.bucket.delete_confirm.transferin.click">
                <Link
                  as={NextLink}
                  textAlign={'right'}
                  cursor={'pointer'}
                  color="#ee3911"
                  _hover={{ color: '#ee3911' }}
                  textDecoration={'underline'}
                  href={InternalRoutePaths.transfer_in}
                >
                  &nbsp;Transfer In
                </Link>
              </GAClick>
            </Flex>
          )}
        </ModalBody>
        <ModalFooter>
          <DCButton
            variant="dcGhost"
            width={'100%'}
            onClick={onClose}
            gaClickName="dc.bucket.delete_confirm.cancel.click"
          >
            Cancel
          </DCButton>
          <DCButton
            variant="dcDanger"
            disabled={isGasLoading || !isEnoughBalance}
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
      {status === 'failed' && <DeleteBucketFailed onClose={onClose} errorMsg={deleteErrorMsg} />}
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
