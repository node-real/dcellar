import { UnderlineLink } from '@/components/layout/Footer';
import { TStoreFeeParams } from '@/store/slices/global';
import { getUTC0FullMonth } from '@/utils/time';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import { Flex, Text, Box, Menu, MenuButton, Button, MenuList, MenuItem } from '@totejs/uikit';
import React, { useMemo, useState } from 'react';
import { Sizes, TSize, TTime, Times } from '../utils';
import { getQuotaNetflowRate, getStoreNetflowRate } from '@/utils/payment';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { PriceResponsiveContainer } from '..';
import { smMedia } from '@/modules/responsive';
import { H2 } from './Common';
import { BN } from '@/utils/math';

type PricingCardProps = {
  storeParams: TStoreFeeParams;
};
const UnitOptions = [
  {
    title: `BNB/MB/month`,
    size: 'MB',
    time: 'm',
  },
  {
    title: `BNB/GB/month`,
    size: 'GB',
    time: 'm',
  },
  {
    title: `BNB/TB/month`,
    size: 'TB',
    time: 'm',
  },
];
export const PricingCard = ({ storeParams }: PricingCardProps) => {
  const curFullMonth = getUTC0FullMonth();
  const [unit, setUnit] = useState(UnitOptions[1]);
  const prices = useMemo(() => {
    const storeSize = Sizes[unit.size as TSize];
    const storeTime = Times[unit.time as TTime];
    const storageFee = BN(getStoreNetflowRate(storeSize, storeParams))
      .times(storeTime)
      // .dividedBy(10 ** 18)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
    const quotaFee = BN(getQuotaNetflowRate(storeSize, storeParams))
      .times(storeTime)
      // .dividedBy(10 ** 18)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
    return {
      storageFee,
      quotaFee,
    };
  }, [storeParams, unit.size, unit.time]);
  return (
    <PriceResponsiveContainer
      display={'flex'}
      gap={16}
      margin={'0 auto'}
      bgColor={'#fff'}
      flexDirection={'column'}
    >
      <Flex gap={16} alignItems={'center'}>
        <H2>BNB Greenfield Pricing</H2>
        <Box
          borderRadius={4}
          p={'8px 12px'}
          fontWeight={500}
          fontSize={14}
          border="1px solid readable.border"
          sx={{
            [smMedia]: {
              padding: '4px',
              fontSize: '12px',
            },
          }}
        >
          {curFullMonth}
        </Box>
      </Flex>
      <Flex
        justifyContent={'space-between'}
        sx={{
          [smMedia]: {
            flexWrap: 'wrap',
          },
        }}
      >
        <Text
          sx={{
            [smMedia]: {
              width: '100%',
              marginBottom: '16px',
            },
          }}
        >
          Global prices will update monthly based on all the SPs' suggested prices.{' '}
          <UnderlineLink href="https://docs.bnbchain.org/greenfield-docs/docs/guide/greenfield-blockchain/modules/billing-and-payment">Learn More</UnderlineLink>
        </Text>
        <Menu matchWidth>
          {({ isOpen }) => (
            <>
              <MenuButton
                as={Button}
                h={24}
                w={122}
                fontSize={12}
                borderRadius={4}
                color={'readable.normal'}
                bgColor={'bg.bottom'}
                _hover={{
                  bg: 'bg.secondary',
                }}
                rightIcon={
                  isOpen ? (
                    <MenuOpenIcon w={16} color="readable.normal" />
                  ) : (
                    <MenuCloseIcon w={16} color="readable.normal" />
                  )
                }
              >
                {unit.title}
              </MenuButton>
              <MenuList borderRadius={4}>
                {UnitOptions.map((item, index) => (
                  <MenuItem fontSize={12} key={index} onClick={() => setUnit(item)}>
                    {item.title}
                  </MenuItem>
                ))}
              </MenuList>
            </>
          )}
        </Menu>
      </Flex>
      <Flex
        gap={20}
        sx={{
          [smMedia]: {
            flexDirection: 'column',
          },
        }}
      >
        <Flex
          flex={1}
          flexDirection={'column'}
          gap={8}
          border={'1px solid readable.border'}
          borderRadius={4}
          p={12}
        >
          <Text fontSize={16} fontWeight={600}>
            Global Storage Price
          </Text>
          <Text fontSize={14} fontWeight={500}>
            {prices.storageFee} {unit.title}
          </Text>
        </Flex>
        <Flex
          flex={1}
          flexDirection={'column'}
          gap={8}
          border={'1px solid readable.border'}
          borderRadius={4}
          p={12}
        >
          <Text fontSize={16} fontWeight={600}>
            Global Download Quota Price
          </Text>
          <Text fontSize={14} fontWeight={500}>
            {prices.quotaFee} {unit.title}
          </Text>
        </Flex>
      </Flex>
    </PriceResponsiveContainer>
  );
};
