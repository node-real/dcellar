import { ModalProps } from '@totejs/uikit';
import React from 'react';
import { Modal } from '@totejs/uikit';
import { useLockBodyScroll } from 'react-use';
import { GAShow } from '@/components/common/GATracker';
import { reportEvent } from '@/utils/reportEvent';

export interface DCModalProps extends ModalProps {
  gaShowName?: string;
  gaShowData?: Record<string, any>;
  gaClickCloseName?: string;
}

export const DCModal = (props: DCModalProps) => {
  const { children, gaShowName, gaShowData, gaClickCloseName, onClose, ...restProps } = props;
  useLockBodyScroll(props.isOpen);

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
      <Modal
        closeOnOverlayClick={false}
        rootProps={{
          backdropFilter: 'blur(12px)',
        }}
        w={568}
        px={24}
        py={24}
        maxH="auto"
        sx={{
          '.ui-modal-close-button': {
            right: 24,
            top: 24,
          },
        }}
        onClose={onBeforeClose}
        {...restProps}
      >
        {children}
      </Modal>
    </GAShow>
  );
};
