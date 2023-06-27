import { useLogin } from '@/hooks/useLogin';
import { SEOHead } from '@/components/layout/SEOHead';
import React from 'react';
import { Footer } from '@/components/layout/Footer';
import styled from '@emotion/styled';
import { assetPrefix } from '@/base/env';
import { useColorMode, Text, Heading } from '@totejs/uikit';
import { errorCodes, TErrorCodeKey } from '@/base/http/utils/errorCodes';
import { DCButton } from '@/components/common/DCButton';
import Link from 'next/link';
import { InternalRoutePaths } from '@/constants/links';
import { Image } from '@totejs/uikit';

const Container = styled.main`
  min-height: 100%;
  max-width: 100%;
  display: grid;
  overflow: hidden;
`;

const Content = styled.div`
  margin: auto;
  text-align: center;
  img {
    aspect-ratio: 275/ 240;
    width: 275px;
    margin: auto;
  }
`;


function NoBucket() {
  return (
    <>
      <Container>
        <Content>
          <Image
            alt="Oops, something went wrong"
            src={`${assetPrefix}/images/common/no_bucket.png`}
          />
          <Heading as="h1" fontSize={'24px'} fontWeight={600} lineHeight={'36px'} mt={16} mb={8}>
            Bucket Not Exist or Deleted
          </Heading>
          <Text
            as="p"
            fontSize={'16px'}
            fontWeight={500}
            lineHeight={'24px'}
            color="#76808F"
            mb={26}
          >
            This bucket might not exist or is no longer available. Contact the owner of this bucket
            for more information.
          </Text>
          <Link href={InternalRoutePaths.buckets} legacyBehavior passHref replace>
            <DCButton
              variant="dcPrimary"
              w={132}
              h={32}
              as="a"
              mb={40}
              fontSize={12}
              borderRadius={4}
            >
              Back to Home
            </DCButton>
          </Link>
        </Content>
      </Container>
    </>
  );
}

export default NoBucket;
