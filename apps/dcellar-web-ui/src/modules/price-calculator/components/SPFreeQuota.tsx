import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { Loading } from '@/components/common/Loading';
import { formatBytes } from '@/modules/file/utils';
import { ExternalLinkIcon } from '@totejs/icons';
import { Flex, Text, Link } from '@totejs/uikit';
import { isEmpty } from 'lodash-es';
import React from 'react';

type SPFreeQuotaProps = {
  sps: any[];
};
export const SPFreeQuota = ({ sps }: SPFreeQuotaProps) => {
  return (
    <Flex gap={16} w={954} margin={'0 auto'} flexDirection={'column'}>
      <Text fontSize={24} fontWeight={700}>
        One Time Free Quota
      </Text>
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
            w={'50%'}
            justifyContent={'space-between'}
          >
            <Link
              href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${item.operatorAddress}`}
              target='_blank'
              cursor={'pointer'}
              display={'flex'}
              alignItems={'center'}
              color={'readable.normal'}
            >
              <Text fontWeight={600} fontSize={13} display={'inline-block'}>
                {item.name}
              </Text>
              <ExternalLinkIcon w={12} />
            </Link>
            <Text color="readable.tertiary">{formatBytes(item.freeQuota)}</Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};
