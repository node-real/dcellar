import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { isEmpty } from 'lodash-es';
import {
  Box,
  Divider,
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
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';
import { useAppDispatch, useAppSelector } from '@/store';
import { POPPINS_FONT } from '../constants';
import { FromAccountSelector } from '../components/FromAccountSelector';
import { TAccount, setupAccountsInfo } from '@/store/slices/accounts';
import { ToAccountSelector } from '../components/ToAccountSelector';
import {
  depositToPaymentAccount,
  sendToOwnerAccount,
  withdrawFromPaymentAccount,
} from '@/facade/account';
import { isAddress } from 'ethers/lib/utils.js';
import { Tips } from '@/components/common/Tips';
import { setFromAccount, setToAccount } from '@/store/slices/wallet';

export const Send = () => {
  const dispatch = useAppDispatch();
  const initFormRef = useRef(false);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bankBalance, accountsInfo, isLoadingDetail, PAList, ownerAccount } = useAppSelector(
    (root) => root.accounts,
  );
  const { fromAccount, toAccount, from, to } = useAppSelector((root) => root.wallet);
  const { connector } = useAccount();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [status, setStatus] = useState<any>('success');
  const [viewTxUrl, setViewTxUrl] = useState('');
  const { feeData, isLoading } = useSendFee();
  const [toJsErrors, setToJsErrors] = useState<string[]>([]);
  const balance = useMemo(() => {
    if (isEmpty(fromAccount)) return '';
    if (fromAccount.name.toLowerCase().includes('owner account')) {
      return bankBalance;
    }
    return accountsInfo[fromAccount?.address]?.staticBalance || '';
  }, [accountsInfo, bankBalance, fromAccount]);

  useEffect(() => {
    if (isEmpty(PAList) || isEmpty(ownerAccount)) return;
    const allList = [...PAList, ownerAccount];
    const initialFromAccount = from && allList.find((item) => item.address === from);
    initialFromAccount && dispatch(setFromAccount(initialFromAccount));
    const initialToAccount = to && allList.find((item) => item.address === to);
    dispatch(setToAccount(initialToAccount || { name: 'Initial Account', address: '' }));
    initFormRef.current = true;
  }, [PAList, dispatch, from, ownerAccount, to]);

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

  const txType = useMemo(() => {
    if (isEmpty(toAccount) || isEmpty(fromAccount)) return;
    if (
      fromAccount.name.toLowerCase() === 'owner account' &&
      toAccount.name.toLowerCase().includes('payment account')
    ) {
      return 'send_to_payment_account';
    }
    if (fromAccount.name.toLowerCase().includes('payment account')) {
      return 'withdraw_from_payment_account';
    }
    if (
      toAccount.name.toLowerCase() === 'owner account' &&
      !toAccount.name.toLowerCase().includes('payment account')
    ) {
      return 'send_to_owner_account';
    }
  }, [fromAccount, toAccount]);
  const txCallback = (res: any, error: string | null) => {
    if (!res || error) {
      setStatus('failed');
      !isOpen && onOpen();
    }
    const txUrl = `${removeTrailingSlash(GREENFIELD_CHAIN_EXPLORER_URL)}/tx/0x${
      res?.transactionHash
    }`;
    setViewTxUrl(txUrl);
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
        description: 'The sender and recipient cannot be the same',
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
        txCallback(pRes, pError);
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
        txCallback(wRes, wError);
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
        txCallback(sRes, sError);
      default:
        break;
    }
  };

  const onModalClose = () => {
    reset();
    onClose();
  };
  const inputAmount = getValues('amount');
  const isShowFee = useCallback(() => {
    return isEmpty(errors) && !isEmpty(inputAmount);
  }, [errors, inputAmount]);

  const onChangeAccount = async (account: TAccount, type: 'from' | 'to') => {
    if (type === 'to') {
      !isEmpty(toJsErrors) && setToJsErrors([]);
      if (account.address !== '' && !isAddress(account.address)) {
        return setToJsErrors(['Invalid address']);
      }
    }
    if (!isAddress(account.address)) return;
    type === 'from' ? dispatch(setFromAccount(account)) : dispatch(setToAccount(account));
    dispatch(setupAccountsInfo(account.address));
  };

  const isHideToAccount = fromAccount?.name?.toLocaleLowerCase().includes('payment account');

  const fromErrors = useMemo(() => {
    const errors: string[] = [];
    if (isLoadingDetail || isEmpty(fromAccount)) return errors;
    const fromAccountInfo = accountsInfo[fromAccount?.address];
    const isPaymentAccount = fromAccountInfo.name.toLocaleLowerCase().includes('payment account');
    if (!isPaymentAccount) {
      return errors;
    }
    if (fromAccountInfo?.status === 1) {
      errors.push('This account is frozen due to insufficient balance.');
    }
    if (fromAccountInfo.refundable === false) {
      errors.push('This account is non-refundable.');
    }
    return errors;
  }, [accountsInfo, fromAccount, isLoadingDetail]);

  const toErrors = useMemo(() => {
    const errors: string[] = toJsErrors;
    if (isLoadingDetail || isEmpty(toAccount)) return errors;

    return errors;
  }, [isLoadingDetail, toAccount, toJsErrors]);

  if (!initFormRef.current) return <></>;

  return (
    <Container>
      <Head />
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isInvalid={!isEmpty(fromErrors)}>
          <FormLabel
            marginBottom={'8px'}
            fontWeight={500}
            fontSize="14px"
            lineHeight="150%"
            htmlFor="text"
            display={'inline-block'}
            fontFamily={POPPINS_FONT}
          >
            From
          </FormLabel>
          <FromAccountSelector from={from} onChange={(e) => onChangeAccount(e, 'from')} />
          <FormErrorMessage textAlign={'left'}>
            {fromErrors && fromErrors.map((error, index) => <Box key={index}>{error}</Box>)}
          </FormErrorMessage>
          <FormHelperText
            display={'flex'}
            alignItems={'center'}
            justifyContent={'flex-end'}
            textAlign={'right'}
            color="#76808F"
          >
            Balance on:{' '}
            {isLoadingDetail === fromAccount.address ? (
              <SmallLoading />
            ) : (
              balance
            )}
            {" "}BNB
          </FormHelperText>
        </FormControl>
        {!isHideToAccount && (
          <FormControl isInvalid={!isEmpty(toErrors)} marginY={24}>
            <FormLabel
              marginBottom={'8px'}
              fontWeight={500}
              fontSize="14px"
              lineHeight="150%"
              htmlFor="text"
              display={'flex'}
              fontFamily={POPPINS_FONT}
            >
              To
              <Tips
                tips={
                  'Only send to BNB Greenfield addresses. Sending to other network addresses may result in permanent loss.'
                }
              />
            </FormLabel>
            <ToAccountSelector to={to} onChange={(e) => onChangeAccount(e, 'to')} />
            <FormErrorMessage textAlign={'left'}>
              {toErrors && toErrors.map((error, index) => <Box key={index}>{error}</Box>)}
            </FormErrorMessage>
            <FormHelperText textAlign={'right'} color="#76808F">
              Balance on:{' '}
              {toAccount ? (
                toAccount.address && isLoadingDetail === toAccount.address ? (
                  <SmallLoading />
                ) : (
                  accountsInfo[toAccount.address]?.staticBalance || 0
                )
              ) : (
                0
              )}{' '}
              BNB
            </FormHelperText>
          </FormControl>
        )}
        <Amount
          balance={balance}
          errors={errors}
          register={register}
          disabled={isSubmitting}
          watch={watch}
          feeData={feeData}
          setValue={setValue}
          maxDisabled={isLoading}
        />
        {isShowFee() ? (
          <>
            <Divider margin={'12px 0'} />
            <Fee isGasLoading={isLoading} feeData={feeData} amount={inputAmount} />
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
            isLoading
          }
          isSubmitting={isSubmitting}
          gaClickSwitchName="dc.wallet.send.switch_network.click"
          gaClickSubmitName="dc.wallet.send.transferout_btn.click"
        />
      </form>
      <StatusModal viewTxUrl={viewTxUrl} isOpen={isOpen} onClose={onModalClose} status={status} />
    </Container>
  );
};

const SmallLoading = () => <Loading size={12} marginX={4} color="readable.normal" />;
