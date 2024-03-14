import styled from '@emotion/styled';
import { Heading, Text } from '@node-real/uikit';
import Link from 'next/link';
import { memo } from 'react';

import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';

export const SHARE_ERROR_TYPES = {
  NO_QUOTA: {
    title: 'No Enough Quota',
    desc: 'This bucket where this object is stored don’t have enough download quota, contact the object owner to increase the download quota.',
    icon: 'empty-quota',
  },
  PERMISSION_DENIED: {
    title: 'You Need Access',
    desc: 'You don’t have permission to download. You can ask the person who shared the link to invite you directly.',
    icon: 'status-failed',
  },
  NOT_FOUND: {
    title: 'Object Not Exist or Deleted',
    desc: 'This item might not exist or is no longer available. Contact the owner of this item for more information.',
    icon: 'status-failed',
  },
  SP_NOT_FOUND: {
    title: 'Something Wrong',
    desc: 'SP address information mismatch. Please retry.',
    icon: 'discontinue',
  },
  UNKNOWN: {
    title: 'Something Wrong',
    desc: 'Oops, there’s something wrong. ',
    icon: 'discontinue',
  },
};

export type ShareErrorType = keyof typeof SHARE_ERROR_TYPES;

export const ShareError = memo<{ type: ShareErrorType }>(function ShareError({ type }) {
  const errorData = SHARE_ERROR_TYPES[type];

  return (
    <Content>
      <IconFont w={120} type={errorData.icon} />
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
