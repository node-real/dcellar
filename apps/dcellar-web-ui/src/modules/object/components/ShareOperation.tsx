import { useAppDispatch, useAppSelector } from '@/store';
import {
  Box,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
  useClipboard,
} from '@node-real/uikit';
import { memo, useEffect } from 'react';
// import Avatar0 from '@/components/common/SvgIcon/avatars/Avatar0.svg';
import { Animates } from '@/components/AnimatePng';
import { DCButton } from '@/components/common/DCButton';
import { Loading } from '@/components/common/Loading';
import { IconFont } from '@/components/IconFont';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { E_OFF_CHAIN_AUTH, ErrorMsg } from '@/facade/error';
import { getListObjects, updateObjectInfo } from '@/facade/object';
import { AccessItem } from '@/modules/object/components/AccessItem';
import { ViewerList } from '@/modules/object/components/ViewerList';
import { AUTH_EXPIRED, BUTTON_GOT_IT, WALLET_CONFIRM } from '@/modules/object/constant';
import { setObjectList, setObjectVisibility } from '@/store/slices/object';
import { SpEntity } from '@/store/slices/sp';
import { getShareLink } from '@/utils/string';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { useMount } from 'ahooks';
import { isEmpty, last, trimEnd } from 'lodash-es';
import { useAccount } from 'wagmi';
import { setSignatureAction } from '@/store/slices/global';

interface ShareOperationProps {
  selectObjectInfo: ObjectMeta;
  primarySp: SpEntity;
  objectName: string;
}

// ObjectName '' for share Bucket
export const ShareOperation = memo<ShareOperationProps>(function ShareOperation({
  selectObjectInfo,
  primarySp,
  objectName,
}) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);

  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { hasCopied, onCopy, setValue } = useClipboard('');

  const objectInfo = selectObjectInfo.ObjectInfo || {};
  // share bucket
  const bucketName = selectObjectInfo.ObjectInfo.BucketName || currentBucketName;

  const handleError = (msg: ErrorMsg) => {
    switch (msg) {
      case AUTH_EXPIRED:
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setSignatureAction({
            title: 'Updating Access',
            icon: 'status-failed',
            buttonText: BUTTON_GOT_IT,
            buttonOnClick: () => dispatch(setSignatureAction({})),
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
      setSignatureAction({
        icon: Animates.access,
        title: 'Updating Access',
        desc: WALLET_CONFIRM,
      }),
    );

    const [_, error] = await updateObjectInfo(payload, connector!);

    if (error) return handleError(error);
    dispatch(setSignatureAction({}));
    toast.success({ description: 'Access updated!' });
    dispatch(setObjectVisibility({ objectName: objectInfo.ObjectName, visibility }));
  };

  useMount(async () => {
    if (!objectName.endsWith('/') || objectName === '') return;
    const _query = new URLSearchParams();
    _query.append('delimiter', '/');
    _query.append('maxKeys', '2');
    _query.append('prefix', `${objectName}`);

    const params = {
      address: primarySp.operatorAddress,
      bucketName: bucketName,
      prefix: objectName,
      query: _query,
      endpoint: primarySp.endpoint,
      seedString: '',
    };

    const [res, error] = await getListObjects(params);
    // should never happen
    if (error || !res || res.code !== 0) return false;
    const { GfSpListObjectsByBucketNameResponse } = res.body!;
    // 更新文件夹objectInfo
    dispatch(
      setObjectList({
        path: completeCommonPrefix,
        list: GfSpListObjectsByBucketNameResponse || [],
        infoOnly: true,
      }),
    );
  });

  useEffect(() => {
    setValue(getShareLink(bucketName, objectInfo.ObjectName));
  }, [setValue, bucketName, objectInfo.ObjectName]);

  // handle folder object info
  if (isEmpty(selectObjectInfo) || objectName !== objectInfo?.ObjectName) return <Loading />;

  const name =
    objectInfo.ObjectName === ''
      ? objectInfo.BucketName
      : last(trimEnd(objectInfo.ObjectName, '/').split('/'));
  const isFolder = objectInfo.ObjectName.endsWith('/') || objectInfo.ObjectName === '';

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
        <Box mb={24}>
          <AccessItem folder={isFolder} value={objectInfo.Visibility} onChange={onAccessChange} />
        </Box>
        <Box mb={24}>
          <ViewerList selectObjectInfo={selectObjectInfo} />
        </Box>
      </QDrawerBody>
      <QDrawerFooter>
        <DCButton size="lg" width={'100%'} onClick={onCopy}>
          {hasCopied ? (
            <>
              <IconFont type={'colored-success2'} w={20} />
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
