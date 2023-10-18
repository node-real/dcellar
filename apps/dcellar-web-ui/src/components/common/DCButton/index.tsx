import { forwardRef } from 'react';
import { Button, ButtonProps, HTMLProps } from '@totejs/uikit';
import { buttonConfig } from '@/components/common/DCButton/style';
import { GAClick, GAShow } from '@/components/common/GATracker';

const { baseStyle, sizes, variants } = buttonConfig;

const isVariantKey = (variant: string): variant is keyof typeof variants => {
  return variant in variants;
};

const isSizeKey = (size: string): size is keyof typeof sizes => {
  return size in sizes;
};

export interface DCButtonProps extends ButtonProps {
  gaClickName?: string;
  gaClickData?: Record<string, any>;
  gaShowName?: string;
  gaShowData?: Record<string, any>;
}

export const DCButton = forwardRef<HTMLButtonElement, DCButtonProps>(function DCButton(props, ref) {
  const {
    size = 'md',
    variant = 'brand',
    gaClickName,
    gaClickData,
    gaShowName,
    gaShowData,
    ...restProps
  } = props;
  const buttonStyle = baseStyle.button as HTMLProps<'button'>;
  const variantStyle = isVariantKey(variant) ? variants[variant](props).button : {};
  // ignore response size value
  const _size = Array<any>().concat(size)[0];
  const sizeStyle = isSizeKey(_size) ? sizes[_size](props).button : {};

  return (
    <GAShow name={gaShowName} data={gaShowData}>
      <GAClick name={gaClickName} data={gaClickData} ref={ref}>
        <Button
          size={size}
          variant={variant}
          {...buttonStyle}
          {...variantStyle}
          {...sizeStyle}
          {...restProps}
        />
      </GAClick>
    </GAShow>
  );
});
