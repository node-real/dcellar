import { Box, Flex, ModalBody, ModalCloseButton, ModalFooter, Text } from '@node-real/uikit';
import { DCButton } from '../common/DCButton';
import { DCModal } from '../common/DCModal';
import { Step } from '@/components/RenewalNotification/Step';
import { useRouter } from 'next/router';
import { InternalRoutePaths } from '@/constants/paths';

const STEP_DATA = [
  {
    num: 1,
    description: 'Transfer in enough BNB to your Owner Account.',
  },
  {
    num: 2,
    description:
      'Deposit BNB from your Owner Account to your Payment Account which shares the same address with your Payment Account.',
  },
];

export type RenewalGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
export const RenewalGuideModal = ({ isOpen, onClose }: RenewalGuideModalProps) => {
  const router = useRouter();
  const onNavigate = (path: string) => {
    router.push(path);
  };
  return (
    <DCModal isOpen={isOpen} onClose={onClose} gaShowName="dc.renewal.modal.0.show">
      <ModalCloseButton />
      <ModalBody textAlign={'center'} mt={0}>
        <Text fontSize={'24px'} fontWeight={600} lineHeight="150%" marginBottom={'8px'}>
          DCellar Renewal Guide
        </Text>
        <Text color="#76808F" fontSize={'16px'} fontWeight="400">
          Your Owner Account has been frozen due to insufficient funds. The Payment Account
          associated with the same address has also had its bucket restricted in service. Follow the
          following steps to unfreeze your account and restore your data service.
        </Text>
        <Flex flexDir={'column'} marginTop={32}>
          {STEP_DATA.map((step, index) => {
            return (
              <>
                <Step {...step} />
                {index !== STEP_DATA.length - 1 && (
                  <Box
                    height={'32px'}
                    w={'1px'}
                    borderLeft={'1px dotted #AEB4BC'}
                    marginLeft={'9px'}
                  />
                )}
              </>
            );
          })}
        </Flex>
      </ModalBody>
      <ModalFooter flexDirection={'column'} mt={32} gap={16}>
        <DCButton
          size="md"
          gaClickName="dc.wrongnet.gf_modal.swithtogf.click"
          width={'100%'}
          onClick={() => {
            onNavigate(InternalRoutePaths.transfer_in);
          }}
        >
          Transfer In
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
