import { useMemo } from 'react';
import { Card, CardProps, CardTitle, CircleIcon } from './Common';
import { BN } from '@/utils/math';
import { getQuotaNetflowRate, getStoreNetflowRate } from '@/utils/payment';
import { useAppSelector } from '@/store';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { Box, Flex, Text } from '@totejs/uikit';
import { displayTokenSymbol } from '@/utils/wallet';
import { isEmpty } from 'lodash-es';

const DEFAULT_STORE_SIZE = 1024 * 1024 * 1034;
const DEFAULT_STORE_TIME = 30 * 24 * 60 * 60;

const TOOL_OPTIONS = [
  {
    icon: 'calculate',
    name: 'Pricing Calculator',
    link: '/pricing-calculator',
    target: '_blank',
  },
  {
    icon: 'tutorials',
    name: 'Tutorial',
    link: 'https://docs.nodereal.io/docs/dcellar-get-started',
    target: '_blank',
  },
];

export const ToolBox = ({ children, ...restProps }: CardProps) => {
  const { storeFeeParams } = useAppSelector((root) => root.global);
  const isLoading = isEmpty(storeFeeParams);
  const priceOptions = useMemo(() => {
    const storageFee = BN(getStoreNetflowRate(DEFAULT_STORE_SIZE, storeFeeParams))
      .times(DEFAULT_STORE_TIME)
      // .dividedBy(10 ** 18)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
    const quotaFee = BN(getQuotaNetflowRate(DEFAULT_STORE_SIZE, storeFeeParams))
      .times(DEFAULT_STORE_TIME)
      // .dividedBy(10 ** 18)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();

    return [
      {
        icon: 'dollar',
        label: 'Global Storage Price',
        value: storageFee,
        symbol: displayTokenSymbol() + '/GB/month',
      },
      {
        icon: 'dollar',
        label: 'Global Download Quota Price',
        value: quotaFee,
        symbol: displayTokenSymbol() + '/GB/month',
      },
    ];
  }, [storeFeeParams]);
  return (
    <Card w={374} flex={1} {...restProps}>
      <CardTitle>ToolBox</CardTitle>
      {TOOL_OPTIONS.map((item, index) => (
        <Flex
          key={index}
          alignItems={'center'}
          p={'8px 4px'}
          gap={8}
          borderRadius={4}
          cursor={'pointer'}
          as={'a'}
          href={item.link}
          target="_blank"
          _hover={{
            bgColor: '#f5f5f5',
          }}
        >
          <CircleIcon icon={item.icon} />
          <Text fontWeight={500}>{item.name}</Text>
        </Flex>
      ))}
      {priceOptions.map((item, index) => (
        <Flex key={index} gap={8} p={'8px 4px'}>
          <CircleIcon icon={item.icon} />
          <Box>
            <Text fontSize={12} color={'readable.tertiary'} mb={6}>
              {item.label}
            </Text>
            <Box fontSize={14} fontWeight={500}>
              <Text as="span">{isLoading ? '--' : item.value}</Text> <Text as="span">{item.symbol}</Text>
            </Box>
          </Box>
        </Flex>
      ))}
    </Card>
  );
};
