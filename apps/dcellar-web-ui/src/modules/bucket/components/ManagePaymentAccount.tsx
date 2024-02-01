import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { CopyText } from '@/components/common/CopyText';
import { OWNER_ACCOUNT_NAME } from '@/constants/wallet';
import { useAppDispatch, useAppSelector } from '@/store';
import { TAccount, selectAccount, selectPaymentAccounts } from '@/store/slices/accounts';
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
} from '@totejs/uikit';
import { find } from 'lodash-es';
import { useMemo, useState } from 'react';
import { PaymentAccountSelector } from '../components/PaymentAccountSelector';
import { DCButton } from '@/components/common/DCButton';
import { TStatusDetail, setStatusDetail } from '@/store/slices/object';
import { Animates } from '@/components/AnimatePng';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { UpdateBucketInfoPayload, updateBucketInfo } from '@/facade/bucket';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { useAccount } from 'wagmi';
import { setReadBucketPaymentAccount } from '@/store/slices/bucket';
import { BN } from '@/utils/math';
import {
  useChangePaymentAccountFee,
  useValidateChangePaymentFee,
} from '@/hooks/useChangePaymentAccountFee';
import { BalanceOn } from '@/components/Fee/BalanceOn';
import { InsufficientBalance } from '@/components/Fee/InsufficientBalance';
import { ChangePaymentTotalFee } from './ChangePaymentTotalFees';

export const ManagePaymentAccount = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();
  const {
    editPaymentAccount: [bucketName],
  } = useAppSelector((root) => root.bucket);
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const { ownerAccount } = useAppSelector((root) => root.accounts);
  const bucket = bucketInfo[bucketName] || {};
  const { loginAccount } = useAppSelector((root) => root.persist);
  const PAList = useAppSelector(selectPaymentAccounts(loginAccount));
  const [newPaymentAccount, setNewPaymentAccount] = useState<TAccount>({} as TAccount);
  const [loading, setLoading] = useState(false);
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
    // @ts-ignore
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
  const newAccountDetail = useAppSelector(selectAccount(newPaymentAccount.address));
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
      setReadBucketPaymentAccount({
        bucketName: bucketName,
        paymentAddress: newPaymentAccount.address,
      }),
    );
    dispatch(
      setReadBucketPaymentAccount({
        bucketName: bucketName,
        paymentAddress: newPaymentAccount.address,
      }),
    );
  };

  const valid =
    !loading &&
    !loadingFee &&
    validFrom &&
    validTo &&
    bucket &&
    bucket?.PaymentAddress.toLowerCase() !== newPaymentAccount.address.toLowerCase();

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
          from={{
            address: bucket.PaymentAddress,
            amount: fromSettlementFee,
          }}
          to={{
            address: newPaymentAccount.address,
            amount: toSettlementFee,
          }}
        />
        <InsufficientBalance loginAccount={loginAccount} accounts={InsufficientAccounts} />
        <DCButton size={'lg'} variant="brand" disabled={!valid} onClick={onChangeConfirm}>
          Confirm
        </DCButton>
      </QDrawerFooter>
    </>
  );
};

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
