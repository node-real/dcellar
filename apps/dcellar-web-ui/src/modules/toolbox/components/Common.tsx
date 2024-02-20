import { Center, CircleProps, Flex, FlexProps, LinkProps, Tooltip } from '@node-real/uikit';

export const Card = ({ children, ...props }: FlexProps) => {
  return (
    <Flex
      p={'24px 20px'}
      maxW={375}
      gap={16}
      border={'1px solid readable.border'}
      borderRadius={4}
      flexDirection={'column'}
      _hover={{
        border: '1px solid brand.brand6',
        cursor: 'pointer',
      }}
      {...props}
    >
      {children}
    </Flex>
  );
};

export const CircleLink = ({ children, href, title, ...props }: CircleProps & LinkProps) => {
  return (
    <Tooltip content={title}>
      <Center
        w={24}
        h={24}
        href={href}
        as={'a'}
        target={'_blank'}
        border={'1px solid readable.border'}
        borderRadius={12}
        _hover={{
          borderColor: 'brand.brand6',
          color: 'brand.brand6',
        }}
        {...props}
      >
        {children}
      </Center>
    </Tooltip>
  );
};
