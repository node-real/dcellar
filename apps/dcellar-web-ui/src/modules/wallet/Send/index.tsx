import styled from '@emotion/styled';
import {
  Box,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Loading,
  toast,
  useDisclosure,
} from '@node-real/uikit';
import { useMount, useTimeout } from 'ahooks';
import { isAddress } from 'ethers/lib/utils.js';
import { debounce, isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';

import Amount from '../components/Amount';
import Container from '../components/Container';
import { Fee } from '../components/Fee';
import { FromAccountSelector } from '../components/FromAccountSelector';
import { Head } from '../components/Head';
import { StatusModal } from '../components/StatusModal';
import { ToAccountSelector } from '../components/ToAccountSelector';
import { WalletButton } from '../components/WalletButton';
import { useSendFee } from '../hooks';
import { TWalletFromValues } from '../type';

import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { Loading as PageLoading } from '@/components/common/Loading';
import { Tips } from '@/components/common/Tips';
import { InternalRoutePaths } from '@/constants/paths';
import {
  depositToPaymentAccount,
  sendToOwnerAccount,
  withdrawFromPaymentAccount,
} from '@/facade/account';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  TAccount,
  selectPaymentAccounts,
  setAccountType,
  setupAccountInfo,
  setupAccountType,
  setupOwnerAccount,
  setupPaymentAccounts,
} from '@/store/slices/accounts';
import { selectBnbPrice } from '@/store/slices/global';
import { setTransferFromAccount, setTransferToAccount } from '@/store/slices/wallet';
import { renderFee } from '@/utils/common';
import { removeTrailingSlash } from '@/utils/string';

export type TxType =
  | 'withdraw_from_payment_account'
  | 'send_to_owner_account'
  | 'send_to_payment_account';

interface SendProps {}

