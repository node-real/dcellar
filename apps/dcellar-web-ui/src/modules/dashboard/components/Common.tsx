import { IconFont } from '@/components/IconFont';
import { Circle, Flex, FlexProps, Text, TextProps } from '@node-real/uikit';

export type CardProps = FlexProps;

export const Card = ({ children, ...restProps }: CardProps) => {
  return (
    <Flex
      border="1px solid readable.border"
      flexDirection={'column'}
      borderRadius={4}
      p={16}
      gap={16}
      {...restProps}
    >
      {children}
    </Flex>
  );
};

export const CardTitle = ({ children, ...restProps }: TextProps) => {
  return (
    <Text fontSize={16} fontWeight={700} {...restProps}>
      {children}
    </Text>
  );
};

export const CircleIcon = ({ icon }: { icon: string }) => {
  return (
    <Circle size={36} bg={'opacity1'}>
      <IconFont type={icon} w={24} />
    </Circle>
  );
};
