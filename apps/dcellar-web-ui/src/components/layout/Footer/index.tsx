import { Flex, FlexProps, Link, LinkProps, Text } from '@totejs/uikit';
import React from 'react';
import { getUTC0Year } from '@/utils/time';
import { GAClick } from '@/components/common/GATracker';
import { smMedia } from '@/modules/responsive';
import { InternalRoutePaths, NODEREAL_URL } from '@/constants/paths';

export const UnderlineLink = (props: LinkProps) => (
  <Link
    cursor="pointer"
    color="readable.tertiary"
    textDecoration={'underline'}
    target="_blank"
    _hover={{ color: 'brand.brand7' }}
    href={NODEREAL_URL}
    {...props}
  >
    {props.children}
  </Link>
);

export const Footer = (props: FlexProps) => {
  const utcYear = getUTC0Year();
  const { ...restProps } = props;

  return (
    <Flex
      alignItems={'center'}
      justifyContent={'center'}
      height={49}
      gridArea={'footer'}
      bgColor="bg.middle"
      color="readable.tertiary"
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
          <UnderlineLink href={NODEREAL_URL} target="_blank">
            NodeReal
          </UnderlineLink>
        </GAClick>
        . All rights reserved.
      </Text>
      <GAClick name="dc_lp.main.Footer.terms.click">
        <UnderlineLink href={InternalRoutePaths.terms} target="_blank">
          Terms of Use
        </UnderlineLink>
      </GAClick>
      <GAClick name="dc_lp.main.Footer.privacy.click">
        <UnderlineLink href={'https://nodereal.io/privacy-policy'} target="_blank">
          Privacy Policy
        </UnderlineLink>
      </GAClick>
    </Flex>
  );
};
