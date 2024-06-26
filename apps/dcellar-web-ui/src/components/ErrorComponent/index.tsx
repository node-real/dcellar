import { assetPrefix } from '@/base/env';
import { TErrorCodeKey, errorCodes } from '@/base/http/utils/errorCodes';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { SEOHead } from '@/components/common/SEOHead';
import { Footer } from '@/components/layout/Footer';
import { InternalRoutePaths } from '@/constants/paths';
import { useAppSelector } from '@/store';
import styled from '@emotion/styled';
import { Heading, Image, Text, useColorMode } from '@node-real/uikit';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Container = styled.main`
  min-height: calc(100vh - 48px);
  max-height: max-content;
  display: grid;
`;

const Content = styled.div`
  margin: auto;
  text-align: center;
`;

const Logo = styled.img`
  aspect-ratio: 338/144;
  position: absolute;
  left: 0;
  top: 0;
`;

interface ErrorComponentProps {
  statusCode: number;
}

function ErrorComponent({ statusCode }: ErrorComponentProps) {
  const address = useAppSelector((root) => root.persist.loginAccount);

  const { colorMode } = useColorMode();
  const router = useRouter();

  const { err } = router.query;
  const isNoBucket = err === 'noBucket';
  const text = isNoBucket
    ? 'Bucket Not Exist or Deleted'
    : statusCode === 404
      ? 'Page Not Found'
      : 'Oops!';
  const desc = isNoBucket
    ? `This bucket might not exist or is no longer available.\r\nContact the owner of this bucket for more information.`
    : statusCode === 404
      ? `The page you're looking for does not seem to exit.`
      : errorCodes[statusCode as TErrorCodeKey];

  return (
    <>
      <SEOHead />
      <Container>
        <Logo
          alt="Dcellar Logo"
          src={
            colorMode === 'dark'
              ? `${assetPrefix}/images/logo_welcome_dark.svg`
              : `${assetPrefix}/images/logo_welcome.svg`
          }
        />
        <Content>
          {isNoBucket ? (
            <IconFont type={'status-failed'} w={120} display="inline-block" />
          ) : (
            <Image
              alt="Oops, something went wrong"
              src={`${assetPrefix}/images/${statusCode === 404 ? '404' : 'error'}.png`}
              w={275}
              sx={{
                aspectRatio: '275/ 240',
              }}
              m="auto"
            />
          )}

          <Heading as="h1" fontSize={'24px'} fontWeight={600} lineHeight={'36px'} mt={16} mb={8}>
            {text}
          </Heading>
          <Text
            as="p"
            fontSize={'16px'}
            fontWeight={500}
            lineHeight={'24px'}
            color="#76808F"
            mb={26}
            whiteSpace={'pre-line'}
          >
            {desc}
          </Text>
          <Link href={address ? InternalRoutePaths.dashboard : '/'} legacyBehavior passHref replace>
            <DCButton w={132} h={32} as="a" mb={40} fontSize={12} borderRadius={4}>
              {isNoBucket ? 'Back to Home' : 'Go to Home'}
            </DCButton>
          </Link>
        </Content>
      </Container>
      <Footer />
    </>
  );
}

export default ErrorComponent;
