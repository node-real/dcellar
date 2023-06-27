import { Loading } from '@/components/common/Loading';
import { Center, Flex, FlexProps } from '@totejs/uikit';

export interface WalletItemProps extends FlexProps {
  icon: React.ReactNode;
  name: React.ReactNode;
  isDisabled: boolean;
  isActive: boolean;
}

export function WalletItem(props: WalletItemProps) {
  const { icon, name, isDisabled, isActive, onClick, ...restProps } = props;

  const onBeforeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) {
      return;
    }
    onClick?.(e);
  };

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      h={68}
      borderRadius={8}
      borderWidth={2}
      borderColor={isActive ? 'readable.brand6' : 'transparent'}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      _hover={{
        borderColor: isDisabled && !isActive ? 'transparent' : 'readable.brand6',
      }}
      bg="bg.bottom"
      position="relative"
      fontSize={18}
      lineHeight="22px"
      fontWeight={600}
      transitionDuration="normal"
      transitionProperty="colors"
      onClick={onBeforeClick}
      _notLast={{
        mb: 16,
      }}
      {...restProps}
    >
      <Center position="absolute" left={16}>
        {icon}
      </Center>
      {name}
      {isActive && <Loading position="absolute" boxSize={24} right={24} />}
    </Flex>
  );
}
