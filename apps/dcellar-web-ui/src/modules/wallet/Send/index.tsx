import React, { useCallback, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { useForm } from 'react-hook-form';
import { isEmpty } from 'lodash-es';
import { ethers } from 'ethers';
import { Box, Divider, useDisclosure } from '@totejs/uikit';

import Amount from '../components/Amount';
import { Head } from '../components/Head';
import { Address } from '../components/Address';
import Container from '../components/Container';
import { WalletButton } from '../components/WalletButton';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { useLogin } from '@/hooks/useLogin';
import { StatusModal } from '../components/StatusModal';
import { useSendFee } from '../hooks';
import { Fee } from '../components/Fee';
import { TWalletFromValues } from '../type';
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';
import { client } from '@/base/client';
import { signTypedDataV4 } from '@/utils/signDataV4';

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
      const transferTx = await client.account.transfer({
        fromAddress: address,
        toAddress: data.address,
        amount: [
          {
            denom: 'BNB',
            amount: ethers.utils.parseEther(data.amount).toString(),
          },
        ],
      });
      const simulateInfo = await transferTx.simulate({
        denom: 'BNB',
      });
      const toutTxRes = await transferTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo.gasLimit),
        gasPrice: simulateInfo.gasPrice,
        payer: address,
        granter: '',
        signTypedDataCallback: async (addr: string, message: string) => {
          const provider = await connector?.getProvider();
          return await signTypedDataV4(provider, addr, message);
        },
      });

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
