import React from 'react';
import { QDrawer, QDrawerProps } from '@totejs/uikit';
import { reportEvent } from '@/utils/reportEvent';
import { GAShow } from '../GATracker';
export interface DCDrawerProps extends QDrawerProps {
  gaShowName?: string;
  gaShowData?: Record<string, any>;
  gaClickCloseName?: string;
}
export const DCDrawer = (props: DCDrawerProps) => {
  const { children, gaShowName, gaShowData, gaClickCloseName, onClose, ...restProps } = props;

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
      <QDrawer closeOnOverlayClick={true} w={568} onClose={onBeforeClose} {...restProps}>
        {children}
      </QDrawer>
    </GAShow>
  );
};
