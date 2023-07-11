import { Box, Flex, Link, Text } from '@totejs/uikit';

import { getNumInDigits } from '@/utils/wallet';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  FIAT_CURRENCY_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { Tips } from '@/components/common/Tips';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBnbPrice, setupTmpAvailableBalance, setupTmpLockFee } from '@/store/slices/global';
import { useMount } from 'ahooks';

const NewBalance = (props: any) => {
  const dispatch = useAppDispatch();
  const exchangeRate = useAppSelector(selectBnbPrice);
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { _availableBalance: availableBalance, _lockFee: lockFee } = useAppSelector(
    (root) => root.global,
  );

  useMount(() => {
    dispatch(setupTmpAvailableBalance(address));
    dispatch(setupTmpLockFee(address));
  });

  const renderBalanceNumber = () => {
    if (Number(availableBalance) < 0) return 'Fetching balance...';
    return `${getNumInDigits(availableBalance, CRYPTOCURRENCY_DISPLAY_PRECISION)} BNB`;
  };

  const renderFeeNumber = () => {
    if (Number(lockFee) < 0) return 'Fetching lock fee...';
    const fee = getNumInDigits(lockFee, CRYPTOCURRENCY_DISPLAY_PRECISION);

    return Number(fee) === 0 && Number(lockFee) > 0 ? `≈${fee} BNB` : `${fee} BNB`;
  };

  const renderUsd = () => {
    if (Number(exchangeRate) <= 0) return '';
    const numberInUsd = Number(availableBalance) * Number(exchangeRate);
    return `≈ $${getNumInDigits(numberInUsd, FIAT_CURRENCY_DISPLAY_PRECISION, true)}`;
  };
  return (
    <Flex w="100%" flexDirection={'column'}>
      <Flex alignItems="center" mt="4px" flexWrap="wrap">
        <Text color="readable.normal" fontWeight="700" fontSize="20px" mr="8px">
          {renderBalanceNumber()}
        </Text>
        <Text color="readable.disabled" fontWeight="400" fontSize="12px">
          {renderUsd()}
        </Text>
      </Flex>
      <Flex
        w="100%"
        bg={'bg.bottom'}
        padding={'8px'}
        alignItems={'center'}
        mt={'16px'}
        borderRadius={4}
        justifyContent="space-between"
      >
        <Flex alignItems="center" flexWrap="wrap" fontSize="14px" color="readable.tertiary">
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
        </Flex>
        <Tips
          iconSize={'16px'}
          containerWidth={'240px'}
          tips={
            <Box fontSize={'12px'} lineHeight="14px" width={'240px'}>
              <Box>
                Greenfield will lock a certain amount of BNB and charge the storage fee by a certain
                flow rate based on your file size.
              </Box>
              <Link
                href="https://docs.nodereal.io/docs/faq-1#question-what-is-flow-rate"
                target="_blank"
                color="readable.primary"
                textDecoration="underline"
              >
                Learn more
              </Link>
            </Box>
          }
        />
      </Flex>
    </Flex>
  );
};
export { NewBalance };
