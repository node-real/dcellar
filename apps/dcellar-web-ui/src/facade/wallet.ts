import { signTypedDataV4 } from '@/utils/coder';
import { BN } from '@/utils/math';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { Connector } from 'wagmi';
import { resolve } from './common';
import { ErrorResponse, commonFault } from './error';

export const signTypedDataCallback = (connector: Connector) => {
  return async (addr: string, message: string) => {
    const provider = await connector.getProvider();
    return await signTypedDataV4(provider, addr, message);
  };
};

export const calTransferInFee = async (
  params: {
    amount: string;
    crossChainContractAddress: string;
    tokenHubContract: string;
    crossChainAbi: any;
    tokenHubAbi: any;
    address: string;
  },
  signer: ethers.providers.JsonRpcSigner,
  provider: ethers.providers.JsonRpcProvider | ethers.providers.FallbackProvider,
): Promise<ErrorResponse | [{ relayerFee: BigNumber; gasFee: BigNumber }, null]> => {
  const crossChainContract = new ethers.Contract(
    params.crossChainContractAddress,
    params.crossChainAbi,
    signer!,
  );
  const [fee, error1] = await crossChainContract.getRelayFees().then(resolve, commonFault);
  if (error1) return [null, error1];
  const [relayFee, ackRelayFee] = fee;
  const relayerFee = relayFee.add(ackRelayFee);
  const fData = await provider.getFeeData();
  const amountInFormat = ethers.utils.parseEther(String(params.amount));
  const transferInAmount = amountInFormat;

  const totalAmount = amountInFormat.add(ackRelayFee).add(relayFee);

  const tokenHubContract = new ethers.Contract(
    params.tokenHubContract,
    params.tokenHubAbi,
    signer!,
  );

  const [estimateGas, error2] = await tokenHubContract.estimateGas
    .transferOut(params.address, transferInAmount, {
      value: totalAmount,
    })
    .then(resolve, commonFault);
  if (!estimateGas || error2) return [null, error2];

  const gasFee = fData.gasPrice && estimateGas.mul(fData.gasPrice);

  const finalData = {
    gasFee: BN(gasFee ? ethers.utils.formatEther(gasFee) : '0'),
    relayerFee: BN(ethers.utils.formatEther(relayerFee)),
  };

  return [finalData, null];
};
