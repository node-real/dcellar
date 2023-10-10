import React from 'react';
import { QDrawer, QDrawerCloseButton, QDrawerProps } from '@totejs/uikit';
import { GAShow } from '../GATracker';
import { reportEvent } from '@/utils/gtag';
export interface DCDrawerProps extends QDrawerProps {
  gaShowName?: string;
  gaShowData?: Record<string, any>;
  gaClickCloseName?: string;
  showCloseBtn?: boolean;
}
export const DCDrawer = (props: DCDrawerProps) => {
  const {
    children,
    gaShowName,
    gaShowData,
    gaClickCloseName,
    onClose,
    showCloseBtn = true,
    ...restProps
  } = props;

  const onBeforeClose = () => {
    if (gaClickCloseName) {
      reportEvent({
        name: gaClickCloseName,
      });
    }
    onClose?.();
  };

  return (
    <GAShow isShow={props.isOpen} name={gaShowName} data={gaShowData}>
      <QDrawer
        closeOnOverlayClick={false}
        w={568}
        padding="16px 24px"
        onClose={onBeforeClose}
        rootProps={{ top: 65 }}
        {...restProps}
      >
        {showCloseBtn && <QDrawerCloseButton top={16} right={24} color="readable.tertiary" />}
        {children}
      </QDrawer>
    </GAShow>
  );
};
