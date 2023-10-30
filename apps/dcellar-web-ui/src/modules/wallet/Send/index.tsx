import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { debounce, isEmpty } from 'lodash-es';
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
} from '@totejs/uikit';

import Amount from '../components/Amount';
import { Head } from '../components/Head';
import Container from '../components/Container';
import { WalletButton } from '../components/WalletButton';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { StatusModal } from '../components/StatusModal';
import { useSendFee } from '../hooks';
import { Fee } from '../components/Fee';
import { TWalletFromValues } from '../type';
import { useAppDispatch, useAppSelector } from '@/store';
import { FromAccountSelector } from '../components/FromAccountSelector';
import {
  TAccount,
  selectPaymentAccounts,
  setAccountType,
  setupAccountInfo,
  setupAccountType,
  setupOwnerAccount,
  setupPaymentAccounts,
} from '@/store/slices/accounts';
import { ToAccountSelector } from '../components/ToAccountSelector';
import {
  depositToPaymentAccount,
  sendToOwnerAccount,
  withdrawFromPaymentAccount,
} from '@/facade/account';
import { isAddress } from 'ethers/lib/utils.js';
import { Tips } from '@/components/common/Tips';
import { setFromAccount, setToAccount } from '@/store/slices/wallet';
import { renderFee } from '@/utils/common';
import { selectBnbPrice } from '@/store/slices/global';
import { useRouter } from 'next/router';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { removeTrailingSlash } from '@/utils/string';
import { InternalRoutePaths } from '@/utils/constant';
import styled from '@emotion/styled';
import { Loading as PageLoading } from '@/components/common/Loading';
import { useMount, useTimeout } from 'ahooks';

export type TxType =
  | 'withdraw_from_payment_account'
  | 'send_to_owner_account'
  | 'send_to_payment_account';

interface SendProps {}

