import { Box, Divider, Flex, useDisclosure } from '@totejs/uikit';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';

import { ChainBox } from '../components/ChainBox';
import Amount from '../components/Amount';
import { Head } from '../components/Head';
import { TransferIcon } from '../components/TransferIcon';
import { StatusModal } from '../components/StatusModal';
import Container from '../components/Container';
import { useLogin } from '@/hooks/useLogin';
import {
  BSC_CHAIN_ID,
  CROSS_CHAIN_CONTRACT_ADDRESS,
  BSC_EXPLORER_URL,
  GREENFIELD_CHAIN_ID,
  TOKEN_HUB_CONTRACT_ADDRESS,
} from '@/base/env';
import { WalletButton } from '../components/WalletButton';
import { Fee } from '../components/Fee';
import { EOperation, TCalculateGas, TTransferInFromValues, TFeeData } from '../type';
import { CROSS_CHAIN_ABI, INIT_FEE_DATA, TOKENHUB_ABI, WalletOperationInfos } from '../constants';
import { isRightChain } from '../utils/isRightChain';
import { OperationTypeContext } from '..';
import { InternalRoutePaths } from '@/constants/links';
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';
import { GAClick } from '@/components/common/GATracker';

export const TransferIn = () => {
  const { type } = React.useContext(OperationTypeContext);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [status, setStatus] = useState<any>('success');
  const router = useRouter();
  const [viewTxUrl, setViewTxUrl] = useState('');
  const {
    loginState: { address },
  } = useLogin();
  const { data: signer } = useSigner();
  const [feeData, setFeeData] = useState<TFeeData>(INIT_FEE_DATA);
  const [isGasLoading, setIsGasLoading] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    getValues,
    watch,
    reset,
    setValue,
  } = useForm<TTransferInFromValues>({
    mode: 'all',
  });
  const { chain } = useNetwork();
  const provider = useProvider();
  const { connector } = useAccount();
  const curInfo = WalletOperationInfos[type];
  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);
  const inputAmount = getValues('amount');

  const getFee = useCallback(
    async ({ amountIn, type = 'content_value' }: { amountIn: string; type?: TCalculateGas }) => {
      if (signer && amountIn) {
        try {
          setIsGasLoading(true);
          const crossChainContract = new ethers.Contract(
            CROSS_CHAIN_CONTRACT_ADDRESS,
            CROSS_CHAIN_ABI,
            signer!,
          );
          const [relayFee, ackRelayFee] = await crossChainContract.getRelayFees();
          const relayerFee = relayFee.add(ackRelayFee);
          const fData = await provider.getFeeData();
          const amountInFormat = ethers.utils.parseEther(String(amountIn));

          // bsc simulate gas fee need real amount.
          const transferInAmount =
            type === 'content_value'
              ? amountInFormat
              : amountInFormat.sub(ackRelayFee).sub(relayFee);
          const totalAmount =
            type === 'content_value'
              ? amountInFormat.add(ackRelayFee).add(relayFee)
              : amountInFormat;
          const tokenHubContract = new ethers.Contract(
            TOKEN_HUB_CONTRACT_ADDRESS,
            TOKENHUB_ABI,
            signer!,
          );
          const estimateGas = await tokenHubContract.estimateGas.transferOut(
            address,
            transferInAmount,
            {
              value: totalAmount,
            },
          );
          const gasFee = fData.gasPrice && estimateGas.mul(fData.gasPrice);

          const finalData = {
            gasFee: BigNumber(gasFee ? ethers.utils.formatEther(gasFee) : '0'),
            relayerFee: BigNumber(ethers.utils.formatEther(relayerFee)),
          };
          setIsGasLoading(false);
          setFeeData(finalData);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('getGas error', e);
          setIsGasLoading(false);
        }
      }
    },
    [address, provider, signer],
  );

  const isShowFee = useCallback(() => {
    return isEmpty(errors) && !isEmpty(inputAmount);
  }, [errors, inputAmount]);

  const onSubmit = async (data: any) => {
    setStatus('pending');
    onOpen();

    try {
      const crossChainContract = new ethers.Contract(
        CROSS_CHAIN_CONTRACT_ADDRESS,
        CROSS_CHAIN_ABI,
        signer!,
      );
      const tokenHubContract = new ethers.Contract(
        TOKEN_HUB_CONTRACT_ADDRESS,
        TOKENHUB_ABI,
        signer!,
      );
      const transferInAmount = data.amount;
      const amount = ethers.utils.parseEther(transferInAmount.toString());
      const [relayFee, ackRelayFee] = await crossChainContract.getRelayFees();
      const relayerFee = relayFee.add(ackRelayFee);
      const totalAmount = relayerFee.add(amount);
      const tx = await tokenHubContract.transferOut(address, amount, {
        value: totalAmount,
      });

      const txRes = await tx.wait();
      const txUrl = `${removeTrailingSlash(BSC_EXPLORER_URL)}/tx/${txRes.transactionHash}`;
      setViewTxUrl(txUrl);
      reset();
      !isOpen && onOpen();
      setStatus('success');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('transfer in error', e);
      !isOpen && onOpen();
      setStatus('failed');
    }
  };

  const onChangeTransfer = useCallback(() => {
    router.replace(InternalRoutePaths.transfer_out);
  }, [router]);

  const onModalClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!isEmpty(errors) || !isRight || isEmpty(inputAmount) || type !== EOperation.transfer_in) {
      return;
    }

    getFee({ amountIn: inputAmount });
  }, [getFee, isRight, type, inputAmount, errors]);

  return (
    <Container>
      <Head />
      <Flex mb={'12px'} justifyContent={'space-between'} alignItems="center">
        <ChainBox type="from" chainId={BSC_CHAIN_ID} />
        <GAClick name="dc.wallet.transferin.exchange_btn.click">
          <TransferIcon onClick={onChangeTransfer} />
        </GAClick>
        <ChainBox type="to" chainId={GREENFIELD_CHAIN_ID} />
      </Flex>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Amount
          errors={errors}
          register={register}
          disabled={isSubmitting}
          watch={watch}
          feeData={feeData}
          setValue={setValue}
          getGasFee={getFee}
          maxDisabled={isGasLoading}
        />
        {isShowFee() ? (
          <>
            <Divider margin={'12px 0'} />
            <Fee
              isGasLoading={isGasLoading}
              feeData={feeData}
              amount={inputAmount}
              gaShowTipsName="dc.wallet.transferin.fee_pop.show"
            />
          </>
        ) : (
          <Box height={'32px'} w="100%"></Box>
        )}
        <WalletButton
          isGasLoading={isGasLoading}
          disabled={!isEmpty(errors) || isSubmitting || isGasLoading}
          isSubmitting={isSubmitting}
          gaClickSubmitName="dc.wallet.transferin.transferin_btn.click"
          gaClickSwitchName="dc.wallet.transferin.switch_network.click"
        />
      </form>
      <StatusModal viewTxUrl={viewTxUrl} isOpen={isOpen} onClose={onModalClose} status={status} />
    </Container>
  );
};
