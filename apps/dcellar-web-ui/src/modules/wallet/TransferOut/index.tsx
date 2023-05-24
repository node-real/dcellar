import { Box, Divider, Flex, FormControl, useDisclosure } from '@totejs/uikit';
import React, { useCallback, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { useForm } from 'react-hook-form';
import {
  getAccount,
  TransferOutTx,
  ZERO_PUBKEY,
  recoverPk,
  makeCosmsPubKey,
} from '@bnb-chain/gnfd-js-sdk';
import { isEmpty } from 'lodash-es';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';

import { ChainBox } from '../components/ChainBox';
import Amount from '../components/Amount';
import { Head } from '../components/Head';
import { TransferIcon } from '../components/TransferIcon';
import Container from '../components/Container';
import { WalletButton } from '../components/WalletButton';
import { useLogin } from '@/hooks/useLogin';
import {
  BSC_CHAIN_ID,
  GREENFIELD_CHAIN_ID,
  GREENFIELD_CHAIN_EXPLORER_URL,
  GREENFIELD_CHAIN_RPC_URL,
} from '@/base/env';
import { StatusModal } from '../components/StatusModal';
import { useTransferOutFee } from '../hooks';
import { Fee } from '../components/Fee';
import { InternalRoutePaths } from '@/constants/links';
import { TTransferOutFromValues } from '../type';
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';
import { GAClick, GAShow } from '@/components/common/GATracker';

export const TransferOut = () => {
  const { chain } = useNetwork();
  const { connector } = useAccount();
  const router = useRouter();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [status, setStatus] = useState<any>('success');
  const [viewTxUrl, setViewTxUrl] = useState('');
  const { feeData, isLoading } = useTransferOutFee();
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

  const {
    loginState: { address },
  } = useLogin();

  const onSubmit = async (data: any) => {
    setStatus('pending');

    const toutTx = new TransferOutTx(GREENFIELD_CHAIN_RPC_URL, String(chain?.id)!);
    try {
      onOpen();
      const provider = await connector?.getProvider();
      const account = await getAccount(GREENFIELD_CHAIN_RPC_URL, address);
      const { accountNumber, sequence } = account;
      const bodyBytes = toutTx.getSimulateBytes({
        from: address,
        to: address,
        amount: ethers.utils.parseEther(data.amount).toString(),
        denom: 'BNB',
      });
      const authInfoBytes = toutTx.getAuthInfoBytes({
        // @ts-ignore
        sequence,
        denom: 'BNB',
        gasLimit: 0,
        gasPrice: '0',
        pubKey: makeCosmsPubKey(ZERO_PUBKEY),
      });
      const simulateTxInfo = await toutTx.simulateTx(bodyBytes, authInfoBytes);
      // const gasLimit = simulateTxInfo.gasInfo?.gasUsed.toNumber() as number;
      const gasLimit = simulateTxInfo.gasInfo?.gasUsed.toNumber() as number;
      const gasPrice = simulateTxInfo.gasInfo?.minGasPrice.replaceAll('BNB', '') || '0';
      const transferOutSignInfo = await toutTx.signTx(
        {
          from: address,
          to: address,
          gasLimit,
          gasPrice,
          amount: ethers.utils.parseEther(data.amount).toString(),
          sequence: sequence + '',
          accountNumber: accountNumber + '',
          denom: 'BNB',
        },
        provider,
      );

      const pk = recoverPk({
        signature: transferOutSignInfo.signature,
        messageHash: transferOutSignInfo.messageHash,
      });

      const pubKey = makeCosmsPubKey(pk);

      const transferOutInfo = {
        sign: transferOutSignInfo.signature,
        pubKey,
        sequence: String(sequence),
        from: address,
        to: address,
        gasLimit: gasLimit,
        gasPrice,
        amount: ethers.utils.parseEther(data.amount).toString(),
        denom: 'BNB',
      };
      const rawTxInfo = await toutTx.getRawTxInfo(transferOutInfo);
      const toutTxRes = await toutTx.broadcastTx(rawTxInfo.bytes);
      const txUrl = `${removeTrailingSlash(GREENFIELD_CHAIN_EXPLORER_URL)}/tx/0x${
        toutTxRes.transactionHash
      }`;
      setViewTxUrl(txUrl);
      reset();
      setStatus('success');
      !isOpen && onOpen();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('transfer out error', e);
      setStatus('failed');
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
      <Flex mb={'12px'} justifyContent={'space-between'} alignItems="center">
        <ChainBox type="from" chainId={GREENFIELD_CHAIN_ID} />
        <GAClick name="dc.wallet.transferout.exchange_btn.click">
          <TransferIcon onClick={onChangeTransfer} />
        </GAClick>
        <ChainBox type="to" chainId={BSC_CHAIN_ID} />
      </Flex>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isInvalid={!isEmpty(errors)}>
          <Amount
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
            <Divider margin={'12px 0'} />
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
      </form>
      <StatusModal viewTxUrl={viewTxUrl} isOpen={isOpen} onClose={onModalClose} status={status} />
    </Container>
  );
};
