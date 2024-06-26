import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { Animates } from '@/components/AnimatePng';
import { CopyText } from '@/components/common/CopyText';
import { DCButton } from '@/components/common/DCButton';
import { DCDrawer } from '@/components/common/DCDrawer';
import { MonthlyDownloadQuota } from '@/components/formitems/MonthlyDownloadQuota';
import { G_BYTES } from '@/constants/legacy';
import { OWNER_ACCOUNT_NAME } from '@/constants/wallet';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import {
  UpdateBucketInfoPayload,
  getBucketExtraInfo,
  getBucketQuotaUpdateTime,
  updateBucketInfo,
} from '@/facade/bucket';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { getStoreFeeParams } from '@/facade/payment';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { TotalFees } from '@/modules/object/components/TotalFees';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { PaymentInsufficientBalance } from '@/modules/object/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount, selectPaymentAccounts } from '@/store/slices/accounts';
import { setBucketEditQuota, setupBucket, setupBucketQuota, TBucket } from '@/store/slices/bucket';
import {
  StoreFeeParams,
  selectGnfdGasFeesConfig,
  selectStoreFeeParams,
  setSignatureAction,
  setupStoreFeeParams,
} from '@/store/slices/global';
import { setupPrimarySpInfo } from '@/store/slices/sp';
import { BN } from '@/utils/math';
import { getQuotaNetflowRate, getStoreNetflowRate } from '@/utils/payment';
import { formatQuota, trimLongStr } from '@/utils/string';
import { MsgUpdateBucketInfoTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import styled from '@emotion/styled';
import {
  Divider,
  Flex,
  Link,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@node-real/uikit';
import { useAsyncEffect, useUnmount, useUpdateEffect } from 'ahooks';
import BigNumber from 'bignumber.js';
import { find, isEmpty } from 'lodash-es';
import { memo, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import { useAccountType } from '@/hooks/useAccountType';

const EMPTY_BUCKET = {} as TBucket;

interface ManageQuotaProps {
  onClose: () => void;
}

export const BucketQuotaManager = memo<ManageQuotaProps>(function ManageQuota({ onClose }) {
  const dispatch = useAppDispatch();
  const bucketEditQuota = useAppSelector((root) => root.bucket.bucketEditQuota);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const bucketQuotaRecords = useAppSelector((root) => root.bucket.bucketQuotaRecords);
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);
  const storeFeeParams = useAppSelector(selectStoreFeeParams);

  const [loading, setLoading] = useState(false);
  const [balanceEnough, setBalanceEnough] = useState(true);
  const [moniker, setMoniker] = useState('--');
  const [newChargedQuota, setNewChargedQuota] = useState(0);
  const [preStoreFeeParams, setPreStoreFeeParams] = useState({} as StoreFeeParams);
  const [chargeSize, setChargeSize] = useState(0);
  const [refund, setRefund] = useState(false);
  const [quotaUpdateTime, setQuotaUpdateTime] = useState<number>();
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const { gasFee } = gnfdGasFeesConfig?.[MsgUpdateBucketInfoTypeUrl] || {};
  const [bucketName] = bucketEditQuota;
  const bucket = bucketRecords[bucketName] || EMPTY_BUCKET;
  const PaymentAddress = bucket.PaymentAddress;
  const { pa, oa, isSponsor } = useAccountType(PaymentAddress);
  const { settlementFee } = useSettlementFee(PaymentAddress);
  const accountDetail = useAppSelector(selectAccount(PaymentAddress));
  const quota = bucketQuotaRecords[bucketName];
  const currentQuota = quota?.readQuota;
  const formattedQuota = formatQuota(quota);
  const valid = balanceEnough && !loading && newChargedQuota * G_BYTES > (currentQuota || 0);

  const totalFee = useMemo(() => {
    if (isEmpty(storeFeeParams) || isEmpty(preStoreFeeParams) || isSponsor) return '-1';
    const quotaRate = getQuotaNetflowRate(newChargedQuota * G_BYTES, storeFeeParams);
    const storeRate = getStoreNetflowRate(chargeSize, storeFeeParams, true);
    const preQuotaRate = getQuotaNetflowRate(currentQuota, storeFeeParams);
    const preStoreRate = getStoreNetflowRate(chargeSize, preStoreFeeParams, true);
    const fund = BN(quotaRate)
      .plus(storeRate)
      .minus(preQuotaRate)
      .minus(preStoreRate)
      .times(storeFeeParams.reserveTime);
    setRefund(fund.isNegative());
    return fund.abs().toString();
  }, [storeFeeParams, newChargedQuota, chargeSize, currentQuota, isSponsor]);

  const paymentAccount = useMemo(() => {
    if (!bucket) return '--';
    const address = bucket.PaymentAddress;
    const link = `${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`;
    return (
      <>
        {!isSponsor && (
          <>
            {oa ? OWNER_ACCOUNT_NAME : pa!.name}
            <Text mx={2}>|</Text>
          </>
        )}
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
  }, [pa, oa, isSponsor, bucket]);

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setSignatureAction({
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
      setSignatureAction({ icon: Animates.object, title: 'Updating Quota', desc: WALLET_CONFIRM }),
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
    dispatch(setSignatureAction({}));
    toast.success({ description: 'Quota updated!' });
    onClose();
    dispatch(setupBucketQuota(bucketName));
  };

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
    const sp = await dispatch(setupPrimarySpInfo(bucketName, +bucket.GlobalVirtualGroupFamilyId));
    if (!sp) return;
    setMoniker(sp.moniker);
  }, [bucket, bucketName]);

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
        {!!formattedQuota.monthlyFreeQuota && (
          <Field>
            <Label>Free monthly quota</Label>
            <Value>
              {formattedQuota.monthlyFreeQuotaText}/mo
              <Text as={'span'}>({formattedQuota.monthlyQuotaRemainText} remains)</Text>
            </Value>
          </Field>
        )}
        {!!formattedQuota.oneTimeFree && (
          <Field>
            <Label>Free quota (one-time)</Label>
            <Value>
              {formattedQuota.oneTimeFreeText}
              <Text as={'span'}>({formattedQuota.oneTimeFreeRemainText} remains)</Text>
            </Value>
          </Field>
        )}

        <Divider mt={8} mb={-8} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onConfirm();
          }}
        >
          <MonthlyDownloadQuota
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

interface BucketQuotaDrawerProps {}

export const BucketQuotaDrawer = memo<BucketQuotaDrawerProps>(function BucketQuotaDrawer() {
  const dispatch = useAppDispatch();
  const { pathname } = useRouter();
  const bucketEditQuota = useAppSelector((root) => root.bucket.bucketEditQuota);
  const [bucketName] = bucketEditQuota;

  const onClose = () => {
    dispatch(setBucketEditQuota(['', '']));
  };

  useUnmount(onClose);

  useUpdateEffect(() => {
    onClose();
  }, [pathname]);

  return (
    <DCDrawer isOpen={!!bucketName} onClose={onClose}>
      <QDrawerHeader>Manage Quota</QDrawerHeader>
      <BucketQuotaManager onClose={onClose} />
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

  span {
    margin-left: 4px;
    color: var(--ui-colors-readable-tertiary);
  }
`;
