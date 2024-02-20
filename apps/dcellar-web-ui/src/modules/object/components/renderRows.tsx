import React from 'react';
import { Flex, Link, Text } from '@node-real/uikit';
import { CopyText } from '@/components/common/CopyText';
import { formatAddress, trimAddress } from '@/utils/string';
import { GAClick } from '@/components/common/GATracker';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { LoadingAdaptor } from '@/modules/accounts/components/LoadingAdaptor';
import { IconFont } from '@/components/IconFont';

export const renderPropRow = (key: string, value: React.ReactNode) => {
  return (
    <Flex alignItems="center" justifyContent="space-between" h={25}>
      <Text
        noOfLines={1}
        fontWeight={500}
        fontSize={'14px'}
        lineHeight={'17px'}
        color={'readable.tertiary'}
        width="200px"
        mr="16px"
      >
        {key}
      </Text>
      <LoadingAdaptor loading={!value} empty={false}>
        <Text fontWeight={500} as="div">
          {value}
        </Text>
      </LoadingAdaptor>
    </Flex>
  );
};

export const renderAddressLink = (
  key: string,
  value: string,
  gaClickName?: string,
  gaCopyClickName?: string,
  type = 'account',
) => {
  return (
    <Flex alignItems="center" justifyContent="space-between" h={25}>
      <Text
        noOfLines={1}
        fontWeight={500}
        fontSize={'14px'}
        lineHeight={'17px'}
        color={'readable.tertiary'}
        width="200px"
        mr="16px"
      >
        {key}
      </Text>
      {renderAddressWithLink(value, type, gaClickName, gaCopyClickName)}
    </Flex>
  );
};

export const renderTags = ({ onClick, tagsCount}: { onClick: () => void; tagsCount: number}) => {
  return (
    <Flex
      justifyContent={'space-between'}
      color="readable.tertiary"
      alignItems="center"
      h={24}
      _notLast={{
        mb: 8,
      }}
    >
      <Text fontSize={'14px'} fontWeight={500} color="readable.tertiary">
        Tags
      </Text>
      <Flex>
        <Flex
          alignItems={'center'}
          gap={4}
          color={'brand.brand6'}
          cursor={'pointer'}
          onClick={onClick}
        >
          <IconFont type="pen" />
          {tagsCount || 0} tags
        </Flex>
      </Flex>
    </Flex>
  );
};

export const renderAddressWithLink = (
  address: string,
  type: string,
  gaClickName?: string,
  gaCopyClickName?: string,
) => {
  return (
    <LoadingAdaptor loading={!address} empty={false}>
      <CopyText value={address} gaClickName={gaCopyClickName}>
        <GAClick name={gaClickName}>
          <Link
            target="_blank"
            color="#1184EE"
            cursor={'pointer'}
            textDecoration={'underline'}
            _hover={{
              color: '#3C9AF1',
            }}
            href={`${GREENFIELD_CHAIN_EXPLORER_URL}/${type}/${address}`}
            fontSize={'14px'}
            lineHeight={'17px'}
            fontWeight={500}
          >
            {trimAddress(address, 28, 15, 13)}
          </Link>
        </GAClick>
      </CopyText>
    </LoadingAdaptor>
  );
};

export const renderUrlWithLink = (
  encodedText: string,
  needSlim = true,
  reservedNumber = 32,
  gaClickName?: string,
  gaCopyClickName?: string,
) => {
  const finalText = needSlim ? encodedText.substring(0, reservedNumber) + '...' : encodedText;
  return (
    <CopyText value={encodedText} justifyContent="flex-end" gaClickName={gaCopyClickName}>
      <GAClick name={gaClickName}>
        <Link
          target="_blank"
          color="#1184EE"
          cursor={'pointer'}
          textDecoration={'underline'}
          _hover={{
            color: '#1184EE',
          }}
          href={encodedText}
          fontSize={'14px'}
          lineHeight={'17px'}
          fontWeight={500}
        >
          {finalText}
        </Link>
      </GAClick>
    </CopyText>
  );
};
