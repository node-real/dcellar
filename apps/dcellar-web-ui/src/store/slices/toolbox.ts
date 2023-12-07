import { ERC721EnumerableInterfaceID, MAX_NFT_MIGRATION_NUM } from '@/constants/toolbox';
import { ErrorResponse, commonFault } from '@/facade/error';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { BigNumber, ethers } from 'ethers';
import { AppDispatch, AppState, GetState } from '..';
import { createPublicClient, http } from 'viem';
import { erc721EnumerableAbi } from '@/modules/toolbox/lib/abi';
import { getNftHttpUrl } from '@/modules/toolbox/lib/utils';
import { getMetadata } from '@/facade/toolbox';
import { bscTestnet } from '@/modules/toolbox/lib/constants';
import pLimit from 'p-limit';

export type ToolboxOperationType = 'nft-migration' | '';

export type NFTAttributeType = {
  trait_type: string;
  value: string;
}

export type NFTMetaDataType = {
  image: string;
  attributes: NFTAttributeType[];
}

export type NFTDataType = {
  tokenId: string;
  httpImage: string;
  metadata: NFTMetaDataType;
}
interface ToolboxState {
  nftAddress: string;
  loadingNftData: boolean;
  toolboxOperation: ToolboxOperationType,
  nftTotalSupply: Record<string, string>;
  nftData: Record<string, NFTDataType[]>
}

const initialState: ToolboxState = {
  nftAddress: '',
  toolboxOperation: '',
  loadingNftData: false,
  nftTotalSupply: {},
  nftData: {},
};

export const toolboxSlice = createSlice({
  name: 'toolbox',
  initialState,
  reducers: {
    setNftAddress(state, { payload }: PayloadAction<string>) {
      state.nftAddress = payload;
    },
    setToolboxOperation(state, { payload }: PayloadAction<ToolboxOperationType>) {
      state.toolboxOperation = payload;
    },
    setLoadingNftData(state, { payload }: PayloadAction<{ nftAddress: string, loading: boolean }>) {
      const { nftAddress, loading } = payload;
      state.loadingNftData = loading;
    },
    setNftTotalSupply(state, { payload }: PayloadAction<{ nftAddress: string, count: string }>) {
      const { nftAddress, count } = payload;
      state.nftTotalSupply[nftAddress] = count;
    },
    setNftData(state, { payload }: PayloadAction<{ nftAddress: string, data: NFTDataType[] }>) {
      const { nftAddress, data } = payload;
      state.nftData[nftAddress] = data;
    }
  },
});

export const defaultNftData = [];
export const selectNftData = (nftAddress: string) => (root: AppState) => {
  const nftData = root.toolbox.nftData;
  return nftData[nftAddress] || defaultNftData;
}

export const setupNftData = ({ nftAddress, erc165, erc721Enumerable }: { erc165?: ethers.Contract, erc721Enumerable?: ethers.Contract, nftAddress: string }) => async (dispatch: AppDispatch, getState: GetState): Promise<ErrorResponse | [NFTDataType[], null]> => {
  const onSetLoading = (loading: boolean) => {
    dispatch(setLoadingNftData({ nftAddress, loading }))
  }
  if (!erc165 || !erc721Enumerable) {
    return [null, 'Contract is not defined']
  }
  const [isSupportsInterface, error] = await erc165
    .supportsInterface(ERC721EnumerableInterfaceID).then(() => {
      return [true, null]
    }, () => {
      return [null, 'Contract does not support ERC721Enumerable']
    });
  if (error) {
    return [null, 'Contract does not support ERC721Enumerable']
  }
  onSetLoading(true);
  const [totalSupply, tsError] = await erc721Enumerable.totalSupply().then((res: BigNumber) => {
    return [res, null];
  }, commonFault);
  if (tsError) {
    onSetLoading(false);
    return [null, "Get total supply error."]
  }
  // if (totalSupply.toNumber() > MAX_NFT_MIGRATION_NUM) {
  //   onSetLoading(false);
  //   return [null, `Web UI currently only supports migration of NFTs below ${MAX_NFT_MIGRATION_NUM}.`]
  // }
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(),
  });
  const tempLen = totalSupply.toNumber() > 200 ? 200 : totalSupply;
  const tokenByIndexMulticallRes = await publicClient.multicall({
    contracts: Array.from({ length: tempLen }, (_, i) => i).map((index) => ({
      address: nftAddress as `0x${string}`,
      abi: erc721EnumerableAbi as any,
      functionName: 'tokenByIndex',
      args: [index],
    })),
  });
  if (tokenByIndexMulticallRes.some(({ status }) => status === 'failure')) {
    onSetLoading(false);
    return [null, 'Failed to fetch tokenIds'];
  }
  const tokenIds = tokenByIndexMulticallRes.map(({ result }: any) => result as ethers.BigNumber);
  console.log('tokenIds fetched', tokenIds);
  const tokenURIMulticallRes = await publicClient.multicall({
    contracts: tokenIds.map((tokenId) => ({
      address: nftAddress as `0x${string}`,
      abi: erc721EnumerableAbi as any,
      functionName: 'tokenURI',
      args: [tokenId],
    })),
  });
  if (tokenURIMulticallRes.some(({ status }) => status === 'failure')) {
    onSetLoading(false);
    return [null, 'Failed to fetch tokenURIs']
  }
  const tokenURIs = tokenURIMulticallRes.map(({ result }: any) => result as string);
  const limit = pLimit(10);
  const requests = tokenURIs.slice(0, 200).map((uri, index) => {
    return limit(() => {
      const fetchURL = getNftHttpUrl(uri);
      return getMetadata(fetchURL)
    })
  })
  // const metadataList = await Promise.all(
  //   tokenURIs.slice(0, tempLen).map(async (uri) => {
  //     const fetchURL = getNftHttpUrl(uri);
  //     return await getMetadata(fetchURL)
  //   }),
  // );
  const metadataList = await Promise.all(requests);
  console.log('metadataList', metadataList);
  let nftData: NFTDataType[] = []
  tokenIds.map((tokenId, i) => {
    const [data, error] = metadataList[i];
    if (data === null || error) {
      return {
        tokenId: tokenId.toString(),
      }
    }
    const item = {
      tokenId: tokenId.toString(),
      httpImage: getNftHttpUrl(data.image),
      metadata: data,
    }
    nftData.push(item)
  });
  onSetLoading(false);
  dispatch(setNftTotalSupply({ nftAddress, count: totalSupply }))
  dispatch(setNftData({ nftAddress, data: nftData }));

  return [nftData, null]
};

export const { setToolboxOperation, setLoadingNftData, setNftTotalSupply, setNftData, setNftAddress } =
  toolboxSlice.actions;

export default toolboxSlice.reducer;
