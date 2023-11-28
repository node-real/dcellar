import { Box, Divider, Flex, FormControl, useDisclosure } from '@totejs/uikit';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { isEmpty } from 'lodash-es';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';

import { ChainBox } from '../components/ChainBox';
import Amount from '../components/Amount';
import { Head } from '../components/Head';
import { SwapIcon } from '../components/SwapIcon';
import Container from '../components/Container';
import { WalletButton } from '../components/WalletButton';
import { BSC_CHAIN_ID, GREENFIELD_CHAIN_ID, GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { StatusModal } from '../components/StatusModal';
import { useTransferOutFee } from '../hooks';
import { Fee } from '../components/Fee';
import { TTransferOutFromValues } from '../type';
import { GAClick } from '@/components/common/GATracker';
import { useAppSelector } from '@/store';
import { useChainsBalance } from '@/context/GlobalContext/WalletBalanceContext';
import { getClient } from '@/facade';
import { signTypedDataCallback } from '@/facade/wallet';
import { removeTrailingSlash } from '@/utils/string';
import { InternalRoutePaths } from '@/constants/paths';
import { broadcastFault } from '@/facade/error';
import { LargeAmountTip } from '../components/LargeAmountTip';

interface TransferOutProps {}

export const TransferOut = memo<TransferOutProps>(function TransferOut() {
  const { connector } = useAccount();
  const router = useRouter();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [status, setStatus] = useState<any>('success');
  const [errorMsg, setErrorMsg] = useState<any>('Oops, something went wrong');
  const [viewTxUrl, setViewTxUrl] = useState('');
  const { feeData, isLoading } = useTransferOutFee();
  const { all } = useChainsBalance();
  const balance = useMemo(() => {
    return all.find((item) => item.chainId === GREENFIELD_CHAIN_ID)?.availableBalance || '';
  }, [all]);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    getValues,
    watch,
    reset,
    setValue,
  } = useForm<TTransferOutFromValues>({
    mode: 'all',
  });

  const { loginAccount: address } = useAppSelector((root) => root.persist);

  const onSubmit = async (data: any) => {
    setStatus('pending');
    try {
      onOpen();
      const client = await getClient();
      const transferOutTx = await client.crosschain.transferOut({
        from: address,
        to: address,
        amount: {
          denom: 'BNB',
          amount: ethers.utils.parseEther(data.amount).toString(),
        },
      });
      const simulateInfo = await transferOutTx.simulate({
        denom: 'BNB',
      });
      const toutTxRes = await transferOutTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo.gasLimit),
        gasPrice: simulateInfo.gasPrice,
        payer: address,
        granter: '',
        signTypedDataCallback: signTypedDataCallback(connector!),
      });
      const txUrl = `${removeTrailingSlash(GREENFIELD_CHAIN_EXPLORER_URL)}/tx/0x${
        toutTxRes.transactionHash
      }`;
      setViewTxUrl(txUrl);
      reset();
      setStatus('success');
      !isOpen && onOpen();
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('transfer out error', e);
      setStatus('failed');
      setErrorMsg(broadcastFault(e)[1]);
      !isOpen && onOpen();
    }
  };
  const onModalClose = () => {
    reset();
    onClose();
  };
  const onChangeTransfer = useCallback(() => {
    router.replace(InternalRoutePaths.transfer_in);
  }, [router]);
  const inputAmount = getValues('amount');
  const isShowFee = useCallback(() => {
    return isEmpty(errors) && !isEmpty(inputAmount);
  }, [errors, inputAmount]);

  return (
    <Container>
      <Head />
      <Flex mb={'24px'} justifyContent={'space-between'} alignItems="center">
        <ChainBox type="from" chainId={GREENFIELD_CHAIN_ID} />
        <GAClick name="dc.wallet.transferout.exchange_btn.click">
          <SwapIcon onClick={onChangeTransfer} />
        </GAClick>
        <ChainBox type="to" chainId={BSC_CHAIN_ID} />
      </Flex>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isInvalid={!isEmpty(errors)}>
          <Amount
            balance={balance}
            watch={watch}
            errors={errors}
            register={register}
            disabled={isSubmitting}
            feeData={feeData}
            setValue={setValue}
            maxDisabled={isLoading}
          />
        </FormControl>
        {isShowFee() ? (
          <>
            <Divider margin={'24px 0'} />
            <Fee
              isGasLoading={isLoading}
              feeData={feeData}
              amount={inputAmount}
              gaShowTipsName="dc.wallet.transferout.fee_pop.show"
            />
          </>
        ) : (
          <Box height={'32px'} w="100%"></Box>
        )}
        <WalletButton
          isGasLoading={false}
          disabled={!isEmpty(errors) || isSubmitting || isLoading}
          isSubmitting={isSubmitting}
          gaClickSubmitName="dc.wallet.transferout.transferout_btn.click"
          gaClickSwitchName="dc.wallet.transferout.switch_network.click"
        />
        <LargeAmountTip amount={inputAmount} formError={!isEmpty(errors)} />
      </form>
      <StatusModal
        viewTxUrl={viewTxUrl}
        isOpen={isOpen}
        onClose={onModalClose}
        status={status}
        errorMsg={errorMsg}
      />
    </Container>
  );
});
