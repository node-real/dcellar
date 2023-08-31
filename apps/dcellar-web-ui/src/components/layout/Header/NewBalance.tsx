import { Flex, Text, Circle } from '@totejs/uikit';
import { getNumInDigits } from '@/utils/wallet';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  FIAT_CURRENCY_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { Tips } from '@/components/common/Tips';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBnbPrice, setupTmpAvailableBalance, setupTmpLockFee } from '@/store/slices/global';
import { useMount } from 'ahooks';
import { selectBalance } from '@/store/slices/balance';
import BSCLogo from '@/public/images/accounts/logo-bsc.svg';
import { setupAccountsInfo } from '@/store/slices/accounts';

const NewBalance = (props: any) => {
  const dispatch = useAppDispatch();
  const exchangeRate = useAppSelector(selectBnbPrice);
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const {bankBalance: availableBalance} = useAppSelector(root=> root.accounts);
  useMount(() => {
    dispatch(setupAccountsInfo(address))
  });

  const renderBalanceNumber = () => {
    if (Number(availableBalance) < 0) return 'Fetching balance...';
    return `${getNumInDigits(availableBalance, CRYPTOCURRENCY_DISPLAY_PRECISION)} BNB`;
  };

  const renderUsd = () => {
    if (Number(exchangeRate) <= 0) return '';
    const numberInUsd = Number(availableBalance) * Number(exchangeRate);
    return `≈ $${getNumInDigits(numberInUsd, FIAT_CURRENCY_DISPLAY_PRECISION, true)}`;
  };

  return (
    <Flex w="100%" flexDirection={'column'} marginBottom={16}>
      <Flex alignItems="center" mt="4px" flexDirection={'column'} gap={8} flexWrap="wrap">
        <Flex color="readable.normal" fontWeight="700" fontSize="24px" mr="8px" alignItems={'center'}>
          <Circle backgroundColor={'#F0B90B'} size='24px' marginRight={10}><BSCLogo /></Circle> {renderBalanceNumber()}
        </Flex>
        <Text color="readable.disabled" fontWeight="400" fontSize="12px">
          {renderUsd()}
        </Text>
      </Flex>
      {/* <Flex
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
                flow rate based on your object size.
              </Box>
              <Link
                href="https://docs.nodereal.io/docs/dcellar-faq#question-what-is-flow-rate"
                target="_blank"
                color="readable.primary"
                textDecoration="underline"
              >
                Learn more
              </Link>
            </Box>
          }
        />
      </Flex> */}
    </Flex>
  );
};
export { NewBalance };