export const Send = memo<SendProps>(function Send() {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const accountInfoLoading = useAppSelector((root) => root.accounts.accountInfoLoading);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const accountTypeRecords = useAppSelector((root) => root.accounts.accountTypeRecords);
  const accountRecords = useAppSelector((root) => root.accounts.accountRecords);
  const ownerAccount = useAppSelector((root) => root.accounts.ownerAccount);
  const paymentAccountsLoading = useAppSelector((root) => root.accounts.paymentAccountsLoading);
  const paymentAccountListRecords = useAppSelector(
    (root) => root.accounts.paymentAccountListRecords,
  );
  const transferFromAccount = useAppSelector((root) => root.wallet.transferFromAccount);
  const transferToAccount = useAppSelector((root) => root.wallet.transferToAccount);
  const transferFromAddress = useAppSelector((root) => root.wallet.transferFromAddress);
  const transferToAddress = useAppSelector((root) => root.wallet.transferToAddress);

  const exchangeRate = useAppSelector(selectBnbPrice);
  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));
  const initFormRef = useRef(false);
  const router = useRouter();
  const { connector } = useAccount();
  const [timeout, setTimeout] = useState(false);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [status, setStatus] = useState<any>('success');
  const [errorMsg, setErrorMsg] = useState<any>('Oops, something went wrong');
  const [viewTxUrl, setViewTxUrl] = useState('');
  const [loadingToAccount, setLoadingToAccount] = useState(false);
  const { feeData, isLoading } = useSendFee();
  const [toJsErrors, setToJsErrors] = useState<string[]>([]);
  const { loading: isLoadingSettlementFee, settlementFee } = useSettlementFee(
    transferFromAccount.address,
  );

  const paymentAccountsInitialize = loginAccount in paymentAccountListRecords;
  const isDisableToAccount =
    !isEmpty(transferFromAccount) && transferFromAccount.address !== loginAccount;

  const balance = useMemo(() => {
    if (isEmpty(transferFromAccount)) return '';
    if (transferFromAccount.name.toLowerCase().includes('owner account')) {
      return bankBalance;
    }
    return accountRecords[transferFromAccount?.address]?.staticBalance || '';
  }, [accountRecords, bankBalance, transferFromAccount]);

  const toBalance = useMemo(() => {
    if (isEmpty(transferToAccount)) return '';
    if (transferToAccount.name.toLowerCase().includes('owner account')) {
      return bankBalance;
    }
    return accountRecords[transferToAccount?.address]?.staticBalance || '';
  }, [accountRecords, bankBalance, transferToAccount]);

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    getValues,
    watch,
    reset,
    setValue,
  } = useForm<TWalletFromValues>({
    mode: 'all',
  });

  const inputAmount = getValues('amount');

  const isShowFee = useCallback(() => {
    return isEmpty(errors) && !isEmpty(inputAmount);
  }, [errors, inputAmount]);

  const onModalClose = () => {
    reset();
    onClose();
  };

  const txType = useMemo(() => {
    if (isEmpty(transferToAccount) || isEmpty(transferFromAccount)) return;
    if (
      transferFromAccount.name.toLowerCase() === 'owner account' &&
      ['payment_account', 'non_refundable_payment_account'].includes(
        accountTypeRecords[transferToAccount.address],
      )
    ) {
      return 'send_to_payment_account';
    }
    if (transferFromAccount.name.toLowerCase().includes('payment account')) {
      return 'withdraw_from_payment_account';
    }
    if (
      transferFromAccount.name.toLowerCase() === 'owner account' &&
      ['gnfd_account', 'unknown_account'].includes(accountTypeRecords[transferToAccount.address])
    ) {
      return 'send_to_owner_account';
    }
  }, [accountTypeRecords, transferFromAccount, transferToAccount]);

  const txCallback = ({
    res,
    error,
    freshAddress = [],
  }: {
    res: any;
    error: string | null;
    freshAddress?: string[];
  }) => {
    if (!res || error) {
      setStatus('failed');
      setErrorMsg(error);
      !isOpen && onOpen();
      return;
    }
    const txUrl = `${removeTrailingSlash(GREENFIELD_CHAIN_EXPLORER_URL)}/tx/0x${
      res?.transactionHash
    }`;
    setViewTxUrl(txUrl);
    if (!isEmpty(freshAddress)) {
      freshAddress.forEach((address) => {
        dispatch(setupAccountInfo(address));
      });
    }
    setStatus('success');
    reset();
    !isOpen && onOpen();
  };

  const onSubmit = async (data: any) => {
    setStatus('pending');
    // Another validate before submit.
    if (
      txType !== 'withdraw_from_payment_account' &&
      (isEmpty(transferToAccount) || !transferToAccount.address)
    ) {
      return setToJsErrors(['Address is required.']);
    }
    if (!connector) return;
    if (
      txType !== 'withdraw_from_payment_account' &&
      transferFromAccount.address === transferToAccount.address
    ) {
      return toast.error({
        description: 'Sender and recipient cannot be the same.',
        isClosable: true,
      });
    }
    switch (txType) {
      case 'send_to_payment_account': {
        onOpen();
        const [pRes, pError] = await depositToPaymentAccount(
          {
            fromAddress: transferFromAccount.address,
            toAddress: transferToAccount.address,
            amount: data.amount,
          },
          connector,
        );
        txCallback({ res: pRes, error: pError, freshAddress: [transferToAccount.address] });
        break;
      }
      case 'withdraw_from_payment_account': {
        onOpen();
        const [wRes, wError] = await withdrawFromPaymentAccount(
          {
            creator: loginAccount,
            fromAddress: transferFromAccount.address,
            amount: data.amount,
          },
          connector,
        );
        txCallback({ res: wRes, error: wError, freshAddress: [transferFromAccount.address] });
        break;
      }
      case 'send_to_owner_account': {
        onOpen();
        const [sRes, sError] = await sendToOwnerAccount(
          {
            fromAddress: transferFromAccount.address,
            toAddress: transferToAccount.address,
            amount: data.amount,
          },
          connector,
        );
        txCallback({ res: sRes, error: sError });
        break;
      }
      default:
        break;
    }
  };

  const onChangeFromAccount = async (account: TAccount) => {
    if (!isAddress(account.address)) return;
    const accountType = accountTypeRecords[account.address];
    const accountDetail = accountRecords[account.address];
    // optimize performance
    if (accountType && accountDetail && accountDetail.netflowRate !== undefined) {
      // Avoid from owner account to owner account
      if (account.address === loginAccount && transferToAccount.address === loginAccount) {
        dispatch(setTransferToAccount(paymentAccounts[0]));
      }
      return dispatch(setTransferFromAccount(account));
    }

    dispatch(setTransferFromAccount(account));
    await dispatch(setupAccountInfo(account.address));
  };

  const onChangeToAccount = useCallback(
    debounce(async (account: TAccount) => {
      setToJsErrors([]);
      if (!!account.address && !isAddress(account.address)) {
        dispatch(setAccountType({ addr: account.address, type: 'error_account' }));
        return setToJsErrors(['Invalid address']);
      }
      const accountType = accountTypeRecords[account.address];
      const accountDetail = accountRecords[account.address];
      if (accountType && accountDetail && accountDetail.netflowRate !== undefined) {
        return dispatch(setTransferToAccount(account));
      }
      setLoadingToAccount(true);
      dispatch(setTransferToAccount(account));
      await dispatch(setupAccountInfo(account.address));
      await dispatch(setupAccountType(account.address));
      setLoadingToAccount(false);
    }, 500),
    [],
  );

  const fromErrors = useMemo(() => {
    const errors: string[] = [];
    if (accountInfoLoading || isEmpty(transferFromAccount)) return errors;
    const fromAccountDetail = accountRecords[transferFromAccount?.address];
    if (isEmpty(fromAccountDetail)) return errors;
    const isPaymentAccount = fromAccountDetail.name.toLocaleLowerCase().includes('payment account');
    if (!isPaymentAccount) {
      return errors;
    }
    if (fromAccountDetail?.clientFrozen) {
      errors.push('This account is frozen due to insufficient balance.');
    }
    if (fromAccountDetail.refundable === false) {
      errors.push('This account is non-refundable.');
    }
    return errors;
  }, [accountRecords, transferFromAccount, accountInfoLoading]);

  const toErrors = useMemo(() => {
    const errors: string[] = toJsErrors;
    if (accountInfoLoading || isEmpty(transferToAccount)) return errors;

    return errors;
  }, [accountInfoLoading, transferToAccount, toJsErrors]);

  useMount(async () => {
    dispatch(setupOwnerAccount());
    await dispatch(setupPaymentAccounts());
  });

  useEffect(() => {
    if (paymentAccountsLoading || isEmpty(ownerAccount) || initFormRef.current) return;
    if (!paymentAccountsInitialize) return;
    if (isEmpty(paymentAccounts)) {
      initFormRef.current = true;
      return;
    }
    const allList = [...(paymentAccounts || []), ownerAccount];
    const initialFromAccount =
      transferFromAddress && allList.find((item) => item.address === transferFromAddress);
    initialFromAccount && dispatch(setTransferFromAccount(initialFromAccount));
    const initialToAccount =
      transferToAddress && allList.find((item) => item.address === transferToAddress);
    dispatch(setTransferToAccount(initialToAccount || paymentAccounts[0]));
    initFormRef.current = true;
  }, [
    paymentAccounts,
    paymentAccountsInitialize,
    dispatch,
    transferFromAddress,
    ownerAccount,
    transferToAddress,
    paymentAccountsLoading,
  ]);

  useEffect(() => {
    if (!isDisableToAccount || isEmpty(ownerAccount) || !initFormRef.current) return;
    isDisableToAccount && dispatch(setTransferToAccount(ownerAccount));
  }, [dispatch, isDisableToAccount, ownerAccount]);

  // force remove loading
  useTimeout(() => {
    setTimeout(true);
  }, 3000);

  if (!initFormRef.current && !timeout)
    return (
      <Flex justifyContent="center" my={50}>
        <PageLoading />
      </Flex>
    );

  return (
    <Container>
      <Head />
      <FormContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl className="form-select" isInvalid={!isEmpty(fromErrors)}>
            <FormLabel
              marginBottom={'8px'}
              fontWeight={500}
              fontSize="14px"
              htmlFor="text"
              display={'inline-block'}
            >
              From
            </FormLabel>
            <FromAccountSelector
              from={transferFromAddress}
              onChange={(e) => onChangeFromAccount(e)}
            />
            <FormErrorMessage textAlign={'left'}>
              {fromErrors && fromErrors.map((error, index) => <Box key={index}>{error}</Box>)}
            </FormErrorMessage>
            <FormHelperText
              mt={8}
              display={'flex'}
              alignItems={'center'}
              justifyContent={'flex-end'}
              textAlign={'right'}
              color="#76808F"
            >
              Balance on Greenfield:{' '}
              {accountInfoLoading === transferFromAccount.address ? (
                <Loading size={12} marginX={4} color="readable.normal" />
              ) : (
                renderFee(balance, exchangeRate + '')
              )}
            </FormHelperText>
          </FormControl>
          <FormControl className="form-select" isInvalid={!isEmpty(toErrors)} mt={8} mb={24}>
            <FormLabel
              marginBottom={'8px'}
              fontWeight={500}
              fontSize="14px"
              htmlFor="text"
              display={'flex'}
            >
              To
              <Tips
                tips={
                  'Only send to BNB Greenfield addresses. Sending to other network addresses may result in permanent loss.'
                }
              />
            </FormLabel>
            <ToAccountSelector
              value={transferToAddress}
              isError={!isEmpty(toJsErrors)}
              disabled={isDisableToAccount}
              loading={loadingToAccount}
              onChange={(e) => onChangeToAccount(e)}
            />
            {!['gnfd_account', 'unknown_account', 'error_account'].includes(
              accountTypeRecords[transferToAccount.address],
            ) && (
              <FormHelperText
                display={'flex'}
                alignItems={'center'}
                justifyContent={'flex-end'}
                textAlign={'right'}
                color="#76808F"
                mt={8}
              >
                Balance on Greenfield:{' '}
                {loadingToAccount ? (
                  <Loading size={12} marginX={4} color="readable.normal" />
                ) : (
                  renderFee(toBalance, exchangeRate + '')
                )}
              </FormHelperText>
            )}
            <FormErrorMessage textAlign={'left'}>
              {toErrors && toErrors.map((error, index) => <Box key={index}>{error}</Box>)}
            </FormErrorMessage>
          </FormControl>
          <Amount
            balance={balance}
            errors={errors}
            txType={txType === 'withdraw_from_payment_account' ? txType : undefined}
            register={register}
            disabled={isSubmitting}
            watch={watch}
            bankBalance={bankBalance}
            feeData={feeData}
            setValue={setValue}
            settlementFee={settlementFee}
            maxDisabled={isLoading}
          />
          {isShowFee() ? (
            <>
              <Divider margin={'24px 0'} />
              <Fee
                isGasLoading={isLoading || isLoadingSettlementFee}
                feeData={feeData}
                showSettlement={txType === 'withdraw_from_payment_account'}
                settlementFee={settlementFee}
                amount={inputAmount}
                bankBalance={bankBalance}
                staticBalance={balance}
              />
            </>
          ) : (
            <Box height={'32px'} w="100%"></Box>
          )}
          <WalletButton
            isGasLoading={false}
            disabled={
              !isEmpty(errors) ||
              !isEmpty(fromErrors) ||
              (txType !== 'withdraw_from_payment_account' && !isEmpty(toErrors)) ||
              isSubmitting ||
              isLoading ||
              (!!accountInfoLoading && router.pathname !== InternalRoutePaths.wallet)
            }
            isSubmitting={isSubmitting}
            gaClickSwitchName="dc.wallet.send.switch_network.click"
            gaClickSubmitName="dc.wallet.send.transferout_btn.click"
          />
        </form>
        <StatusModal
          viewTxUrl={viewTxUrl}
          isOpen={isOpen}
          onClose={onModalClose}
          status={status}
          errorMsg={errorMsg}
        />
      </FormContent>
    </Container>
  );
});

const FormContent = styled.div`
  .form-select .ui-input {
    height: 44px;
    font-size: 14px;
  }
`;
