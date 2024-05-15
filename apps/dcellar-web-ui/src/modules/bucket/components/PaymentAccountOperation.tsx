import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { Animates } from '@/components/AnimatePng';
import { BalanceOn } from '@/components/Fee/BalanceOn';
import { InsufficientBalance } from '@/components/Fee/InsufficientBalance';
import { IconFont } from '@/components/IconFont';
import { CopyText } from '@/components/common/CopyText';
import { DCButton } from '@/components/common/DCButton';
import { OWNER_ACCOUNT_NAME } from '@/constants/wallet';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { updateBucketInfo, UpdateBucketInfoPayload } from '@/facade/bucket';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import {
  useChangePaymentAccountFee,
  useValidateChangePaymentFee,
} from '@/hooks/useChangePaymentAccountFee';
import {
  BUTTON_GOT_IT,
  CONTINUE_STEP,
  PAYMASTER_CONTINUE_DESC,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { AccountEntity, selectAccount } from '@/store/slices/accounts';
import { setBucketPaymentAccount, setupBucket, TBucket } from '@/store/slices/bucket';
import { BN } from '@/utils/math';
import { trimLongStr } from '@/utils/string';
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
import { memo, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { PaymentAccountSelector } from '../components/PaymentAccountSelector';
import { ChangePaymentTotalFee } from './ChangePaymentTotalFees';
import { setSignatureAction } from '@/store/slices/global';
import { useAccountType } from '@/hooks/useAccountType';

export const PaymentAccountOperation = memo(function PaymentAccountOperation({
  bucket,
  onClose,
}: {
  bucket: TBucket;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const [newPaymentAccount, setNewPaymentAccount] = useState<AccountEntity>({} as AccountEntity);
  const newAccountDetail = useAppSelector(selectAccount(newPaymentAccount.address));
  const PaymentAddress = bucket.PaymentAddress;
  const { pa, oa, isSponsor } = useAccountType(PaymentAddress);
  const { isSponsor: toSponsor } = useAccountType(newPaymentAccount.address);
  const fromSponsor = isSponsor;
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const {
    loading: loadingFee,
    gasFee,
    storeFee,
    quotaFee,
    fromSettlementFee,
    toSettlementFee,
  } = useChangePaymentAccountFee({
    from: bucket.PaymentAddress,
    to: newPaymentAccount.address,
    // @ts-expect-error TODO
    storageSize: bucket.StorageSize,
    readQuota: bucket.ChargedReadQuota,
  });

  const { validFrom, validTo } = useValidateChangePaymentFee({
    from: bucket.PaymentAddress,
    to: newPaymentAccount.address,
    storeFee,
    quotaFee,
    gasFee,
    fromSettlementFee,
    toSettlementFee,
    toSponsor,
    fromSponsor,
  });

  const InsufficientAccounts = [];
  !loadingFee && !validFrom && InsufficientAccounts.push({ address: bucket.PaymentAddress });
  !loadingFee && !validTo && InsufficientAccounts.push({ address: newPaymentAccount.address });
  const valid =
    !loading &&
    !loadingFee &&
    validFrom &&
    validTo &&
    bucket &&
    bucket?.PaymentAddress.toLowerCase() !== newPaymentAccount.address.toLowerCase();

  const newAccountBalance = useMemo(() => {
    const isOwner = newPaymentAccount.address === loginAccount;
    if (isOwner) {
      return BN(newAccountDetail.staticBalance).plus(bankBalance).toString();
    }
    return newAccountDetail.staticBalance;
  }, [bankBalance, loginAccount, newAccountDetail?.staticBalance, newPaymentAccount?.address]);

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

  const doChangePaymentAccount = async () => {
    if (loading) return;
    setLoading(true);
    dispatch(
      setSignatureAction({
        icon: Animates.object,
        title: 'Updating payment account',
        desc: WALLET_CONFIRM,
      }),
    );

    const payload: UpdateBucketInfoPayload = {
      operator: loginAccount,
      bucketName: bucket.BucketName,
      visibility: bucket.Visibility,
      paymentAddress: newPaymentAccount.address,
      chargedReadQuota: String(bucket.ChargedReadQuota),
    };
    const [txRes, txError] = await updateBucketInfo(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setSignatureAction({}));
    toast.success({ description: 'Payment account updated!' });
    onClose();
    dispatch(
      setBucketPaymentAccount({
        bucketName: bucket.BucketName,
        paymentAddress: newPaymentAccount.address,
      }),
    );
    if (toSponsor || fromSponsor) {
      dispatch(setupBucket(bucket.BucketName));
    }
  };

  const onChangeConfirm = async () => {
    if (toSponsor) {
      dispatch(
        setSignatureAction({
          icon: 'error-auth',
          title: 'Confirm Payment Account',
          desc: PAYMASTER_CONTINUE_DESC,
          buttonText: CONTINUE_STEP,
          buttonOnClick() {
            setTimeout(doChangePaymentAccount, 300);
          },
        }),
      );
    } else {
      doChangePaymentAccount();
    }
  };

  return (
    <>
      <QDrawerHeader flexDir={'column'}>
        <Flex cursor={'pointer'} alignItems={'center'} onClick={onClose} gap={8}>
          <IconFont type="back" />
          Change Payment Account
        </Flex>
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
          <Label>Payment account</Label>
          <Value>{paymentAccount}</Value>
        </Field>
        <Divider />
        <PaymentAccountSelector
          onChange={(account: AccountEntity) => setNewPaymentAccount(account)}
        />
        {!toSponsor && <BalanceOn amount={newAccountBalance} />}
      </QDrawerBody>
      <QDrawerFooter flexDirection={'column'}>
        <ChangePaymentTotalFee
          fromSponsor={fromSponsor}
          toSponsor={toSponsor}
          gasFee={gasFee}
          storeFee={storeFee}
          quotaFee={quotaFee}
          from={{ address: bucket.PaymentAddress, amount: fromSettlementFee }}
          to={{ address: newPaymentAccount.address, amount: toSettlementFee }}
        />
        <InsufficientBalance loginAccount={loginAccount} accounts={InsufficientAccounts} />
        <DCButton size={'lg'} variant="brand" disabled={!valid} onClick={onChangeConfirm}>
          Confirm
        </DCButton>
      </QDrawerFooter>
    </>
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
