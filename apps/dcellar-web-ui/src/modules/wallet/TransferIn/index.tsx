import { Box, Divider, Flex, useDisclosure } from '@totejs/uikit';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNetwork } from 'wagmi';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';

import { ChainBox } from '../components/ChainBox';
import Amount from '../components/Amount';
import { Head } from '../components/Head';
import { SwapIcon } from '../components/SwapIcon';
import { StatusModal } from '../components/StatusModal';
import Container from '../components/Container';
import { BSC_CHAIN_ID, BSC_EXPLORER_URL, GREENFIELD_CHAIN_ID } from '@/base/env';
import { WalletButton } from '../components/WalletButton';
import { Fee } from '../components/Fee';
import { TTransferInFromValues } from '../type';
import { WalletOperationInfos } from '../constants';
import { isRightChain } from '../utils/isRightChain';
import { GAClick } from '@/components/common/GATracker';
import { useAppSelector } from '@/store';
import { useChainsBalance } from '@/context/GlobalContext/WalletBalanceContext';
import { InternalRoutePaths } from '@/constants/paths';
import { removeTrailingSlash } from '@/utils/string';
import { broadcastFault } from '@/facade/error';
import { Faucet } from '../components/Faucet';
import { LargeAmountTip } from '../components/LargeAmountTip';
import { useTransferInFee } from '../hooks';

interface TransferInProps {}
export const TransferIn = memo<TransferInProps>(function TransferIn() {
  const { transType } = useAppSelector((root) => root.wallet);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [status, setStatus] = useState<any>('success');
  const [errorMsg, setErrorMsg] = useState<any>('Oops, something went wrong');
  const router = useRouter();
  const [viewTxUrl, setViewTxUrl] = useState('');
  const { all } = useChainsBalance();
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
  const curInfo = WalletOperationInfos[transType];
  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);
  const inputAmount = getValues('amount');
  const balance = useMemo(() => {
    return all.find((item) => item.chainId === BSC_CHAIN_ID)?.availableBalance || '';
  }, [all]);

  const {
    isLoading: isGasLoading,
    feeData,
    signer,
    loginAccount: address,
    tokenHubContract,
    tokenHubAbi,
    crossChainAbi,
    crossChainContract,
  } = useTransferInFee();

  const isShowFee = useCallback(() => {
    return isEmpty(errors) && !isEmpty(inputAmount);
  }, [errors, inputAmount]);

  const onSubmit = async (data: any) => {
    setStatus('pending');
    onOpen();

    try {
      const cInstance = new ethers.Contract(
        crossChainContract,
        crossChainAbi,
        signer!,
      );
      const tInstance = new ethers.Contract(tokenHubContract, tokenHubAbi, signer!);

      const transferInAmount = data.amount;
      const amount = ethers.utils.parseEther(transferInAmount.toString());
      const [relayFee, ackRelayFee] = await cInstance.getRelayFees();
      const relayerFee = relayFee.add(ackRelayFee);
      const totalAmount = relayerFee.add(amount);

      const tx = await tInstance.transferOut(address, amount, {
        value: totalAmount,
      });

      const txRes = await tx.wait();
      const txUrl = `${removeTrailingSlash(BSC_EXPLORER_URL)}/tx/${txRes.transactionHash}`;
      setViewTxUrl(txUrl);
      reset();
      !isOpen && onOpen();
      setStatus('success');
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('transfer in error', e);
      !isOpen && onOpen();
      setStatus('failed');
      setErrorMsg(broadcastFault(e)[1]);
    }
  };

  const onChangeTransfer = useCallback(() => {
    router.replace(InternalRoutePaths.transfer_out);
  }, [router]);

  const onModalClose = () => {
    reset();
    onClose();
  };

  return (
    <>
      <Container>
        <Head />
        <Flex mb={'24px'} justifyContent={'space-between'} alignItems="center">
          <ChainBox type="from" chainId={BSC_CHAIN_ID} />
          <GAClick name="dc.wallet.transferin.exchange_btn.click">
            <SwapIcon onClick={onChangeTransfer} />
          </GAClick>
          <ChainBox type="to" chainId={GREENFIELD_CHAIN_ID} />
        </Flex>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Amount
            balance={balance}
            errors={errors}
            register={register}
            disabled={isSubmitting}
            watch={watch}
            feeData={feeData}
            setValue={setValue}
            maxDisabled={isGasLoading}
          />
          {isShowFee() ? (
            <>
              <Divider margin={'24px 0'} />
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
      <Faucet />
    </>
  );
});
