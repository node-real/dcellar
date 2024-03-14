import { Avatar } from '@/components/Avatar';
import { DCButton } from '@/components/common/DCButton';
import { getShortenWalletAddress } from '@/utils/wallet';
import { Text } from '@node-real/uikit';

export type AddressProps = {
  address: string;
};

export const Address = ({ address }: AddressProps) => {
  const shortAddress = getShortenWalletAddress(address);

  return (
    <DCButton
      variant="ghost"
      height={44}
      borderRadius={20}
      fontSize={14}
      fontWeight={500}
      padding={'6px 10px 6px 4px'}
      border={'none'}
      _hover={{
        bg: 'bg.bottom',
      }}
    >
      <Avatar id={shortAddress} w={36} />
      <Text>{shortAddress}</Text>
    </DCButton>
  );
};
