import React, { useCallback, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { useForm } from 'react-hook-form';
import { isEmpty } from 'lodash-es';
import {
  getAccount,
  TransferTx,
  TransferOutTx,
  ZERO_PUBKEY,
  recoverPk,
  makeCosmsPubKey,
} from '@bnb-chain/gnfd-js-sdk';
import { ethers } from 'ethers';
import { Box, Divider, useDisclosure } from '@totejs/uikit';

import Amount from '../components/Amount';
import { Head } from '../components/Head';
import { Address } from '../components/Address';
import Container from '../components/Container';
import { WalletButton } from '../components/WalletButton';
import { GREENFIELD_CHAIN_EXPLORER_URL, GRPC_URL } from '@/base/env';
import { useLogin } from '@/hooks/useLogin';
import { StatusModal } from '../components/StatusModal';
import { useSendFee } from '../hooks';
import { Fee } from '../components/Fee';
import { TWalletFromValues } from '../type';
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';

export const Send = () => {
  const { chain } = useNetwork();
  const {
    loginState: { address },
  } = useLogin();
  const { connector } = useAccount();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [status, setStatus] = useState<any>('success');
  const [viewTxUrl, setViewTxUrl] = useState('');
  const { feeData, isLoading } = useSendFee();
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

  const onSubmit = async (data: any) => {
    setStatus('pending');
    try {
      onOpen();
      const tTx = new TransferTx(GRPC_URL, String(chain?.id)!);
      const toutTx = new TransferOutTx(GRPC_URL, String(chain?.id)!);
      const provider = await connector?.getProvider();
      const account = await getAccount(GRPC_URL, address);
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
      const gasLimit = simulateTxInfo.gasInfo?.gasUsed.toNumber() as number;
      const gasPrice = simulateTxInfo.gasInfo?.minGasPrice.replaceAll('BNB', '') || '0';
      const transferSignInfo = await tTx.signTx(
        {
          from: address,
          to: data.address,
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
        signature: transferSignInfo.signature,
        messageHash: transferSignInfo.messageHash,
      });
      const pubKey = makeCosmsPubKey(pk);

      const rawTxInfo = await tTx.getRawTxInfo({
        sign: transferSignInfo.signature,
        pubKey,
        sequence: String(sequence),
        from: address,
        to: data.address,
        gasLimit,
        gasPrice,
        amount: ethers.utils.parseEther(data.amount).toString(),
        denom: 'BNB',
      });

      const toutTxRes = await tTx.broadcastTx(rawTxInfo.bytes);
      if (toutTxRes.code !== 0) {
        throw toutTxRes;
      }
      const txUrl = `${removeTrailingSlash(GREENFIELD_CHAIN_EXPLORER_URL)}/tx/0x${
        toutTxRes.transactionHash
      }`;
      setViewTxUrl(txUrl);
      setStatus('success');
      reset();
      !isOpen && onOpen();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('send error', e);
      setStatus('failed');
      !isOpen && onOpen();
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

  return (
    <Container>
      <Head />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Address
          disabled={isSubmitting}
          errors={errors}
          register={register}
          getValues={getValues}
          gaShowTipsName="dc.wallet.send.add_tooltip.show"
        />
        <Amount
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
          disabled={!isEmpty(errors) || isSubmitting || isLoading}
          isSubmitting={isSubmitting}
          gaClickSwitchName="dc.wallet.send.switch_network.click"
          gaClickSubmitName="dc.wallet.send.transferout_btn.click"
        />
      </form>
      <StatusModal viewTxUrl={viewTxUrl} isOpen={isOpen} onClose={onModalClose} status={status} />
    </Container>
  );
};
