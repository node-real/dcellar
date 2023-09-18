import { Flex, FlexProps, Link, LinkProps, Text } from '@totejs/uikit';
import React from 'react';
import { getUTC0Year } from '@/utils/getUTC0Year';
import { noderealUrl } from '@/constants/links';
import { GAClick } from '@/components/common/GATracker';
import { useRouter } from 'next/router';

export const UnderlineLink = (props: LinkProps) => (
  <Link
    cursor="pointer"
    color="readable.tertiary"
    textDecoration={'underline'}
    target="_blank"
    _hover={{ color: 'readable.brand7' }}
    href={noderealUrl}
    {...props}
  >
    {props.children}
  </Link>
);

export const Footer = (props: FlexProps) => {
  const utcYear = getUTC0Year();
  const { ...restProps } = props;
  const { pathname } = useRouter();
  const gaClickName = getGAOptions(pathname);

  return (
    <Flex
      alignItems={'center'}
      justifyContent={'center'}
      height={49}
      gridArea={'footer'}
      bgColor="bg.middle"
      color="readable.secondary"
      gap={24}
      {...restProps}
    >
      <Text color="inherit">
        © {utcYear}&nbsp;
        <GAClick name={gaClickName}>
          <UnderlineLink href={noderealUrl}>NodeReal</UnderlineLink>
        </GAClick>
        . All rights reserved.
      </Text>
      <UnderlineLink href={noderealUrl}>Terms of Use</UnderlineLink>
      <UnderlineLink href={noderealUrl}>Privacy Policy</UnderlineLink>
    </Flex>
  );
};

function getGAOptions(pathname: string) {
  switch (true) {
    case pathname === '/':
      return 'dc.welcome.main.nodereal.click';
    default:
      return 'dc.main.footer.nodereal.click';
  }
}
