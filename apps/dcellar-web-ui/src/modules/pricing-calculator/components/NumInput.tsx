import { Input, InputProps } from '@totejs/uikit';
import React from 'react';

type NumInputProps = InputProps & {
  value: string;
  onChangeValue: (value: string) => void;
};
export const NumInput = ({ value, onChangeValue, ...restProps }: NumInputProps) => {
  return (
    <Input
      type="number"
      w={200}
      h={44}
      fontSize={18}
      fontWeight={600}
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
        if (parseFloat(value) < 0 || value.length >15 ) return;
        onChangeValue(value.replace(/^0+/, '') );
      }}
    />
  );
};
