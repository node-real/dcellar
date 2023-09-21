import { ModalCloseButton, ModalBody, ModalFooter, Image, Text, Box } from '@totejs/uikit';

import {
  FILE_BOX_IMAGE_URL,
  FILE_STATUS_DOWNLOADING,
  FILE_TITLE_UPLOADING,
  FILE_TITLE_DOWNLOADING,
  FILE_TITLE_DELETING,
  FILE_TITLE_CANCELING,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_TITLE_DOWNLOAD_FAILED,
  FILE_TITLE_DELETE_FAILED,
  FILE_TITLE_CANCEL_FAILED,
  NOT_ENOUGH_QUOTA,
  FILE_TITLE_FILE_TOO_LARGE,
  FILE_TITLE_FILE_EMPTY,
  FILE_TITLE_FILE_NAME_ERROR,
  FILE_TITLE_SP_REJECTED,
  FOLDER_CREATING,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DotLoading } from '@/components/common/DotLoading';
import { DCButton } from '@/components/common/DCButton';

interface modalProps {
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  description?: string | JSX.Element;
  buttonText?: string;
  buttonOnClick?: () => void;
  errorText?: string;
  icon?: string;
}

export const FileStatusModal = (props: modalProps) => {
  const {
    title,
    onClose,
    isOpen,
    description,
    buttonText,
    buttonOnClick,
    errorText,
    icon = FILE_BOX_IMAGE_URL,
  } = props;

  const gaOptions = getGAOptions(title);

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w="568px"
      gaShowName={gaOptions.showName}
      gaClickCloseName={gaOptions.closeName}
    >
      <ModalCloseButton />
      <ModalBody
        flexDirection={'column'}
        alignItems={'center'}
        display={'flex'}
        mt={0}
        overflowY={'hidden'}
      >
        <Image src={icon} w="120px" h="120px" alt="" />
        <Text
          fontSize="24px"
          lineHeight={'36px'}
          fontWeight={600}
          marginTop="24px"
          align={'center'}
          color={'readable.normal'}
        >
          {title}
        </Text>
        <Text
          fontSize="16px"
          lineHeight={'20px'}
          fontWeight={400}
          marginTop="16px"
          align={'center'}
          color={'readable.secondary'}
        >
          {/* Sorry. This is a hack.*/}
          {description === FILE_STATUS_DOWNLOADING ? (
            <>
              {FILE_STATUS_DOWNLOADING.replace('...', '')}
              <Box display={'inline-block'} marginTop={'-0.1em'}>
                <DotLoading />
              </Box>
            </>
          ) : (
            description
          )}
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
      {buttonText && (
        <ModalFooter mt={24}>
          <DCButton w="100%" onClick={buttonOnClick} gaClickName={gaOptions.closeName}>
            {buttonText}
          </DCButton>
        </ModalFooter>
      )}
    </DCModal>
  );
};

function getGAOptions(title: string = '') {
  const options: Record<string, { showName: string; closeName: string }> = {
    [FILE_TITLE_UPLOADING]: {
      showName: 'dc.file.uploading_modal.0.show',
      closeName: 'dc.file.uploading_modal.close.click',
    },
    [FILE_TITLE_DOWNLOADING]: {
      showName: 'dc.file.downloading_modal.0.show',
      closeName: 'dc.file.downloading_modal.close.click',
    },
    [FILE_TITLE_DELETING]: {
      showName: 'dc.file.deleting_modal.0.show',
      closeName: 'dc.file.deleting_modal.close.click',
    },
    [FILE_TITLE_CANCELING]: {
      showName: 'dc.file.canceling_modal.0.show',
      closeName: 'dc.file.canceling_modal.close.click',
    },
    [FILE_TITLE_UPLOAD_FAILED]: {
      showName: 'dc.file.upload_fail_modal.0.show',
      closeName: 'dc.file.upload_fail_modal.close.click',
    },
    [FILE_TITLE_DOWNLOAD_FAILED]: {
      showName: 'dc.file.download_modal.0.show',
      closeName: 'dc.file.download_modal.close.click',
    },
    [FILE_TITLE_DELETE_FAILED]: {
      showName: 'dc.file.delete_fail_modal.0.show',
      closeName: 'dc.file.delete_fail_modal.close.click',
    },
    [FILE_TITLE_CANCEL_FAILED]: {
      showName: 'dc.file.cancel_modal.0.show',
      closeName: 'dc.file.cancel_modal.close.click',
    },
    [NOT_ENOUGH_QUOTA]: {
      showName: 'dc.file.no_quota_modal.0.show',
      closeName: 'dc.file.no_quota_modal.close.click',
    },
    [FILE_TITLE_FILE_TOO_LARGE]: {
      showName: 'dc.file.file_size_lg.0.show',
      closeName: 'dc.file.file_size_lg.close.click',
    },
    [FILE_TITLE_FILE_EMPTY]: {
      showName: 'dc.file.file_empty_modal.0.show',
      closeName: 'dc.file.file_empty_modal.close.click',
    },
    [FILE_TITLE_FILE_NAME_ERROR]: {
      showName: 'dc.file.file_name_error_modal.0.show',
      closeName: 'dc.file.file_name_error_modal.close.click',
    },
    [FILE_TITLE_SP_REJECTED]: {
      showName: 'dc.file.sp_reject.0.show',
      closeName: 'dc.file.sp_reject.close.click',
    },
    [FOLDER_CREATING]: {
      showName: 'dc.file.creating_folder_m.0.show',
      closeName: 'dc.file.creating_folder_m.close.click',
    },
  };

  return options[title] ?? {};
}
