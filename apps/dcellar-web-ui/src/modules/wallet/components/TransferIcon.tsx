import { Flex } from '@totejs/uikit';
import React from 'react';

import TransferSvgIcon from '@/public/images/icons/transfer.svg';

export const TransferIcon = ({
  onClick,
  ...props
}: {
  onClick: React.MouseEventHandler<HTMLDivElement>;
}) => {
  return (
    <Flex
      width={'28px'}
      height="28px"
      alignItems={'center'}
      justifyContent="center"
      border={'1px solid #EAECF0'}
      color="readable.primary"
      borderRadius={'50%'}
      mt="28px"
      cursor="pointer"
      _hover={{
        backgroundColor: 'readable.brand6',
        color: 'white',
        border: 'none',
      }}
      onClick={onClick}
      {...props}
    >
      <TransferSvgIcon />
    </Flex>
  );
};
