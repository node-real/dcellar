import { Box, Flex, Menu, MenuButton, MenuList, Text } from '@node-real/uikit';
import React from 'react';
import { DCLink } from '@/components/common/DCLink';
import { IconFont } from '@/components/IconFont';

export const DiscontinueNotice = ({
  content,
  learnMore,
}: {
  content: string;
  learnMore: string;
}) => {
  return (
    <Menu strategy="fixed" trigger="hover" placement="right-start">
      <>
        <MenuButton onClick={(e) => e.stopPropagation()}>
          <IconFont type="colored-error2" w={16} />
        </MenuButton>
        <MenuList>
          <Box width={'280px'} padding="8px 12px" onClick={(e) => e.stopPropagation()}>
            <Text fontSize={'14px'} fontWeight={'600'} marginBottom={'4px'}>
              Discontinue Notice
            </Text>
            <Text>{content}</Text>
            <Flex justifyContent={'right'}>
              <DCLink href={learnMore} target="_blank" onClick={(e) => e.stopPropagation()}>
                Learn More
              </DCLink>
            </Flex>
          </Box>
        </MenuList>
      </>
    </Menu>
  );
};
