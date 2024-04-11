import { Flex, Text } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';

import { H2 } from './Common';
import { PriceResponsiveContainer, TQuotaSP } from '../index';

import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { Loading } from '@/components/common/Loading';
import { formatBytes } from '@/utils/formatter';
import { IconFont } from '@/components/IconFont';

type SPFreeQuotaProps = { sps: TQuotaSP[] };

export const SPFreeQuota = ({ sps }: SPFreeQuotaProps) => {
  return (
    <PriceResponsiveContainer
      display={'flex'}
      gap={16}
      w={'100%'}
      margin={'0 auto'}
      flexDirection={'column'}
      paddingX={'0'}
    >
      <H2>Free Quota</H2>
      <Text fontSize={14} fontWeight={400} color={'readable.secondary'}>
        Each bucket offers a one-time and monthly free quota from the chosen SP.
      </Text>
      <Flex
        flexWrap={'wrap'}
        border={'1px solid readable.border'}
        borderRadius={4}
        overflow={'hidden'}
      >
        <Flex
          fontSize={[12, 16]}
          fontWeight={[500, 600]}
          bg={'bg.bottom'}
          w={'100%'}
          borderBottom={'none'}
          alignItems={'center'}
        >
          <Text px={[8, 16]} py={8} flex={400}>
            Storage Provider
          </Text>
          <Text px={[8, 16]} py={8} flex={277}>
            Free monthly quota
          </Text>
          <Text px={[8, 16]} py={8} flex={277}>
            Free quota (one-time)
          </Text>
        </Flex>
        {isEmpty(sps) && <Loading my={40} />}
        {sps.map((item, index) => (
          <Flex
            key={index}
            borderTop={'1px solid readable.border'}
            as="a"
            href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${item.operatorAddress}`}
            target="_blank"
            w={'100%'}
            justifyContent={'space-between'}
            color="readable.normal"
            _hover={{
              color: 'brand.brand5',
            }}
            h={42}
          >
            <Flex alignItems={'center'} flex={[159, 400]} px={[8, 16]} py={[8, 12]}>
              <Text wordBreak={'break-all'} fontWeight={500} fontSize={[14, 16]} noOfLines={1}>
                {item.name}
              </Text>
              <IconFont type={'out'} w={[12, 16]} ml={[2, 8]} />
            </Flex>
            <Text color="readable.normal" flex={[88, 277]} px={[8, 16]} py={[8, 12]}>
              {!item.monthlyFreeQuota ? '--' : formatBytes(item.monthlyFreeQuota)}
            </Text>
            <Text color="readable.normal" flex={[88, 277]} px={[8, 16]} py={[8, 12]}>
              {!item.freeQuota ? '--' : formatBytes(item.freeQuota)}
            </Text>
          </Flex>
        ))}
      </Flex>
    </PriceResponsiveContainer>
  );
};
