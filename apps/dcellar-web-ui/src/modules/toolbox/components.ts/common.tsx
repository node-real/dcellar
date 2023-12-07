import { Flex, FlexProps } from '@totejs/uikit';

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
