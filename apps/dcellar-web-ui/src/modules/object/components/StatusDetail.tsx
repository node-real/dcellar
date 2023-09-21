import { Box, Image, ModalBody, ModalCloseButton, ModalFooter, Text } from '@totejs/uikit';

import {
  FILE_BOX_IMAGE_URL,
  FILE_STATUS_DOWNLOADING,
  FILE_TITLE_CANCEL_FAILED,
  FILE_TITLE_CANCELING,
  FILE_TITLE_DELETE_FAILED,
  FILE_TITLE_DELETING,
  FILE_TITLE_DOWNLOAD_FAILED,
  FILE_TITLE_DOWNLOADING,
  FILE_TITLE_FILE_EMPTY,
  FILE_TITLE_FILE_NAME_ERROR,
  FILE_TITLE_FILE_TOO_LARGE,
  FILE_TITLE_SP_REJECTED,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_TITLE_UPLOADING,
  FOLDER_CREATING,
  NOT_ENOUGH_QUOTA,
} from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DotLoading } from '@/components/common/DotLoading';
import { DCButton } from '@/components/common/DCButton';
import { useAppDispatch, useAppSelector } from '@/store';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { memo, useEffect, useState } from 'react';
import { useUnmount } from 'ahooks';
import { OBJECT_ERROR_TYPES } from '@/modules/object/ObjectError';
import { setEditQuota } from '@/store/slices/bucket';

interface StatusDetailProps {}

export const StatusDetail = memo<StatusDetailProps>(function StatusDetail() {
  const dispatch = useAppDispatch();
  const _statusDetail = useAppSelector((root) => root.object.statusDetail);
  const { bucketName } = useAppSelector((root) => root.object);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const isOpen = !!_statusDetail?.title;
  const gaOptions = getGAOptions(_statusDetail.title);
  const [statusDetail, setInnerStatusDetail] = useState(_statusDetail);
  const quotaBucket = bucketName || statusDetail?.extraParams?.[0];
  const NO_QUOTA =
    OBJECT_ERROR_TYPES['NO_QUOTA'].title === statusDetail.title && !!quotaBucket && !!loginAccount;

  useEffect(() => {
    if (!_statusDetail.title) return;
    setInnerStatusDetail(_statusDetail);
  }, [_statusDetail]);

  const onClose = async () => {
    dispatch(setStatusDetail({} as TStatusDetail));
  };

  useUnmount(onClose);

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
        <Image src={statusDetail.icon || FILE_BOX_IMAGE_URL} w="120px" h="120px" alt="" />
        <Text
          fontSize="24px"
          lineHeight={'36px'}
          fontWeight={600}
          marginTop="24px"
          align={'center'}
          color={'readable.normal'}
        >
          {statusDetail.title}
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
          {statusDetail?.desc === FILE_STATUS_DOWNLOADING ? (
            <>
              {FILE_STATUS_DOWNLOADING.replace('...', '')}
              <Box display={'inline-block'} marginTop={'-0.1em'}>
                <DotLoading />
              </Box>
            </>
          ) : (
            statusDetail?.desc
          )}
        </Text>
        {statusDetail?.errorText && (
          <Text
            fontSize="14px"
            lineHeight={'16px'}
            fontWeight={400}
            marginTop="16px"
            align={'center'}
            color={'readable.tertiary'}
          >
            {statusDetail.errorText}
          </Text>
        )}
      </ModalBody>
      {(statusDetail.buttonText || NO_QUOTA) && (
        <ModalFooter mt={24}>
          <DCButton
            w="100%"
            onClick={() => {
              statusDetail.buttonOnClick?.();
              onClose();
              if (NO_QUOTA) {
                dispatch(setEditQuota([String(quotaBucket), 'modal']));
              }
            }}
            gaClickName={gaOptions.closeName}
          >
            {NO_QUOTA ? 'Increase Quota' : statusDetail.buttonText}
          </DCButton>
        </ModalFooter>
      )}
    </DCModal>
  );
});

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
