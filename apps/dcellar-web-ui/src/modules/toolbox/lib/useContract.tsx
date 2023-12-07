import { Contract, ethers } from "ethers";
import { useEthersProvider } from "./useEthers";
import { useEffect, useState } from "react";
import { ERC165Abi, erc721EnumerableAbi } from "./abi";

interface UseContractOptions {
  chainId?: number;
  address?: string;
}

export const useContract = ({ chainId, address }: UseContractOptions) => {
  const provider = useEthersProvider({ chainId });
  const [erc165, setERC165] = useState<Contract>();
  const [erc721Enumerable, setERC721Enumerable] = useState<Contract>();
  useEffect(() => {
    if (!provider || !address) {
      setERC165(undefined);
      setERC721Enumerable(undefined);
      return;
    }
    const erc165 = new ethers.Contract(address, ERC165Abi, provider);
    const erc721Enumerable = new ethers.Contract(address, erc721EnumerableAbi, provider);
    setERC165(erc165);
    setERC721Enumerable(erc721Enumerable);
  }, [provider, address]);
  return {
    erc165,
    erc721Enumerable,
  };
};
