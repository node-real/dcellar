import React, { memo, useEffect, useMemo, useState } from 'react';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditQuota, setupBucket, setupBucketQuota } from '@/store/slices/bucket';
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
import { useAsyncEffect, useUnmount } from 'ahooks';
import { selectAccount, selectPaymentAccounts } from '@/store/slices/accounts';
import { find, isEmpty } from 'lodash-es';
import { CopyText } from '@/components/common/CopyText';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { formatQuota, trimLongStr } from '@/utils/string';
import { getPrimarySpInfo } from '@/store/slices/sp';
import { QuotaItem } from '@/components/formitems/QuotaItem';
import { OWNER_ACCOUNT_NAME } from '@/constants/wallet';
import { G_BYTES } from '@/constants/legacy';
import { DCButton } from '@/components/common/DCButton';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import {
  getBucketExtraInfo,
  getBucketQuotaUpdateTime,
  updateBucketInfo,
  UpdateBucketInfoPayload,
} from '@/facade/bucket';
import { useAccount } from 'wagmi';
import { TotalFees } from '@/modules/object/components/TotalFees';
import { MsgUpdateBucketInfoTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { selectStoreFeeParams, setupStoreFeeParams, TStoreFeeParams } from '@/store/slices/global';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { getQuotaNetflowRate, getStoreNetflowRate } from '@/utils/payment';
import { getStoreFeeParams } from '@/facade/payment';
import BigNumber from 'bignumber.js';
import { BN } from '@/utils/math';
import { PaymentInsufficientBalance } from '@/modules/object/utils';
import { Animates } from '@/components/AnimatePng';

interface ManageQuotaProps {
  onClose: () => void;
}

export const ManageQuota = memo<ManageQuotaProps>(function ManageQuota({ onClose }) {
  const dispatch = useAppDispatch();
  const { editQuota, bucketInfo, quotas } = useAppSelector((root) => root.bucket);
  const { ownerAccount } = useAppSelector((root) => root.accounts);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const PAList = useAppSelector(selectPaymentAccounts(loginAccount));
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee } = gasObjects?.[MsgUpdateBucketInfoTypeUrl] || {};
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const [bucketName] = editQuota;
  const bucket = bucketInfo[bucketName] || {};
  const PaymentAddress = bucket.PaymentAddress;
  const { settlementFee } = useSettlementFee(PaymentAddress);
  const accountDetail = useAppSelector(selectAccount(PaymentAddress));
  const [balanceEnough, setBalanceEnough] = useState(true);
  const quota = quotas[bucketName];
  const [moniker, setMoniker] = useState('--');
  const [newChargedQuota, setNewChargedQuota] = useState(0);
  const currentQuota = quota?.readQuota;
  const { setOpenAuthModal } = useOffChainAuth();
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const formattedQuota = formatQuota(quota);
  const [preStoreFeeParams, setPreStoreFeeParams] = useState({} as TStoreFeeParams);
  const [chargeSize, setChargeSize] = useState(0);
  const [refund, setRefund] = useState(false);
  const [quotaUpdateTime, setQuotaUpdateTime] = useState<number>();

  useAsyncEffect(async () => {
    if (!bucketName) return;
    const updateAt = await getBucketQuotaUpdateTime(bucketName);
    setQuotaUpdateTime(updateAt);
  }, [bucketName]);

  useAsyncEffect(async () => {
    if (!isEmpty(storeFeeParams)) return;
    dispatch(setupStoreFeeParams());
  }, [dispatch]);

  useAsyncEffect(async () => {
    if (!PaymentAddress) return;
    const { extraInfo } = await getBucketExtraInfo(bucketName);
    const { priceTime, localVirtualGroups = [] } = extraInfo || {};
    const totalChargeSize = localVirtualGroups
      .reduce((a, b) => a.plus(Number(b.totalChargeSize)), BigNumber(0))
      .toNumber();
    setChargeSize(totalChargeSize);
    const preStoreFeeParams = await getStoreFeeParams({ time: Number(priceTime) });
    setPreStoreFeeParams(preStoreFeeParams);
  }, [PaymentAddress]);

  const totalFee = useMemo(() => {
    if (isEmpty(storeFeeParams) || isEmpty(preStoreFeeParams)) return '-1';
    const quotaRate = getQuotaNetflowRate(newChargedQuota * G_BYTES, storeFeeParams);
    const storeRate = getStoreNetflowRate(chargeSize, storeFeeParams);
    const preQuotaRate = getQuotaNetflowRate(currentQuota, storeFeeParams);
    const preStoreRate = getStoreNetflowRate(chargeSize, preStoreFeeParams);
    const fund = BN(quotaRate)
      .plus(storeRate)
      .minus(preQuotaRate)
      .minus(preStoreRate)
      .times(storeFeeParams.reserveTime);
    setRefund(fund.isNegative());
    return fund.abs().toString();
  }, [storeFeeParams, newChargedQuota, chargeSize, currentQuota]);

  const paymentAccount = useMemo(() => {
    if (!bucket) return '--';
    const address = bucket.PaymentAddress;
    const pa = find(PAList, (a) => a.address === address);
    const oa = ownerAccount.address === address;

    if (!pa && !oa) return '--';

    const link = `${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`;
    return (
      <>
        {oa ? OWNER_ACCOUNT_NAME : pa!.name}
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
    if (!bucketName) return;
    dispatch(setupBucket(bucketName));
  }, [bucketName, dispatch]);

  useEffect(() => {
    if (!quota) return;
    setNewChargedQuota(currentQuota / G_BYTES);
  }, [currentQuota]);

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
            icon: 'status-failed',
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
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
      setStatusDetail({ icon: Animates.object, title: 'Updating Quota', desc: WALLET_CONFIRM }),
    );

    const payload: UpdateBucketInfoPayload = {
      operator: loginAccount,
      bucketName: bucket.BucketName,
      visibility: bucket.Visibility,
      paymentAddress: bucket.PaymentAddress,
      chargedReadQuota: String(newChargedQuota * G_BYTES),
    };

    const [txRes, txError] = await updateBucketInfo(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Quota updated!' });
    onClose();
    dispatch(setupBucketQuota(bucketName));
  };

  const valid = balanceEnough && !loading && newChargedQuota * G_BYTES > (currentQuota || 0);

  return (
    <>
      <QDrawerBody>
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
          <Value>{formattedQuota.totalFreeText}</Value>
        </Field>
        <Divider mt={8} mb={-8} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onConfirm();
          }}
        >
          <QuotaItem
            current={!quota ? 0 : currentQuota / G_BYTES}
            value={newChargedQuota}
            onChange={setNewChargedQuota}
            quotaUpdateAt={quotaUpdateTime}
          />
        </form>
      </QDrawerBody>
      <QDrawerFooter w="100%" flexDirection={'column'}>
        <TotalFees
          gasFee={gasFee}
          refund={refund}
          prepaidFee={totalFee}
          settlementFee={settlementFee}
          payStoreFeeAddress={PaymentAddress}
        />
        <PaymentInsufficientBalance
          gasFee={gasFee}
          storeFee={refund ? '0' : totalFee}
          refundFee={refund ? totalFee : '0'}
          settlementFee={settlementFee}
          payGasFeeBalance={bankBalance}
          payStoreFeeBalance={accountDetail.staticBalance}
          ownerAccount={loginAccount}
          payAccount={PaymentAddress}
          onValidate={setBalanceEnough}
        />
        <DCButton
          size={'lg'}
          disabled={!valid}
          backgroundColor={'brand.brand6'}
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
    <DCDrawer isOpen={!!bucketName} onClose={onClose}>
      <QDrawerHeader>Manage Quota</QDrawerHeader>
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
