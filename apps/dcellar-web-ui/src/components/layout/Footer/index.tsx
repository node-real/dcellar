import { Flex, Link, Text } from '@totejs/uikit';
import React from 'react';

import { getUtcYear } from '@/utils/getUtcYear';
import { noderealUrl } from '@/constants/links';
import { GAClick } from '@/components/common/GATracker';
import { useRouter } from 'next/router';

export const Footer = (props: any) => {
  const utcYear = getUtcYear();
  const { ...styleProps } = props;
  // const fixAtBottomStyle = fixAtBottom
  //   ? { position: 'fixed', bottom: 0, left: 0, right: 0 }
  //   : { position: 'absolute', bottom: 0, left: '269px', right: 0 };

  const { pathname } = useRouter();
  const gaClickName = getGAOptions(pathname);

  return (
    <Flex
      alignItems={'center'}
      justifyContent={'center'}
      height={'48px'}
      gridArea={'footer'}
      bgColor="bg.middle"
      {...styleProps}
    >
      <Text color={'readable.secondary'}>
        © {utcYear}&nbsp;
        <GAClick name={gaClickName}>
          <Link
            cursor="pointer"
            color="#76808F"
            textDecoration={'underline'}
            target="_blank"
            _hover={{ color: '#009E2C' }}
            href={noderealUrl}
          >
            NodeReal
          </Link>
        </GAClick>
        . All rights reserved.
      </Text>
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
