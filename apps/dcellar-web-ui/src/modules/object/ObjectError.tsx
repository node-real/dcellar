import styled from '@emotion/styled';
import { Image, Heading, Text } from '@totejs/uikit';
import { FILE_FAILED_URL, NOT_ENOUGH_QUOTA_URL, UNKNOWN_ERROR_URL } from '@/modules/file/constant';
import { DCButton } from '@/components/common/DCButton';
import Link from 'next/link';
import React, { memo } from 'react';

export const OBJECT_ERROR_TYPES = {
  NOT_BROWSER: {
    title: '',
    desc: 'please ',
  }
};

export type ShareErrorType = keyof typeof SHARE_ERROR_TYPES;

export const ShareError = memo<{ type: ShareErrorType }>(function ShareError({ type }) {
  const errorData = SHARE_ERROR_TYPES[type];

  return (
    <Content>
      <Image src={errorData.icon} alt="File not found" />
      <Heading fontWeight={600} fontSize={24} lineHeight="36px" mt={10} mb={16}>
        {errorData.title}
      </Heading>
      <Text fontSize={16} lineHeight="19px" color="readable.secondary" maxW={434} mb={32}>
        {errorData.desc}
      </Text>
      <Link href="/" legacyBehavior passHref replace>
        <DCButton variant="dcPrimary" w={188} h={48} as="a" mb={40} fontSize={16}>
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
