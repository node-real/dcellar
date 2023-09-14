import React, { memo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupTmpAvailableBalance } from '@/store/slices/global';
import { Box, Flex, Text, useDisclosure } from '@totejs/uikit';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
} from '@/modules/file/utils';
import { MenuCloseIcon } from '@totejs/icons';
import BigNumber from 'bignumber.js';

export type FeeItem = {
  label: string;
  type: string;
  value?: number;
};

interface FeesProps {
  fees: FeeItem[];
  setBalanceAvailable?: (val: boolean) => void;
}

export const Fees = memo<FeesProps>(function Fees({ fees, setBalanceAvailable = () => {} }) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { price: exchangeRate } = useAppSelector((root) => root.global.bnb);
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { isOpen, onToggle } = useDisclosure();

  useEffect(() => {
    dispatch(setupTmpAvailableBalance(loginAccount));
  }, [fees]);

  const _fees = fees.map((fee) => ({
    label: fee.label,
    value: fee.value ?? (gasObjects?.[fee.type]?.gasFee || 0),
  }));

  const allFees = _fees.reduce((res, cur) => res.plus(cur.value), new BigNumber(0));

  useEffect(() => {
    setBalanceAvailable(new BigNumber(bankBalance).minus(allFees).isPositive());
  }, [allFees.toString(), bankBalance]);

  return (
    <Flex
      mt={16}
      flexDirection={'column'}
      w="100%"
      padding={'8px'}
      bg={'bg.secondary'}
      borderRadius="4px"
    >
      <Flex
        paddingBottom={'4px'}
        fontSize={'14px'}
        fontWeight={600}
        onClick={onToggle}
        justifyContent={'space-between'}
        alignItems={'center'}
        cursor={'pointer'}
      >
        <Text>Total Fees</Text>
        <Text justifySelf={'flex-end'} fontWeight={'normal'}>
          {renderFeeValue(allFees.toString(), exchangeRate)}
          <MenuCloseIcon
            sx={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Text>
      </Flex>
      <Box borderTop="1px solid #AEB4BC" display={isOpen ? 'none' : 'block'}>
        <Flex display={'flex'} flexDirection={'column'} gap={'4px'} paddingTop={'4px'}>
          {_fees.map((item, index) => (
            <Flex key={index} w="100%" alignItems={'center'} justifyContent={'space-between'}>
              <Flex alignItems="center" mb="4px">
                <Text
                  fontSize={'14px'}
                  lineHeight={'17px'}
                  fontWeight={400}
                  color={'readable.tertiary'}
                  as="p"
                >
                  {item.label}
                </Text>
              </Flex>
              <Text
                fontSize={'14px'}
                lineHeight={'17px'}
                fontWeight={400}
                color={'readable.tertiary'}
              >
                {renderFeeValue(String(item.value), exchangeRate)}
              </Text>
            </Flex>
          ))}
        </Flex>
        <Flex w={'100%'} justifyContent={'space-between'}>
          {/*todo correct the error showing logics*/}
          <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
            {renderInsufficientBalance(allFees.toString(), '0', bankBalance || '0', {
              gaShowName: 'dc.group.create_group.show',
              gaClickName: 'dc.group.create_group.click',
            })}
          </Text>
          <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
            Available balance: {renderBalanceNumber(bankBalance || '0')}
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
});
