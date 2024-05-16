import {
  Center,
  CircleProps,
  Flex,
  FlexProps,
  LinkProps,
  Tooltip,
  useMediaQuery,
} from '@node-real/uikit';

export const Card = ({ children, ...props }: FlexProps) => {
  const [isNormal] = useMediaQuery('(max-width: 1440px)');
  return (
    <Flex
      p={'24px 20px'}
      minW={isNormal ? '48%' : '32%'}
      flex={isNormal ? '0 0 48%' : '0 0 32%'}
      w={'100%'}
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
