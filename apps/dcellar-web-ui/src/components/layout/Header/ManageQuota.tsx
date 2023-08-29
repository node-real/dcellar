import React, { memo, useEffect, useMemo, useState } from 'react';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditQuota } from '@/store/slices/bucket';
import { BackIcon } from '@totejs/icons';
import {
  Divider,
  Flex,
  Link,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@totejs/uikit';
import styled from '@emotion/styled';
import { formatBytes } from '@/modules/file/utils';
import { useAsyncEffect, useMount, useUnmount } from 'ahooks';
import { setupPAList } from '@/store/slices/accounts';
import { find } from 'lodash-es';
import { CopyText } from '@/components/common/CopyText';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { trimLongStr } from '@/utils/string';
import { getPrimarySpInfo } from '@/store/slices/sp';
import { QuotaItem } from '@/components/formitems/QuotaItem';
import { G_BYTES } from '@/utils/constant';
import { DCButton } from '@/components/common/DCButton';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  PENDING_ICON_URL,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/file/constant';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { updateBucketInfo } from '@/facade/bucket';
import { useAccount } from 'wagmi';
import { MsgUpdateBucketInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import Long from 'long';

interface ManageQuotaProps {
  onClose: () => void;
}

export const ManageQuota = memo<ManageQuotaProps>(function ManageQuota({ onClose }) {
  const dispatch = useAppDispatch();
  const { editQuota, bucketInfo, quotas } = useAppSelector((root) => root.bucket);
  const { ownerAccount, PAList } = useAppSelector((root) => root.accounts);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const [bucketName] = editQuota;
  const bucket = bucketInfo[bucketName] || {};
  const quota = quotas[bucketName];
  const [moniker, setMoniker] = useState('--');
  const [newChargedQuota, setNewChargedQuota] = useState(0);
  const currentQuota = quota?.readQuota;
  const { setOpenAuthModal } = useOffChainAuth();
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();

  const paymentAccount = useMemo(() => {
    if (!bucket) return '--';
    const address = bucket.PaymentAddress;
    const pa = find(PAList, (a) => a.address === address);
    const oa = ownerAccount.address === address;

    if (!pa && !oa) return '--';

    const link = `${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`;
    return (
      <>
        {oa ? 'Owner Account' : pa!.name}
        <Text mx={2}>|</Text>
        <Link
          target="_blank"
          color="#1184EE"
          cursor={'pointer'}
          textDecoration={'underline'}
          _hover={{
            color: '#3C9AF1',
          }}
          href={link}
          fontSize={'14px'}
          fontWeight={500}
        >
          {trimLongStr(address, 16, 4, 5)}
        </Link>
        <CopyText value={link} />
      </>
    );
  }, [ownerAccount, PAList, bucket]);

  useEffect(() => {
    if (!quota) return;
    setNewChargedQuota(currentQuota / G_BYTES);
  }, [currentQuota]);

  useMount(() => {
    dispatch(setupPAList());
  });

  useAsyncEffect(async () => {
    if (!bucket) return;
    const sp = await dispatch(getPrimarySpInfo(bucketName, +bucket.GlobalVirtualGroupFamilyId));
    if (!sp) return;
    setMoniker(sp.moniker);
  }, [bucket, bucketName]);

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: 'Update Failed',
            icon: FILE_FAILED_URL,
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
          }),
        );
    }
  };

  const onConfirm = async () => {
    if (loading) return;
    if (currentQuota === newChargedQuota * G_BYTES) {
      toast.success({ description: 'Quota updated!' });
      onClose();
      return;
    }
    setLoading(true);
    dispatch(
      setStatusDetail({ icon: PENDING_ICON_URL, title: 'Updating Quota', desc: WALLET_CONFIRM }),
    );

    // todo
    const payload: MsgUpdateBucketInfo = {
      operator: loginAccount,
      bucketName: bucket.BucketName,
      // @ts-ignore
      visibility: bucket.Visibility,
      paymentAddress: bucket.PaymentAddress,
      chargedReadQuota: { value: Long.fromNumber(newChargedQuota * G_BYTES) },
    };

    console.log(payload);
    const [txRes, txError] = await updateBucketInfo(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Quota updated!' });
    onClose();
  };

  return (
    <>
      <QDrawerBody mt={24}>
        <Text fontWeight={500} lineHeight="normal">
          Bucket Info
        </Text>
        <Divider my={8} />
        <Field>
          <Label>Bucket name</Label>
          <Value>{bucket.BucketName}</Value>
        </Field>
        <Field>
          <Label>Payment account</Label>
          <Value>{paymentAccount}</Value>
        </Field>
        <Field>
          <Label>Primary storage provider</Label>
          <Value>{moniker}</Value>
        </Field>
        <Field>
          <Label>Free quota (one-time)</Label>
          <Value>{quota ? formatBytes(quota.freeQuota) : '--'}</Value>
        </Field>
        <Divider my={8} />
        <QuotaItem
          current={!quota ? 0 : currentQuota / G_BYTES}
          value={newChargedQuota}
          onChange={setNewChargedQuota}
        />
      </QDrawerBody>
      <QDrawerFooter>
        <DCButton
          disabled={loading}
          variant="dcPrimary"
          backgroundColor={'readable.brand6'}
          height={'48px'}
          width={'100%'}
          onClick={onConfirm}
        >
          Confirm
        </DCButton>
      </QDrawerFooter>
    </>
  );
});

interface ManageQuotaDrawerProps {}

export const ManageQuotaDrawer = memo<ManageQuotaDrawerProps>(function ManageQuotaDrawer() {
  const dispatch = useAppDispatch();
  const { editQuota } = useAppSelector((root) => root.bucket);
  const [bucketName, from] = editQuota;

  const onClose = () => {
    dispatch(setEditQuota(['', '']));
  };

  useUnmount(onClose);

  return (
    <DCDrawer isOpen={!!bucketName} onClose={onClose} showCloseBtn={from !== 'drawer'}>
      <QDrawerHeader alignItems="center" lineHeight="normal">
        {from === 'drawer' && <BackIcon mr={8} cursor="pointer" onClick={onClose} />}
        Manage Quota
      </QDrawerHeader>
      <ManageQuota onClose={onClose} />
    </DCDrawer>
  );
});

const Field = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  margin: 8px 0;
  padding: 2px 0;
`;

const Label = styled.div`
  font-weight: 500;
  line-height: normal;
  color: #76808f;
  flex-shrink: 0;
  width: 178px;
`;

const Value = styled(Flex)`
  font-weight: 500;
  line-height: normal;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  align-items: center;
`;
