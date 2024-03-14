import { DCButton } from '@/components/common/DCButton';

type MaxButtonProps = {
  disabled?: boolean;
  onMaxClick: () => void;
};
export const MaxButton = ({ disabled = false, onMaxClick }: MaxButtonProps) => {
  return (
    <DCButton
      variant="ghost"
      type="button"
      cursor={'pointer'}
      alignItems="flex-start"
      disabled={disabled}
      onClick={onMaxClick}
      h={18}
      fontWeight={600}
      fontSize={12}
      paddingX={8}
      borderRadius={9}
      color={'brand.brand6'}
    >
      Max
    </DCButton>
  );
};
