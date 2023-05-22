import { Flex, ModalBody, ModalCloseButton, ModalFooter, Text } from '@totejs/uikit';
import React from 'react';
import { useMemo } from 'react';

import { OperationTypeContext } from '..';
import { Image } from '@totejs/uikit';
import SuccessIcon from '@/public/images/icons/success.svg';
import FailedIcon from '@/public/images/icons/failed.svg';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { PENDING_ICON_URL } from '@/modules/file/constant';

export type ModalProps = {
  onClose: () => void;
  viewTxUrl: string;
  isOpen: boolean;
  status: 'pending' | 'success' | 'failed';
};

const contentTexts = {
  pending: {
    icon: <Image src={PENDING_ICON_URL} w={'120px'} h={'120px'} alt={'pending'} />,
    title: 'Waiting for Confirmation',
    subtitle: 'Confirm this transaction in your wallet.',
  },
  success: {
    icon: <SuccessIcon />,
    title: 'Transaction Submitted',
    subtitle: '',
  },
  failed: {
    icon: <FailedIcon />,
    title: 'Transaction Failed',
    subtitle: '',
  },
};

export const StatusModal = ({ viewTxUrl, onClose, isOpen, status }: ModalProps) => {
  const { type: operationType } = React.useContext(OperationTypeContext);

  const gaOptions = getGAOptions(operationType, status);

  const FooterButton = useMemo(() => {
    if (status === 'pending') return null;
    if (status === 'failed') {
      return (
        <DCButton
          variant="dcPrimary"
          w="100%"
          onClick={onClose}
          gaClickName={gaOptions.tryAgainName}
        >
          Try Again
        </DCButton>
      );
    }
    if (status === 'success') {
      switch (operationType) {
        case 'transfer_in':
          return (
            <>
              <DCButton
                variant="dcGhost"
                as="a"
                /*@ts-ignore TODO how to inherit as function */
                target={'_blank'}
                href={viewTxUrl}
                gaClickName={gaOptions.nextActionName}
              >
                View in Explorer
              </DCButton>
              <DCButton variant="dcPrimary" onClick={onClose} gaClickName={gaOptions.tryAgainName}>
                Transfer Again
              </DCButton>
            </>
          );
        case 'transfer_out':
          return (
            <>
              <DCButton
                variant="dcGhost"
                /*@ts-ignore TODO how to inherit as function */
                target={'_blank'}
                href={viewTxUrl}
                as="a"
                gaClickName={gaOptions.nextActionName}
              >
                View in GreenfieldScan
              </DCButton>
              <DCButton variant="dcPrimary" onClick={onClose} gaClickName={gaOptions.tryAgainName}>
                Transfer Again
              </DCButton>
            </>
          );
        case 'send':
          return (
            <>
              <DCButton
                variant="dcGhost"
                as={'a'}
                /*@ts-ignore TODO how to inherit as function */
                target={'_blank'}
                href={viewTxUrl}
                gaClickName={gaOptions.nextActionName}
              >
                View in GreenfieldScan
              </DCButton>
              <DCButton variant="dcPrimary" onClick={onClose} gaClickName={gaOptions.tryAgainName}>
                Send Again
              </DCButton>
            </>
          );
        default:
          break;
      }
    }
  }, [gaOptions.nextActionName, gaOptions.tryAgainName, onClose, operationType, status, viewTxUrl]);

  const contentText = contentTexts[status];

  return (
    <DCModal
      isOpen={isOpen}
      minH="301px"
      onClose={onClose}
      gaShowName={gaOptions.showName}
      gaClickCloseName={gaOptions.closeName}
    >
      <ModalCloseButton />
      <ModalBody mt={0}>
        <Flex justifyContent={'center'} marginBottom="16px">
          {contentText?.icon}
        </Flex>
        <Text textAlign={'center'} fontSize={'24px'} fontWeight="600" marginBottom={'16px'}>
          {contentText?.title}
        </Text>
        {contentText?.subtitle && (
          <Text color="readable.tertiary" textAlign={'center'}>
            {contentText?.subtitle}
          </Text>
        )}
      </ModalBody>
      <ModalFooter marginTop="16px">{FooterButton}</ModalFooter>
    </DCModal>
  );
};

function getGAOptions(operationType: string, status: string): any {
  const options: Record<string, any> = {
    transfer_in: {
      pending: {
        showName: 'dc.wallet.transfering_modal.0.show',
        closeName: 'dc.wallet.transfering_modal.close.click',
      },
      failed: {
        showName: 'dc.wallet.transferin_fail.0.show',
        closeName: 'dc.wallet.transferin_fail.close.click',
        tryAgainName: 'dc.wallet.transferin_fail.again.click',
      },
      success: {
        showName: 'dc.wallet.transferin_submited.0.show',
        closeName: 'dc.wallet.transferin_submited.close.click',
        tryAgainName: 'dc.wallet.transferin_submited.again.click',
        nextActionName: 'dc.wallet.transferin_submited.bscscan.click',
      },
    },
    transfer_out: {
      pending: {
        showName: 'dc.wallet.transferout_modal.0.show',
        closeName: 'dc.wallet.transferout_modal.close.click',
      },
      failed: {
        showName: 'dc.wallet.transferout_fail.0.show',
        closeName: 'dc.wallet.transferout_fail.close.click',
        tryAgainName: 'dc.wallet.transferout_fail.again.click',
      },
      success: {
        showName: 'dc.wallet.transferout_submited.0.show',
        closeName: 'dc.wallet.transferout_submited.close.click',
        tryAgainName: 'dc.wallet.transferout_submited.again.click',
        nextActionName: 'dc.wallet.transferout_submited.gfscan.click',
      },
    },
    send: {
      pending: {
        showName: 'dc.wallet.sending_modal.0.show',
        closeName: 'dc.wallet.sending_modal.close.click',
      },
      failed: {
        showName: 'dc.wallet.send_fail.0.show',
        closeName: 'dc.wallet.send_fail.close.click',
        tryAgainName: 'dc.wallet.send_fail.again.click',
      },
      success: {
        showName: 'dc.wallet.send_submited.0.show',
        closeName: 'dc.wallet.send_submited.close.click',
        tryAgainName: 'dc.wallet.send_submited.again.click',
        nextActionName: 'dc.wallet.send_submited.gfscan.click',
      },
    },
  };

  return options[operationType]?.[status] ?? {};
}
