import { useContext } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';

import { getNumInDigits } from '@/utils/wallet';
import { useAvailableBalance } from '@/hooks/useAvailableBalance';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  FIAT_CURRENCY_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { BnbPriceContext } from '@/context/GlobalContext/BnbPriceProvider';
import { Tips } from '@/components/common/Tips';

const NewBalance = (props: any) => {
  const { availableBalance, lockFee } = useAvailableBalance();
  const { value: bnbPrice } = useContext(BnbPriceContext);
  const exchangeRate = bnbPrice?.toNumber() ?? 0;
  const renderBalanceNumber = () => {
    if (Number(availableBalance) < 0) return 'Fetching balance...';
    return `${getNumInDigits(availableBalance, CRYPTOCURRENCY_DISPLAY_PRECISION)} BNB`;
  };

  const renderFeeNumber = () => {
    if (Number(lockFee) < 0) return 'Fetching lock fee...';
    return `${getNumInDigits(lockFee, CRYPTOCURRENCY_DISPLAY_PRECISION)} BNB`;
  };

  const renderUsd = () => {
    if (exchangeRate <= 0) return '';
    const numberInUsd = Number(availableBalance) * exchangeRate;
    return `≈ $${getNumInDigits(numberInUsd, FIAT_CURRENCY_DISPLAY_PRECISION, true)}`;
  };
  return (
    <Flex w="100%" flexDirection={'column'}>
      <Flex alignItems="center" mt="4px">
        <Text color="readable.normal" fontWeight="700" fontSize="20px">
          {renderBalanceNumber()}
        </Text>
        <Text color="readable.disabled" fontWeight="400" fontSize="12px" ml="8px">
          {renderUsd()}
        </Text>
      </Flex>
      <Flex
        w="100%"
        bg={'bg.bottom'}
        h="33px"
        padding={'8px'}
        alignItems={'center'}
        mt={'16px'}
        borderRadius={4}
        justifyContent="space-between"
      >
        <Flex color="readable.tertiary" fontWeight="700" fontSize="14px" noOfLines={1}>
          <Box>
            <Text as="span" fontWeight={700} fontSize="14px" lineHeight={'17px'}>
              Locked fee:{' '}
            </Text>
            <Text
              as="span"
              fontWeight={500}
              fontSize="14px"
              lineHeight={'17px'}
              color="readable.tertiary"
            >
              {renderFeeNumber()}
            </Text>
          </Box>
        </Flex>
        <Tips
          iconSize={'16px'}
          containerWidth={'240px'}
          tips={
            <Box fontSize={'12px'} lineHeight="14px" width={'240px'}>
              Greenfield will lock a certain amount of BNB and charge the storage fee by a certain
              flow rate based on your file size.
            </Box>
          }
        />
      </Flex>
    </Flex>
  );
};
export { NewBalance };
