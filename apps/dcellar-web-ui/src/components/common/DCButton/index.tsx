import { Button, ButtonProps, ButtonVariantType } from '@totejs/uikit';
import React from 'react';

import { ButtonConfig, DCVariants, TDCVariant } from './buttonConfig';
import { GAClick, GAShow } from '@/components/common/GATracker';

export interface DCButtonProps extends Omit<ButtonProps, 'variant'> {
  variant: ButtonVariantType | TDCVariant;

  gaClickName?: string;
  gaClickData?: Record<string, any>;
  gaShowName?: string;
  gaShowData?: Record<string, any>;
}

export const DCButton = (props: DCButtonProps) => {
  const { children, variant, gaClickName, gaClickData, gaShowName, gaShowData, ...restProps } =
    props;
  // TODO type protect
  const styles = ButtonConfig.variants[variant as TDCVariant] || {};
  const originalVariant = DCVariants.some((item) => item === variant)
    ? 'scene'
    : (variant as ButtonVariantType);

  return (
    <GAShow name={gaShowName} data={gaShowData}>
      <GAClick name={gaClickName} data={gaClickData}>
        <Button h="48px" fontWeight="500" variant={originalVariant} {...styles} {...restProps}>
          {children}
        </Button>
      </GAClick>
    </GAShow>
  );
};
