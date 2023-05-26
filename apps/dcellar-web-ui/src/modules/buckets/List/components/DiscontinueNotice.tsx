import { Box, Flex, Link, Menu, MenuButton, MenuList, Text, Tooltip } from '@totejs/uikit';
import React from 'react';
import WaringTriangleIcon from '@/public/images/icons/warning-triangle.svg';

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
        <MenuButton>
          <WaringTriangleIcon />
        </MenuButton>
        <MenuList>
          <Box width={'280px'} padding="8px 12px">
            <Text fontSize={'14px'} fontWeight={'600'} marginBottom={'4px'}>
              Discontinue Notice
            </Text>
            <Text>{content}</Text>
            <Flex justifyContent={'right'}>
              <Link
                textDecoration={'underline'}
                color={'#1184EE'}
                _hover={{ color: '#1184EE' }}
                marginTop={'4px'}
                marginRight={0}
                href={learnMore}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(learnMore, '_blank', 'noopener noreferrer');
                }}
              >
                Learn More
              </Link>
            </Flex>
          </Box>
        </MenuList>
      </>
    </Menu>
  );
};
