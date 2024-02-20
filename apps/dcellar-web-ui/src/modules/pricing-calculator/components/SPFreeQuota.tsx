import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { Loading } from '@/components/common/Loading';
import { ExternalLinkIcon } from '@node-real/icons';
import { Flex, Text, Link } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import React from 'react';
import { PriceResponsiveContainer } from '../index';
import { smMedia } from '@/modules/responsive';
import { H2 } from './Common';
import { formatBytes } from '@/utils/formatter';

type SPFreeQuotaProps = {
  sps: any[];
};
export const SPFreeQuota = ({ sps }: SPFreeQuotaProps) => (
  <PriceResponsiveContainer
    display={'flex'}
    gap={16}
    w={'100%'}
    margin={'0 auto'}
    flexDirection={'column'}
    paddingX={'0'}
  >
    <H2>One Time Free Quota</H2>
    <Text fontSize={14} fontWeight={400}>
      Each bucket has a certain amount of one time free quota offered by SP you choose.
    </Text>
    <Flex flexWrap={'wrap'}>
      {isEmpty(sps) && <Loading />}
      {sps.map((item, index) => (
        <Flex
          key={index}
          border={'1px solid readable.border'}
          p={12}
          as='a'
          href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${item.operatorAddress}`}
          target="_blank"
          w={'50%'}
          justifyContent={'space-between'}
          borderLeftColor={index % 2 !== 0 ? 'transparent' : 'readable.border'}
          borderTopColor={index > 1 ? 'transparent' : 'readable.border'}
          color='readable.normal'
          _hover={{
            color: 'brand.brand5'
          }}
          sx={{
            [smMedia]: {
              width: '100%',
              borderTopColor: index !== 0 ? 'transparent' : 'readable.border',
              borderLeftColor: 'readable.border',
              borderBottomColor: 'readable.border',
            },
          }}
        >
          <Flex alignItems={'center'}>
            <Text fontWeight={600} fontSize={14} display={'inline-block'}>
              {item.name}
            </Text>
            <ExternalLinkIcon w={12} />
          </Flex>
          <Text color="readable.tertiary">{formatBytes(item.freeQuota)}</Text>
        </Flex>
      ))}
    </Flex>
  </PriceResponsiveContainer>
);
