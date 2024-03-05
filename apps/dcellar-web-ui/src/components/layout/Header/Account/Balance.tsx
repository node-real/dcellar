import { Avatar } from '@/components/Avatar';
import { CopyText } from '@/components/common/CopyText';
import { DCLink } from '@/components/common/DCLink';
import { Tips } from '@/components/common/Tips';
import { getShortenWalletAddress } from '@/utils/wallet';
import { Box, Flex, Text } from '@node-real/uikit';
import { BalanceAmount } from './BalanceAmount';

export type AvailableBalanceProps = {
  address: string;
};
export const Balance = ({ address }: AvailableBalanceProps) => {
  const shortAddress = getShortenWalletAddress(address);

  return (
    <>
      <Flex
        alignItems={'center'}
        h={34}
        bgColor={'bg.bottom'}
        borderRadius={17}
        width={'fit-content'}
        border={'1px solid readable.border'}
        p={10}
        margin={'0 auto'}
      >
        <Avatar id={shortAddress} w={20} />
        <CopyText value={address} gaClickName="dc.main.account.copy_add.click">
          <Text fontWeight="500" fontSize="14px" marginX="2px" color={'readable.normal'}>
            {shortAddress}
          </Text>
        </CopyText>
      </Flex>
      <Flex alignItems="center" justifyContent={'center'} margin={'16px auto 0'}>
        <Text color="readable.tertiary" fontWeight="500" fontSize="12px" lineHeight="20px">
          Greenfield Available Balance
        </Text>
        <Tips
          containerWidth={'200px'}
          tips={
            <Box fontSize={'12px'} lineHeight="14px" w={'200px'}>
              <Box>
                Please notice that due to the locked fee, Greenfield available balance is not equal
                to your account overall balance, which is shown at your wallet.
              </Box>
              <DCLink
                href="https://docs.nodereal.io/docs/dcellar-faq#question-what-is-greenfield-available-balance"
                target="_blank"
              >
                Learn more
              </DCLink>
            </Box>
          }
        />
      </Flex>
      <BalanceAmount />
    </>
  );
};
