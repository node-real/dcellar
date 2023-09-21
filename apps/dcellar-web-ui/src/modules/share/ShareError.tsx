import styled from '@emotion/styled';
import { Image, Heading, Text } from '@totejs/uikit';
import { FILE_FAILED_URL, NOT_ENOUGH_QUOTA_URL, UNKNOWN_ERROR_URL } from '@/modules/file/constant';
import { DCButton } from '@/components/common/DCButton';
import Link from 'next/link';
import React, { memo } from 'react';

export const SHARE_ERROR_TYPES = {
  NO_QUOTA: {
    title: 'No Enough Quota',
    desc: 'This bucket where this object is stored don’t have enough download quota, contact the object owner to increase the download quota.',
    icon: NOT_ENOUGH_QUOTA_URL,
  },
  PERMISSION_DENIED: {
    title: 'You Need Access',
    desc: 'You don’t have permission to download. You can ask the person who shared the link to invite you directly.',
    icon: FILE_FAILED_URL,
  },
  NOT_FOUND: {
    title: 'Object Not Exist or Deleted',
    desc: 'This item might not exist or is no longer available. Contact the owner of this item for more information.',
    icon: FILE_FAILED_URL,
  },
  SP_NOT_FOUND: {
    title: 'Something Wrong',
    desc: 'Sp address info is mismatched, please retry.',
    icon: UNKNOWN_ERROR_URL,
  },
  UNKNOWN: {
    title: 'Something Wrong',
    desc: 'Oops, there’s something wrong. ',
    icon: UNKNOWN_ERROR_URL,
  },
};

export type ShareErrorType = keyof typeof SHARE_ERROR_TYPES;

export const ShareError = memo<{ type: ShareErrorType }>(function ShareError({ type }) {
  const errorData = SHARE_ERROR_TYPES[type];

  return (
    <Content>
      <Image src={errorData.icon} alt="Object not found" />
      <Heading fontWeight={600} fontSize={24} lineHeight="36px" mt={10} mb={16}>
        {errorData.title}
      </Heading>
      <Text fontSize={16} lineHeight="19px" color="readable.secondary" maxW={434} mb={32}>
        {errorData.desc}
      </Text>
      <Link href="/buckets" legacyBehavior passHref replace>
        <DCButton w={188} h={48} as="a" mb={40} fontSize={16}>
          Back to Home
        </DCButton>
      </Link>
    </Content>
  );
});

const Content = styled.div`
  margin: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
