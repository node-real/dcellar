import { Flex, FlexProps, Link, LinkProps, Text } from '@totejs/uikit';
import React from 'react';
import { getUTC0Year } from '@/utils/time';
import { noderealUrl } from '@/utils/constant';
import { GAClick } from '@/components/common/GATracker';
import { useRouter } from 'next/router';
import { smMedia } from '@/modules/responsive';

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

  return (
    <Flex
      alignItems={'center'}
      justifyContent={'center'}
      height={49}
      gridArea={'footer'}
      bgColor="bg.middle"
      color="readable.secondary"
      gap={24}
      flexWrap={'wrap'}
      sx={{
        [smMedia]: {
          gap: '8px',
          padding: '12px 20px',
          height: 'auto',
        },
      }}
      {...restProps}
    >
      <Text
        color="inherit"
        sx={{
          [smMedia]: {
            width: '100%',
            textAlign: 'center',
          },
        }}
      >
        © {utcYear}&nbsp;
        <GAClick name={'dc_lp.main.footer.nodereal.click'}>
          <UnderlineLink href={noderealUrl}>NodeReal</UnderlineLink>
        </GAClick>
        . All rights reserved.
      </Text>
      <GAClick name="dc_lp.main.Footer.terms.click">
        <UnderlineLink href={noderealUrl}>Terms of Use</UnderlineLink>
      </GAClick>
      <GAClick name="dc_lp.main.Footer.privacy.click">
        <UnderlineLink href={noderealUrl}>Privacy Policy</UnderlineLink>
      </GAClick>
    </Flex>
  );
};

