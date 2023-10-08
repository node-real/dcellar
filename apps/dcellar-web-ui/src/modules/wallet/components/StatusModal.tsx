import { Flex, ModalBody, ModalCloseButton, ModalFooter, Text } from '@totejs/uikit';
import React, { memo, useMemo } from 'react';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { useAppSelector } from '@/store';
import { AnimatePng } from '@/components/AnimatePng';
import { IconFont } from '@/components/IconFont';

const contentTexts = {
  pending: {
    icon: <AnimatePng type="object" />,
    title: 'Waiting for Confirmation',
    subtitle: 'Confirm this transaction in your wallet.',
  },
  success: {
    icon: <IconFont w={120} type="status-success" />,
    title: 'Transaction Submitted',
    subtitle: '',
  },
  failed: {
    icon: <IconFont w={120} type="status-failed" />,
    title: 'Transaction Failed',
    subtitle: '',
  },
};

interface StatusModalProps {
  onClose: () => void;
  viewTxUrl: string;
  isOpen: boolean;
  errorMsg?: string;
  status: 'pending' | 'success' | 'failed';
}

export const StatusModal = memo<StatusModalProps>(function StatusModal({
  viewTxUrl,
  onClose,
  isOpen,
  status,
  errorMsg,
}) {
  const { transType } = useAppSelector((root) => root.wallet);

  const gaOptions = getGAOptions(transType, status);

  const FooterButton = useMemo(() => {
    if (status === 'pending') return null;
    if (status === 'failed') {
      return (
        <DCButton w="100%" onClick={onClose} gaClickName={gaOptions.tryAgainName}>
          Try Again
        </DCButton>
      );
    }
    if (status === 'success') {
      switch (transType) {
        case 'transfer_in':
          return (
            <>
              <DCButton
                size={'lg'}
                variant="ghost"
                as="a"
                /*@ts-ignore TODO how to inherit as function */
                target={'_blank'}
                href={viewTxUrl}
                gaClickName={gaOptions.nextActionName}
              >
                View in Explorer
              </DCButton>
              <DCButton size={'lg'} onClick={onClose} gaClickName={gaOptions.tryAgainName}>
                Transfer Again
              </DCButton>
            </>
          );
        case 'transfer_out':
          return (
            <>
              <DCButton
                size={'lg'}
                variant="ghost"
                /*@ts-ignore TODO how to inherit as function */
                target={'_blank'}
                href={viewTxUrl}
                as="a"
                gaClickName={gaOptions.nextActionName}
              >
                View in GreenfieldScan
              </DCButton>
              <DCButton onClick={onClose} gaClickName={gaOptions.tryAgainName}>
                Transfer Again
              </DCButton>
            </>
          );
        case 'send':
          return (
            <>
              <DCButton
                size={'lg'}
                variant="ghost"
                as={'a'}
                /*@ts-ignore TODO how to inherit as function */
                target={'_blank'}
                href={viewTxUrl}
                gaClickName={gaOptions.nextActionName}
              >
                View in GreenfieldScan
              </DCButton>
              <DCButton size={'lg'} onClick={onClose} gaClickName={gaOptions.tryAgainName}>
                Send Again
              </DCButton>
            </>
          );
        default:
          break;
      }
    }
  }, [gaOptions.nextActionName, gaOptions.tryAgainName, onClose, transType, status, viewTxUrl]);

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
        {contentText?.subtitle ? (
          <Text color="readable.tertiary" textAlign={'center'}>
            {contentText?.subtitle}
          </Text>
        ) : !!errorMsg && status === 'failed' ? (
          errorMsg
        ) : null}
      </ModalBody>
      <ModalFooter marginTop="16px">{FooterButton}</ModalFooter>
    </DCModal>
  );
});

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
