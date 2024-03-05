import { IconFont } from '@/components/IconFont';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { InternalRoutePaths } from '@/constants/paths';
import { Box, CircleProps, Flex } from '@node-real/uikit';
import Link, { LinkProps } from 'next/link';

export const TransferIcon = ({ children, ...props }: CircleProps) => {
  return (
    <Flex
      w={32}
      h={32}
      alignItems={'center'}
      justifyContent={'center'}
      {...props}
      bg={'brand.normal'}
      borderRadius={16}
      color={'readable.white'}
      fontSize={20}
    >
      {children}
    </Flex>
  );
};

export const TransferButton = ({ children, ...restProps }: DCButtonProps & LinkProps) => {
  return (
    <DCButton
      as={Link}
      h={81}
      w={'100%'}
      p={0}
      borderRadius={4}
      border={'none'}
      flexDirection={'column'}
      placeItems={'center'}
      bgColor={'readable.white'}
      color={'readable.normal'}
      _hover={{
        bgColor: 'bg.bottom',
      }}
      {...restProps}
    >
      {children}
    </DCButton>
  );
};

export const TransferEntry = () => {
  const options = [
    {
      icon: 'in',
      label: 'Transfer In',
      link: InternalRoutePaths.transfer_in,
    },
    {
      icon: 'out',
      label: 'Transfer Out',
      link: InternalRoutePaths.transfer_out,
    },
    {
      icon: 'send',
      label: 'Send',
      link: InternalRoutePaths.send,
    },
  ];

  return (
    <Flex alignItems="center" mt="16px" width="100%" mb="12px" justifyContent="space-between">
      {options.map((item, index) => (
        <TransferButton
          key={index}
          href={item.link}
          gaClickName={`dc.main.account.${item.label.replace(' ', '').toLowerCase()}.click`}
        >
          <TransferIcon>
            <IconFont type={item.icon} />
          </TransferIcon>
          <Box fontWeight={500} fontSize="14px" marginTop={8}>
            {item.label}
          </Box>
        </TransferButton>
      ))}
    </Flex>
  );
};
