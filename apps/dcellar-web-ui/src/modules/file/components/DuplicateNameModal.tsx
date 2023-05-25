import { ModalCloseButton, ModalBody, ModalFooter, Button, Image, Text } from '@totejs/uikit';

import { FILE_BOX_IMAGE_URL, FILE_FAILED_URL } from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';

interface modalProps {
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  description?: string;
  buttonText?: string;
  buttonOnClick?: () => void;
  errorText?: string;
  icon?: string;
}

export const DuplicateNameModal = (props: modalProps) => {
  const {
    title,
    onClose,
    isOpen,
    description,
    buttonText,
    buttonOnClick,
    errorText,
    icon = FILE_FAILED_URL,
  } = props;
  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w="568px"
      gaShowName="dc.file.duplicate_name_modal.0.show"
      gaClickCloseName="dc.file.duplicate_name_modal.close.click"
    >
      <ModalCloseButton />
      <ModalBody flexDirection={'column'} alignItems={'center'} display={'flex'} mt={0}>
        <Image src={icon} w="120px" h="120px" alt="" />
        <Text
          fontSize="24px"
          lineHeight={'36px'}
          fontWeight={600}
          marginTop="24px"
          align={'center'}
          color={'readable.normal'}
        >
          File Name is Duplicated
        </Text>
        <Text
          fontSize="16px"
          lineHeight={'20px'}
          fontWeight={400}
          marginTop="16px"
          align={'center'}
          color={'readable.secondary'}
        >
          {description}
        </Text>
        {errorText && (
          <Text
            fontSize="14px"
            lineHeight={'16px'}
            fontWeight={400}
            marginTop="16px"
            align={'center'}
            color={'readable.tertiary'}
          >
            {errorText}
          </Text>
        )}
      </ModalBody>
      <ModalFooter>
        <DCButton
          variant={'dcGhost'}
          flex={1}
          onClick={onClose}
          gaClickName="dc.file.duplicate_name_modal.cancel.click"
        >
          Cancel
        </DCButton>
        <DCButton
          variant={'dcPrimary'}
          flex={1}
          onClick={buttonOnClick}
          gaClickName="dc.file.duplicate_name_modal.confirm.click"
        >
          Keep Both Files
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
