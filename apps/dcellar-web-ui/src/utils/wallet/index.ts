import { GREENFIELD_CHAIN_ID } from "@/base/env";
import { GNFD_MAINNET, GNFD_TESTNET } from "../constant";

const getShortenWalletAddress = (address: string) => {
  if (!address) return '';
  if (address.length <= 7) return address;
  const length = address.length;
  const prefix = address.substring(0, 6);
  const suffix = address.substring(length - 4, length);
  return `${prefix}...${suffix}`;
};

const generateBigNumberString = (bigNum: number) => {
  return bigNum.toLocaleString('fullwide', {
    useGrouping: false,
    maximumFractionDigits: 8,
  });
};

const getNumInDigits = (
  num: number | string | null,
  digits: number,
  fixDigits = false,
  isFloor = false,
) => {
  if (!num) num = 0;
  if (!digits) return num;
  const exponentNumber = Math.pow(10, digits);
  let numberString = '';
  if (isFloor) {
    numberString = generateBigNumberString(
      Math.floor(Number(num) * exponentNumber + Number.EPSILON) / exponentNumber,
    );
  } else {
    numberString = generateBigNumberString(
      Math.round(Number(num) * exponentNumber + Number.EPSILON) / exponentNumber,
    );
  }

  return fixDigits ? Number(numberString).toFixed(digits) : numberString;
};

export const isGNFDTestnet = () => {
  return GNFD_TESTNET === GREENFIELD_CHAIN_ID;
}
export const isGNFDMainnet = () => {
  return GNFD_MAINNET === GREENFIELD_CHAIN_ID;
}

export const displayTokenSymbol = () => {
  return GNFD_MAINNET === GREENFIELD_CHAIN_ID ? 'BNB' : 'tBNB'
}

export { getShortenWalletAddress, getNumInDigits };
