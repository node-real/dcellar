import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { Animates } from '@/components/AnimatePng';
import { BalanceOn } from '@/components/Fee/BalanceOn';
import { InsufficientBalance } from '@/components/Fee/InsufficientBalance';
import { IconFont } from '@/components/IconFont';
import { CopyText } from '@/components/common/CopyText';
import { DCButton } from '@/components/common/DCButton';
import { OWNER_ACCOUNT_NAME } from '@/constants/wallet';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { UpdateBucketInfoPayload, updateBucketInfo } from '@/facade/bucket';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import {
  useChangePaymentAccountFee,
  useValidateChangePaymentFee,
} from '@/hooks/useChangePaymentAccountFee';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { TAccount, selectAccount, selectPaymentAccounts } from '@/store/slices/accounts';
import { TBucket, setBucketPaymentAccount } from '@/store/slices/bucket';
import { TStatusDetail, setStatusDetail } from '@/store/slices/object';
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
import { find } from 'lodash-es';
import { memo, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { PaymentAccountSelector } from '../components/PaymentAccountSelector';
import { ChangePaymentTotalFee } from './ChangePaymentTotalFees';

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
  const ownerAccount = useAppSelector((root) => root.accounts.ownerAccount);

  const paymentAccountList = useAppSelector(selectPaymentAccounts(loginAccount));
  const [newPaymentAccount, setNewPaymentAccount] = useState<TAccount>({} as TAccount);
  const newAccountDetail = useAppSelector(selectAccount(newPaymentAccount.address));
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const {
    loading: loadingFee,
    gasFee,
    storeFee,
    fromSettlementFee,
    toSettlementFee,
  } = useChangePaymentAccountFee({
    from: bucket.PaymentAddress,
    to: newPaymentAccount.address,
    // @ts-expect-error TODO
    storageSize: bucket.StorageSize,
  });

  const { validFrom, validTo } = useValidateChangePaymentFee({
    from: bucket.PaymentAddress,
    to: newPaymentAccount.address,
    storeFee,
    gasFee,
    fromSettlementFee,
    toSettlementFee,
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
    const pa = find(paymentAccountList, (a) => a.address === address);
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
  }, [ownerAccount, paymentAccountList, bucket]);

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

  const onChangeConfirm = async () => {
    if (loading) return;
    setLoading(true);
    dispatch(
      setStatusDetail({
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
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Payment account updated!' });
    onClose();
    dispatch(
      setBucketPaymentAccount({
        bucketName: bucket.BucketName,
        paymentAddress: newPaymentAccount.address,
      }),
    );
    dispatch(
      setBucketPaymentAccount({
        bucketName: bucket.BucketName,
        paymentAddress: newPaymentAccount.address,
      }),
    );
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
        <PaymentAccountSelector onChange={(account: TAccount) => setNewPaymentAccount(account)} />
        <BalanceOn amount={newAccountBalance} />
      </QDrawerBody>
      <QDrawerFooter flexDirection={'column'}>
        <ChangePaymentTotalFee
          gasFee={gasFee}
          storeFee={storeFee}
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