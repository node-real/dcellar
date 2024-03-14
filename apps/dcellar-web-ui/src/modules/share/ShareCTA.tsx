import styled from '@emotion/styled';
import { Box, Text } from '@node-real/uikit';
import Link from 'next/link';

import { DCButton } from '@/components/common/DCButton';
import { DCLink } from '@/components/common/DCLink';
import { GAClick } from '@/components/common/GATracker';
import { IconFont } from '@/components/IconFont';

export const ShareCTA = () => {
  return (
    <Content>
      <IconFont type={'light-logo'} w={40} />
      <Text fontWeight={600} fontSize={16} lineHeight="19px" m={24}>
        Start your journey of BNB Greenfield decentralized data network with DCellar Now.🥳
      </Text>
      <Link href="/buckets" legacyBehavior passHref replace>
        <DCButton
          gaClickName="dc.shared_ui.preview.get_stated.click"
          variant="second"
          w={126}
          as="a"
          mb={12}
          padding={0}
        >
          Get Started
        </DCButton>
      </Link>
      <DCLink
        color={'readable.normal'}
        target="_blank"
        href="https://docs.nodereal.io/docs/dcellar-get-started"
      >
        <GAClick name="dc.shared_ui.preview.learn_more.click">
          <Box fontWeight={500} as="span" lineHeight="20px">
            Learn More
          </Box>
        </GAClick>
      </DCLink>
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
  flex-shrink: 0;
`;
