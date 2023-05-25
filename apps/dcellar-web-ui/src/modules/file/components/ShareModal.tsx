import {
  ModalCloseButton,
  ModalFooter,
  Button,
  Text,
  Flex,
  ModalBody,
  Center,
  useClipboard,
  Image,
} from '@totejs/uikit';
import React, { useEffect } from 'react';
import { ColoredSuccessIcon, CopyIcon } from '@totejs/icons';

import { COPY_SUCCESS_ICON } from '@/modules/file/constant';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';

interface modalProps {
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  buttonText?: string;
  description?: string;
  buttonOnClick?: () => void;
  shareLink?: string;
}

export const ShareModal = (props: modalProps) => {
  const {
    title = 'Share File',
    description = 'Share the link with your friends and start downloading directly.',
    onClose,
    isOpen,
    buttonText,
    buttonOnClick,
    shareLink = '',
  } = props;
  const currentShareLink = shareLink.replaceAll('/download/', '/view/');
  const { hasCopied, onCopy, setValue } = useClipboard(currentShareLink);

  useEffect(() => {
    setValue(currentShareLink);
  }, [setValue, currentShareLink]);

  return (
    <>
      <DCModal
        isOpen={isOpen}
        onClose={onClose}
        w="568px"
        gaShowName="dc.file.share_modal.0.show"
        gaClickCloseName="dc.file.share_modal.close.click"
      >
        <ModalCloseButton color="readable.tertiary" />
        <ModalBody fontWeight={600} fontSize={24} lineHeight="32px" mt={0}>
          <Text
            fontSize="24px"
            lineHeight={'36px'}
            fontWeight={600}
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
            {description}
          </Text>
          <Flex
            w={'100%'}
            h={'52px'}
            bg={'bg.bottom'}
            mt={'24px'}
            borderRadius={'8px'}
            overflow={'hidden'}
            borderWidth={'1px'}
            borderColor={'readable.border'}
          >
            <Flex flex={1} h={'52px'} overflowX={'auto'} alignItems={'center'} paddingX={'16px'}>
              <Text
                fontSize={'16px'}
                fontWeight={400}
                overflowX={'auto'}
                wordBreak={'break-all'}
                whiteSpace={'nowrap'}
                sx={{
                  '::-webkit-scrollbar': {
                    display: 'none',
                  },
                }}
              >
                {currentShareLink}
              </Text>
            </Flex>
            <GAClick name="dc.file.share_modal.copy_btn.click">
              <Flex
                bgColor="readable.brand6"
                _hover={{ bg: '#2EC659' }}
                h={'52px'}
                w={'90px'}
                alignItems="center"
                justifyContent={'center'}
                cursor="pointer"
                onClick={() => {
                  onCopy();
                }}
                fontSize={'14px'}
                color={'readable.white'}
              >
                {hasCopied ? (
                  <>
                    <Image alt="copy" src={COPY_SUCCESS_ICON} w="20px" mr={4} color={'white'} />
                    <Text fontWeight={500}>Copied</Text>
                  </>
                ) : (
                  <>
                    <CopyIcon w="20px" mr={4} />
                    <Text fontWeight={500}>Copy</Text>
                  </>
                )}
              </Flex>
            </GAClick>
          </Flex>
        </ModalBody>
        {buttonText && (
          <ModalFooter>
            (
            <DCButton variant={'dcPrimary'} w="100%" onClick={buttonOnClick}>
              {buttonText}
            </DCButton>
            )
          </ModalFooter>
        )}
      </DCModal>
    </>
  );
};
