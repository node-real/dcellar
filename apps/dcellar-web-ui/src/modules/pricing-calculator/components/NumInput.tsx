import { Input, InputProps } from '@node-real/uikit';

type NumInputProps = InputProps & {
  value: string;
  type?: 'inter' | 'float';
  onChangeValue: (value: string) => void;
};
export const NumInput = ({ value, type = 'float', onChangeValue, ...restProps }: NumInputProps) => {
  return (
    <Input
      type="number"
      w={200}
      h={44}
      fontSize={18}
      fontWeight="600 !important"
      {...restProps}
      value={value}
      borderRadius={4}
      onWheel={(e) => (e.target as HTMLElement).blur()}
      onPaste={(e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedData = parseFloat(clipboardData.getData('text'));
        if (pastedData < 0) {
          e.preventDefault();
        }
      }}
      onKeyPress={(e) => {
        if (e.code === 'Minus') {
          e.preventDefault();
        }
      }}
      onChange={(e) => {
        const value = e.target.value;
        // TODO opt it
        if (parseFloat(value) < 0 || value.length > 15) return;
        if (value === '') {
          onChangeValue(value);
        } else if (type === 'float') {
          if (value.includes('.')) {
            return onChangeValue(value.replace(/^00+/, '0') + '');
          }
          onChangeValue(Number(value.replace(/^00+/, '0')) + '');
        } else {
          onChangeValue(Number(value.replace(/\D/g, '0')) + '');
        }
      }}
    />
  );
};
