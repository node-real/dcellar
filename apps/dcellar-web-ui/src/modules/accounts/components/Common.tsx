import { BoxProps, TextProps, Text, Box } from '@totejs/uikit';

export const CardContainer = ({ children, ...props }: BoxProps) => {
  return (
    <Box border={'1px solid readable.border'} borderRadius={4} padding={16} {...props}>
      {children}
    </Box>
  );
};
export const CardTitle = ({ children, ...props }: TextProps) => {
  return (
    <Text fontSize={16} fontWeight={700} {...props}>
      {children}
    </Text>
  );
};

export const CardTime = ({ children, ...props }: TextProps) => {
  return (
    <Text fontSize={12} fontWeight={500} color={'readable.tertiary'} {...props}>
      {children}
    </Text>
  );
};

export const CardCost = ({ children, ...props }: TextProps) => {
  return (
    <Text fontSize={24} fontWeight={700} {...props}>
      {children}
    </Text>
  );
};

export const SectionHeader = ({ children, ...props }: TextProps) => {
  return (
    <Text as={'h3'} fontSize={16} fontWeight={600} {...props}>
      {children}
    </Text>
  );
};
