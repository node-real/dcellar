import { Box, Flex, Text } from '@node-real/uikit';

export type StepProps = {
  num: number;
  description: string;
};
export const Step = ({ num, description }: StepProps) => {
  return (
    <Flex gap={12} position={'relative'} textAlign={'left'}>
      <Flex
        width={'18px'}
        height={'18px'}
        bg={'opacity1'}
        borderRadius={'9px'}
        justifyContent={'center'}
        alignItems={'center'}
        flexShrink={0}
      >
        <Box width={8} height={8} borderRadius={4} bg={'brand.brand6'} />
      </Flex>
      <Text fontWeight={500} flexShrink={0}>
        Step {num}
      </Text>
      <Text>{description}</Text>
    </Flex>
  );
};
