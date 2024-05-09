import { Animates } from '@/components/AnimatePng';
import { InsufficientBalances } from '@/components/Fee/InsufficientBalances';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { TBucket, setBucketEditQuota, setupBucketList } from '@/store/slices/bucket';
import { migrateBucket, pollingGetBucket } from '@/facade/bucket';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { formatQuota } from '@/utils/string';
import {
  Divider,
  Flex,
  FormControl,
  FormLabel,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@node-real/uikit';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { selectGnfdGasFeesConfig, setSignatureAction } from '@/store/slices/global';
import { Field, Label, Value } from './style';
import { SPSelector } from './SPSelector';
import { SpEntity } from '@/store/slices/sp';
import { selectBucketSp } from '@/store/slices/sp';
import {
  AuthType,
  BucketStatus,
  MigrateBucketApprovalRequest,
  MsgMigrateBucketTypeUrl,
} from '@bnb-chain/greenfield-js-sdk';
import { getSpOffChainData } from '@/store/slices/persist';
import { MigrateBucketFees } from './MigrateBucketFees';
import { formatBytes } from '@/utils/formatter';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { BN } from '@/utils/math';

export const MigrateBucketOperation = memo(function MigrateBucketOperation({
  bucket,
  onClose,
}: {
  bucket: TBucket;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const [insufficientBalanceAccounts, setInsufficientBalanceAccounts] = useState<string[]>([]);

  /* @ts-expect-error StorageSize exist */
  const bucketStorageSize = bucket?.StorageSize;
  const primarySp = useAppSelector(selectBucketSp(bucket))!;
  const selectedSpRef = useRef<SpEntity>(primarySp);

  const bucketQuotaRecords = useAppSelector((root) => root.bucket.bucketQuotaRecords);
  const bucketQuota = bucketQuotaRecords[bucket.BucketName];
  const formattedQuota = formatQuota(bucketQuota);

  const loginAccount = useAppSelector((root) => root.persist.loginAccount);

  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);
  const { gasFee } = gnfdGasFeesConfig?.[MsgMigrateBucketTypeUrl] ?? {};
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { settlementFee, loading: loading1 } = useSettlementFee(bucket.PaymentAddress);
  const accountInfos = useAppSelector((root) => root.accounts.accountInfos);

  const isPayQuota = BN(formattedQuota.remain).gt(bucketStorageSize);
  const isPayFee = useMemo(() => {
    const insufficientBalanceAccounts = [];
    const isPayGasFee = BN(bankBalance).gte(gasFee);
    const isPaySettlementFee =
      bucket.PaymentAddress.toLowerCase() === loginAccount.toLowerCase()
        ? BN(bankBalance).plus(accountInfos[bucket.PaymentAddress].staticBalance).gte(settlementFee)
        : BN(accountInfos[bucket.PaymentAddress].staticBalance).gte(settlementFee);

    !isPayGasFee && insufficientBalanceAccounts.push(loginAccount);
    !isPaySettlementFee && insufficientBalanceAccounts.push(bucket.PaymentAddress);
    setInsufficientBalanceAccounts(Array.from(new Set(insufficientBalanceAccounts)));

    return isPayGasFee && isPaySettlementFee;
  }, [accountInfos, bankBalance, bucket.PaymentAddress, gasFee, loginAccount, settlementFee]);

  const valid = !loading && isPayFee && isPayQuota;
  bucket;

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

  const onChangeConfirm = async () => {
    if (loading) return;
    setLoading(true);
    dispatch(
      setSignatureAction({
        icon: Animates.object,
        title: 'Changing Primary Storage Provider',
        desc: WALLET_CONFIRM,
      }),
    );
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const payload: MigrateBucketApprovalRequest = {
      operator: loginAccount,
      bucketName: bucket.BucketName,
      endpoint: selectedSpRef.current.endpoint,
      dstPrimarySpId: selectedSpRef.current.id,
    };
    const authType: AuthType = {
      type: 'EDDSA',
      address: loginAccount,
      domain: window.location.origin,
      seed: seedString,
    };
    const [txRes, txError] = await migrateBucket(payload, authType, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setSignatureAction({}));
    toast.success({ description: 'Primary Storage Provider updated!' });
    onClose();
    dispatch(setupBucketList(loginAccount));
  };

  const onSpChange = useCallback((sp: SpEntity) => {
    selectedSpRef.current = sp;
  }, []);

  const onManageQuota = () => {
    dispatch(setBucketEditQuota([bucket.BucketName, 'drawer']));
  };

  return (
    <>
      <QDrawerHeader flexDir={'column'}>
        <Flex cursor={'pointer'} alignItems={'center'} onClick={onClose} gap={8}>
          <IconFont type="back" />
          Change Primary Storage Provider
        </Flex>
        <Text fontSize={16} fontWeight={400} color={'readable.tertiary'}>
          Migrate your storage to another primary storage provider. This operation consumes a quota
          of the same size as the bucket size.
        </Text>
      </QDrawerHeader>
      <QDrawerBody>
        <Text fontWeight={500} lineHeight="normal">
          Bucket Info
        </Text>
        <Divider my={8} />
        <Field>
          <Label>Bucket name</Label>
          <Value>{bucket?.BucketName}</Value>
        </Field>

        <Field>
          <Label>Bucket size</Label>
          <Value>{formatBytes(bucketStorageSize)}</Value>
        </Field>

        <Field>
          <Label w={'fit-content'}>Total quota</Label>
          <Value>
            {formattedQuota.totalText}&nbsp;
            <Text as="span" color="#76808F">
              ({formattedQuota.remainText} remains)
            </Text>
          </Value>
        </Field>
        {!isPayQuota && (
          <Flex fontSize={12} mb={10} justifyContent={'space-between'}>
            <Text color={'scene.danger.active'} mr={12}>
              No enough download quota to change primary storage provider.
            </Text>
            <Text
              color="#00BA34"
              _hover={{ color: '#2EC659' }}
              cursor="pointer"
              onClick={onManageQuota}
            >
              manage quota
            </Text>
          </Flex>
        )}

        <Divider mb={24} />
        <FormControl>
          <FormLabel fontSize={14} fontWeight={500} mb={8}>
            Primary Storage Provider
          </FormLabel>
          <SPSelector onChange={onSpChange} selectedSp={primarySp.operatorAddress} />
        </FormControl>
      </QDrawerBody>
      <QDrawerFooter flexDirection={'column'}>
        <MigrateBucketFees
          gasFee={gasFee}
          settlementFee={settlementFee}
          paymentAddress={bucket.PaymentAddress}
        />
        <InsufficientBalances loginAccount={loginAccount} accounts={insufficientBalanceAccounts} />
        <DCButton size={'lg'} variant="brand" disabled={!valid} onClick={onChangeConfirm}>
          Confirm
        </DCButton>
      </QDrawerFooter>
    </>
  );
});
