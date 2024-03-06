import { IconFont } from '@/components/IconFont';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/object/utils';
import { useAppSelector } from '@/store';
import { Divider, Flex, Text, useDisclosure } from '@node-real/uikit';
import BigNumber from 'bignumber.js';
import { memo } from 'react';
import { useAsyncEffect } from 'ahooks';
import { selectGnfdGasFeesConfig } from '@/store/slices/global';

export type FeeItem = {
  label: string;
  types: string[];
  value?: number;
};

interface FeesProps {
  fees: FeeItem[];
  setBalanceAvailable?: (val: boolean) => void;
}

export const Fees = memo<FeesProps>(function Fees({ fees, setBalanceAvailable }) {
  const exchangeRate = useAppSelector((root) => root.global.bnbUsdtExchangeRate);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);

  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  const _fees = fees.map((fee) => ({
    label: fee.label,
    value: fee.value ?? fee.types.reduce((res, cur) => res + gnfdGasFeesConfig?.[cur]?.gasFee, 0),
  }));
  const allFees = _fees.reduce((res, cur) => res.plus(cur.value), new BigNumber(0));
  const enoughBalance = new BigNumber(bankBalance).minus(allFees).isPositive();

  useAsyncEffect(async () => {
    setBalanceAvailable?.(enoughBalance);
  }, [enoughBalance]);

  return (
    <>
      <Flex
        gap={8}
        padding={'8px 12px'}
        flexDirection={'column'}
        bg={'bg.bottom'}
        borderRadius="4px"
      >
        <Flex
          fontSize={'14px'}
          fontWeight={600}
          onClick={onToggle}
          justifyContent={'space-between'}
          alignItems={'center'}
          cursor={'pointer'}
        >
          <Text>Total Fees</Text>
          <Flex
            color="readable.secondary"
            justifySelf={'flex-end'}
            fontWeight={'normal'}
            alignItems={'center'}
          >
            {renderFeeValue(allFees.toString(), exchangeRate)}
            <IconFont color={'readable.normal'} type={isOpen ? 'menu-open' : 'menu-close'} w={20} />
          </Flex>
        </Flex>
        {isOpen && (
          <>
            <Divider borderColor={'readable.disable'} />
            {_fees.map((item, index) => (
              <Flex key={index} w="100%" alignItems={'center'} justifyContent={'space-between'}>
                <Flex alignItems="center">
                  <Text color={'readable.tertiary'} as="p">
                    {item.label}
                  </Text>
                </Flex>
                <Text color={'readable.tertiary'}>
                  {renderFeeValue(String(item.value), exchangeRate)}
                </Text>
              </Flex>
            ))}
            <Flex w={'100%'} justifyContent={'flex-end'}>
              <Text fontSize={'12px'} color={'readable.disable'}>
                Owner Account balance: {renderBalanceNumber(bankBalance || '0')}
              </Text>
            </Flex>
          </>
        )}
      </Flex>
      {!enoughBalance && (
        <Text fontSize={'14px'} color={'scene.danger.normal'}>
          {renderInsufficientBalance(allFees.toString(), '0', bankBalance || '0', {
            gaShowName: 'dc.group.create_group.show',
            gaClickName: 'dc.group.create_group.click',
          })}
        </Text>
      )}
    </>
  );
});