export const Send = memo<SendProps>(function Send() {
  const dispatch = useAppDispatch();
  const initFormRef = useRef(false);
  const exchangeRate = useAppSelector(selectBnbPrice);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const [timeout, setTimeout] = useState(false);
  const {
    isLoadingAccountInfo,
    bankBalance,
    accountTypes,
    accountInfo,
    ownerAccount,
    isLoadingPaymentAccounts,
  } = useAppSelector((root) => root.accounts);
  const router = useRouter();
  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));
  const { fromAccount, toAccount, from, to } = useAppSelector((root) => root.wallet);
  const { connector } = useAccount();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [status, setStatus] = useState<any>('success');
  const [errorMsg, setErrorMsg] = useState<any>('Oops, something went wrong');
  const [viewTxUrl, setViewTxUrl] = useState('');
  const [loadingToAccount, setLoadingToAccount] = useState(false);
  const { feeData, isLoading } = useSendFee();
  const [toJsErrors, setToJsErrors] = useState<string[]>([]);
  const { loading: isLoadingSettlementFee, settlementFee } = useSettlementFee(fromAccount.address);
  const balance = useMemo(() => {
    if (isEmpty(fromAccount)) return '';
    if (fromAccount.name.toLowerCase().includes('owner account')) {
      return bankBalance;
    }
    return accountInfo[fromAccount?.address]?.staticBalance || '';
  }, [accountInfo, bankBalance, fromAccount]);
  const toBalance = useMemo(() => {
    if (isEmpty(toAccount)) return '';
    if (toAccount.name.toLowerCase().includes('owner account')) {
      return bankBalance;
    }
    return accountInfo[toAccount?.address]?.staticBalance || '';
  }, [accountInfo, bankBalance, toAccount]);
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
  useMount(async () => {
    dispatch(setupOwnerAccount());
    const error = await dispatch(setupPaymentAccounts());
    if (error) {
      toast.error({
        description: error,
      })
    }
  });
  useEffect(() => {
    if (isLoadingPaymentAccounts || isEmpty(ownerAccount) || initFormRef.current) return;
    if (isEmpty(paymentAccounts)) {
      initFormRef.current = true;
      return;
    }
    const allList = [...(paymentAccounts || []), ownerAccount];
    const initialFromAccount = from && allList.find((item) => item.address === from);
    initialFromAccount && dispatch(setFromAccount(initialFromAccount));
    const initialToAccount = to && allList.find((item) => item.address === to);
    dispatch(setToAccount(initialToAccount || paymentAccounts[0]));
    initFormRef.current = true;
  }, [paymentAccounts, dispatch, from, ownerAccount, to, isLoadingPaymentAccounts]);

  const isDisableToAccount = !isEmpty(fromAccount) && fromAccount.address !== loginAccount;
  useEffect(() => {
    if (!isDisableToAccount || isEmpty(ownerAccount) || !initFormRef.current) return;
    isDisableToAccount && dispatch(setToAccount(ownerAccount));
  }, [dispatch, isDisableToAccount, ownerAccount]);

  const onModalClose = () => {
    reset();
    onClose();
  };
  const inputAmount = getValues('amount');
  const isShowFee = useCallback(() => {
    return isEmpty(errors) && !isEmpty(inputAmount);
  }, [errors, inputAmount]);

  const txType = useMemo(() => {
    if (isEmpty(toAccount) || isEmpty(fromAccount)) return;
    if (
      fromAccount.name.toLowerCase() === 'owner account' &&
      ['payment_account', 'non_refundable_payment_account'].includes(
        accountTypes[toAccount.address],
      )
    ) {
      return 'send_to_payment_account';
    }
    if (fromAccount.name.toLowerCase().includes('payment account')) {
      return 'withdraw_from_payment_account';
    }
    if (
      fromAccount.name.toLowerCase() === 'owner account' &&
      ['gnfd_account', 'unknown_account'].includes(accountTypes[toAccount.address])
    ) {
      return 'send_to_owner_account';
    }
  }, [accountTypes, fromAccount, toAccount]);
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
    if (txType !== 'withdraw_from_payment_account' && (isEmpty(toAccount) || !toAccount.address)) {
      return setToJsErrors(['Address is required.']);
    }
    if (!connector) return;
    if (txType !== 'withdraw_from_payment_account' && fromAccount.address === toAccount.address) {
      return toast.error({
        description: 'Sender and recipient cannot be the same.',
        isClosable: true,
      });
    }
    switch (txType) {
      case 'send_to_payment_account':
        onOpen();
        const [pRes, pError] = await depositToPaymentAccount(
          {
            fromAddress: fromAccount.address,
            toAddress: toAccount.address,
            amount: data.amount,
          },
          connector,
        );
        txCallback({ res: pRes, error: pError, freshAddress: [toAccount.address] });
        break;
      case 'withdraw_from_payment_account':
        onOpen();
        const [wRes, wError] = await withdrawFromPaymentAccount(
          {
            creator: loginAccount,
            fromAddress: fromAccount.address,
            amount: data.amount,
          },
          connector,
        );
        txCallback({ res: wRes, error: wError, freshAddress: [fromAccount.address] });
        break;
      case 'send_to_owner_account':
        onOpen();
        const [sRes, sError] = await sendToOwnerAccount(
          {
            fromAddress: fromAccount.address,
            toAddress: toAccount.address,
            amount: data.amount,
          },
          connector,
        );
        txCallback({ res: sRes, error: sError });
      default:
        break;
    }
  };

  const onChangeFromAccount = async (account: TAccount) => {
    if (!isAddress(account.address)) return;
    const accountType = accountTypes[account.address];
    const accountDetail = accountInfo[account.address];
    // optimize performance
    if (accountType && accountDetail && accountDetail.netflowRate !== undefined) {
      // Avoid from owner account to owner account
      if (account.address === loginAccount && toAccount.address === loginAccount) {
        dispatch(setToAccount(paymentAccounts[0]));
      }
      return dispatch(setFromAccount(account));
    }

    dispatch(setFromAccount(account));
    await dispatch(setupAccountInfo(account.address));
  };

  const onChangeToAccount = useCallback(
    debounce(async (account: TAccount) => {
      setToJsErrors([]);
      if (!!account.address && !isAddress(account.address)) {
        dispatch(setAccountType({ addr: account.address, type: 'error_account' }));
        return setToJsErrors(['Invalid address']);
      }
      const accountType = accountTypes[account.address];
      const accountDetail = accountInfo[account.address];
      if (accountType && accountDetail && accountDetail.netflowRate !== undefined) {
        return dispatch(setToAccount(account));
      }
      setLoadingToAccount(true);
      dispatch(setToAccount(account));
      await dispatch(setupAccountInfo(account.address));
      await dispatch(setupAccountType(account.address));
      setLoadingToAccount(false);
    }, 500),
    [],
  );

  const fromErrors = useMemo(() => {
    const errors: string[] = [];
    if (isLoadingAccountInfo || isEmpty(fromAccount)) return errors;
    const fromAccountDetail = accountInfo[fromAccount?.address];
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
  }, [accountInfo, fromAccount, isLoadingAccountInfo]);

  const toErrors = useMemo(() => {
    const errors: string[] = toJsErrors;
    if (isLoadingAccountInfo || isEmpty(toAccount)) return errors;

    return errors;
  }, [isLoadingAccountInfo, toAccount, toJsErrors]);

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
            <FromAccountSelector from={from} onChange={(e) => onChangeFromAccount(e)} />
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
              {isLoadingAccountInfo === fromAccount.address ? (
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
              value={to}
              isError={!isEmpty(toJsErrors)}
              disabled={isDisableToAccount}
              loading={loadingToAccount}
              onChange={(e) => onChangeToAccount(e)}
            />
            {!['gnfd_account', 'unknown_account', 'error_account'].includes(
              accountTypes[toAccount.address],
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
            feeData={feeData}
            setValue={setValue}
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
              (!!isLoadingAccountInfo && router.pathname !== InternalRoutePaths.wallet)
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
