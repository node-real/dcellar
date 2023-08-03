import styled from '@emotion/styled';
import { Box, Image, Text } from '@totejs/uikit';
import { assetPrefix } from '@/base/env';
import { DCButton } from '@/components/common/DCButton';
import Link from 'next/link';
import React from 'react';
import { GAClick } from '@/components/common/GATracker';

export const ShareCTA = () => {
  return (
    <Content>
      <Image w={40} src={`${assetPrefix}/images/icons/storage_icon.svg`} alt="Dcellar" />
      <Text fontWeight={600} fontSize={16} lineHeight="19px" m={24}>
        Start your journey of BNB Greenfield decentralized data network with DCellar Now.🥳
      </Text>
      <Link href="/buckets" legacyBehavior passHref replace>
        <DCButton
          gaClickName="dc.shared_ui.preview.get_stated.click"
          variant="scene"
          bgColor={'readable.normal'}
          _hover={{ bg: 'readable.tertiary' }}
          w={126}
          h={40}
          as="a"
          mb={12}
          padding={0}
        >
          Get Started
        </DCButton>
      </Link>
      <Link
        href="https://docs.nodereal.io/docs/dcellar-get-started"
        legacyBehavior
        passHref
        replace
      >
        <GAClick name="dc.shared_ui.preview.learn_more.click">
          <Box fontWeight={500} as="a" lineHeight="20px" _hover={{ textDecoration: 'underline' }}>
            Learn More
          </Box>
        </GAClick>
      </Link>
    </Content>
  );
};

const Content = styled.div`
  background: #f5f5f5;
  border-left: 1px solid #e6e8ea;
  width: 269px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
`;
