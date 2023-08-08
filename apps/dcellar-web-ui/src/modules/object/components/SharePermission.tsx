import React, { memo, ReactNode, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import {
  Box,
  Button,
  Flex,
  Image,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
  useClipboard,
} from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { VisibilityType } from '@/modules/file/type';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import PrivateFileIcon from '@/modules/file/components/PrivateFileIcon';
import { transientOptions } from '@/utils/transientOptions';
// import Avatar0 from '@/components/common/SvgIcon/avatars/Avatar0.svg';
import { DCDrawer } from '@/components/common/DCDrawer';
import { BackIcon } from '@totejs/icons';
import { AccessItem } from '@/modules/object/components/AccessItem';
import {
  ObjectItem,
  setStatusDetail,
  TStatusDetail,
  updateObjectVisibility,
} from '@/store/slices/object';
import { updateObjectInfo } from '@/facade/object';
import { useAccount } from 'wagmi';
import { E_OFF_CHAIN_AUTH, ErrorMsg } from '@/facade/error';
import {
  AUTH_EXPIRED,
  BUTTON_GOT_IT,
  COPY_SUCCESS_ICON,
  FILE_ACCESS,
  FILE_ACCESS_URL,
  FILE_FAILED_URL,
  FILE_STATUS_ACCESS,
} from '@/modules/file/constant';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { ViewerList } from '@/modules/object/components/ViewerList';
import { CopyButton } from '@/modules/object/components/CopyButton';
import { getShareLink } from '@/utils/string';
import ComingSoon from '@/components/common/SvgIcon/ComingSoon.svg';
import { DCButton } from '@/components/common/DCButton';

interface SharePermissionProps {}

const Access: Record<number, { icon: ReactNode; text: string; bg: string }> = {
  [VisibilityType.VISIBILITY_TYPE_PUBLIC_READ]: {
    icon: <PublicFileIcon fillColor={'#1E2026'} w={16} h={16} />,
    text: 'Public',
    bg: '#E7F3FD',
  },
  [VisibilityType.VISIBILITY_TYPE_PRIVATE]: {
    icon: <PrivateFileIcon fillColor={'#1E2026'} w={16} h={16} />,
    text: 'Private',
    bg: '#E6E8EA',
  },
};

export const SharePermission = memo<SharePermissionProps>(function SharePermission() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { editDetail, bucketName } = useAppSelector((root) => root.object);
  const { owner } = useAppSelector((root) => root.bucket);
  const [manageOpen, setManageOpen] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { hasCopied, onCopy, setValue } = useClipboard('');

  useEffect(() => {
    setValue(getShareLink(bucketName, editDetail.objectName));
  }, [setValue, bucketName, editDetail.objectName]);

  if (!editDetail.name) return <></>;

  const CurrentAccess = Access[editDetail.visibility] ? Access[editDetail.visibility] : Access[2];

  const handleError = (msg: ErrorMsg) => {
    switch (msg) {
      case AUTH_EXPIRED:
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: FILE_ACCESS,
            icon: FILE_FAILED_URL,
            buttonText: BUTTON_GOT_IT,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
            errorText: 'Error message: ' + msg,
          }),
        );
        return;
    }
  };

  const onAccessChange = async (item: ObjectItem, visibility: number) => {
    const payload = {
      operator: loginAccount,
      bucketName,
      objectName: item.objectName,
      visibility,
    };

    dispatch(
      setStatusDetail({
        icon: FILE_ACCESS_URL,
        title: FILE_ACCESS,
        desc: FILE_STATUS_ACCESS,
      }),
    );
    const [_, error] = await updateObjectInfo(payload, connector!);

    if (error) return handleError(error);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Access updated!' });
    dispatch(updateObjectVisibility({ object: item, visibility }));
  };

  return (
    <>
      <DCDrawer isOpen={manageOpen} onClose={() => setManageOpen(false)}>
        <QDrawerHeader alignItems="center">
          <BackIcon mr={8} cursor="pointer" onClick={() => setManageOpen(false)} />
          <Text
            flex={1}
            minW={0}
            as="div"
            fontSize={24}
            lineHeight="32px"
            fontWeight={600}
            alignItems="center"
            color={'readable.normal'}
            display="flex"
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
                {editDetail.name}
              </Text>
            }
            ”
          </Text>
        </QDrawerHeader>
        <QDrawerBody>
          <Box mt={8} mb={24}>
            <AccessItem
              value={editDetail.visibility}
              onChange={(e) => onAccessChange(editDetail, e)}
            />
          </Box>
          <Box mb={24}>
            <ViewerList />
          </Box>
          <Flex flexDirection="column" alignItems="center" mt={116}>
            <ComingSoon />
            <Text fontWeight="400" color="#76808F" mt={20}>
              Permission list will coming soon.
            </Text>
          </Flex>
        </QDrawerBody>
        <QDrawerFooter>
          <DCButton variant="dcPrimary" width={'100%'} onClick={onCopy}>
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
        </QDrawerFooter>
      </DCDrawer>
      {editDetail.objectStatus === 1 && owner && (
        <Container>
          <Title>Share with</Title>
          <AccessRow>
            <AccessType $bg={CurrentAccess.bg}>
              <span>{CurrentAccess.icon}</span>
              {CurrentAccess.text}
            </AccessType>
            <Flex gap={8} flex={1} />
            <ManageAccess onClick={() => setManageOpen(true)}>Manage Access</ManageAccess>
          </AccessRow>
          <Tip>Only people with access can open with the link.</Tip>
          <Box my={16}>
            <CopyButton text={getShareLink(bucketName, editDetail.objectName)}>
              Copy Link
            </CopyButton>
          </Box>
        </Container>
      )}
    </>
  );
});

const ManageAccess = styled(Button)`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid #e6e8ea;
  background: #fff;
  color: #474d57;
  height: 33px;

  :hover {
    background: #1e2026;
    color: #ffffff;
    border-color: #1e2026;
  }
`;

const AccessType = styled(Flex, transientOptions)<{ $bg: string }>`
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 4px;
  border-radius: 360px;
  border: 1px solid #e6e8ea;

  color: #1e2026;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;

  svg {
    width: 16px;
  }

  > span {
    padding: 4px;
    border-radius: 100%;
    background: ${(props) => props.$bg};
  }
`;

const AccessRow = styled(Flex)`
  margin: 8px 0;
  align-items: center;
  height: 48px;
`;

const Container = styled.div`
  margin: 24px 0;
`;

const Title = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  line-height: normal;
`;

const Tip = styled(Text)`
  color: #474d57;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`;
