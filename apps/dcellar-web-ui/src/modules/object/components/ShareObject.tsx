import {
  Heading,
  Image,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Text,
  useClipboard,
} from '@totejs/uikit';
import React, { useEffect } from 'react';

import { COPY_SUCCESS_ICON } from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
// import { AccessItem } from '@/modules/file/components/AccessItem';
import { useAppDispatch, useAppSelector } from '@/store';
import { ObjectItem, setEditShare } from '@/store/slices/object';
import { encodeObjectName } from '@/utils/string';

interface modalProps {}

export const ShareObject = (props: modalProps) => {
  const dispatch = useAppDispatch();
  const { hasCopied, onCopy, setValue } = useClipboard('');
  const { editShare, bucketName } = useAppSelector((root) => root.object);
  const params = [bucketName, encodeObjectName(editShare.objectName)].join('/');
  const isOpen = !!editShare.objectName;
  const onClose = () => {
    dispatch(setEditShare({} as ObjectItem));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };

  useEffect(() => {
    setValue(`${location.origin}/share?file=${encodeURIComponent(params)}`);
  }, [setValue, params]);

  return (
    <>
      <DCModal
        isOpen={isOpen}
        onClose={onClose}
        w="568px"
        gaShowName="dc.file.share_m.0.show"
        gaClickCloseName="dc.file.share_modal.close.click"
      >
        <ModalCloseButton color="readable.tertiary" />
        <ModalBody fontWeight={600} fontSize={24} lineHeight="32px" mt={0}>
          <Heading
            as="div"
            fontSize={26}
            lineHeight={'36px'}
            fontWeight={600}
            align={'center'}
            color={'readable.normal'}
            display="flex"
            justifyContent="center"
            mb={32}
            ml={40}
            mr={40}
          >
            Share “
            {
              <Text
                fontWeight={600}
                as="div"
                flex={1}
                maxW="max-Content"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {editShare.name}
              </Text>
            }
            ”
          </Heading>
          <Text
            fontSize="16px"
            lineHeight={'20px'}
            fontWeight={400}
            marginTop="16px"
            align={'center'}
            color={'readable.secondary'}
          >
            Share the link with your friends and start downloading directly.
          </Text>
          {/*<AccessItem*/}
          {/*  value={shareObject.visibility as any}*/}
          {/*  onChange={(e) => onAccessChange(shareObject, e)}*/}
          {/*/>*/}
        </ModalBody>
        <ModalFooter>
          <GAClick name="dc.file.share_m.copy_link.click">
            <DCButton variant={'dcPrimary'} w="100%" onClick={onCopy}>
              {hasCopied ? (
                <>
                  <Image alt="copy" src={COPY_SUCCESS_ICON} w="20px" mr={4} color={'white'} />
                  <Text fontWeight={500}>Copied</Text>
                </>
              ) : (
                <>
                  <Text fontWeight={500}>Copy Link</Text>
                </>
              )}
            </DCButton>
          </GAClick>
        </ModalFooter>
      </DCModal>
    </>
  );
};
