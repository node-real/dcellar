import React, { memo, useEffect } from 'react';
import {
  Box,
  Image,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
  useClipboard,
} from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
// import Avatar0 from '@/components/common/SvgIcon/avatars/Avatar0.svg';
import { AccessItem } from '@/modules/object/components/AccessItem';
import { setStatusDetail, TStatusDetail, updateObjectVisibility } from '@/store/slices/object';
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
} from '@/modules/object/constant';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { ViewerList } from '@/modules/object/components/ViewerList';
import { getShareLink } from '@/utils/string';
import { DCButton } from '@/components/common/DCButton';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { last } from 'lodash-es';

interface ShareOperationProps {
  selectObjectInfo: ObjectMeta;
}

export const ShareOperation = memo<ShareOperationProps>(function ShareOperation({
  selectObjectInfo,
}) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bucketName } = useAppSelector((root) => root.object);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { hasCopied, onCopy, setValue } = useClipboard('');
  const objectInfo = selectObjectInfo.ObjectInfo;
  const name = last(objectInfo.ObjectName.split('/'));

  useEffect(() => {
    setValue(getShareLink(bucketName, objectInfo.ObjectName));
  }, [setValue, bucketName, objectInfo.ObjectName]);

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

  const onAccessChange = async (visibility: number) => {
    const payload = {
      operator: loginAccount,
      bucketName,
      objectName: objectInfo.ObjectName,
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
    dispatch(updateObjectVisibility({ objectName: objectInfo.ObjectName, visibility }));
  };

  return (
    <>
      <QDrawerHeader alignItems="center">
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
          pr={30}
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
              {name}
            </Text>
          }
          ”
        </Text>
      </QDrawerHeader>
      <QDrawerBody>
        <Box mt={8} mb={24}>
          <AccessItem value={objectInfo.Visibility} onChange={onAccessChange} />
        </Box>
        <Box mb={24}>
          <ViewerList selectObjectInfo={selectObjectInfo} />
        </Box>
      </QDrawerBody>
      <QDrawerFooter>
        <DCButton size="lg" width={'100%'} onClick={onCopy}>
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
    </>
  );
});
