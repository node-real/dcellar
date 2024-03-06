import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { CreateObjectApprovalRequest } from '@bnb-chain/greenfield-js-sdk';
import styled from '@emotion/styled';
import {
  Box,
  Flex,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  toast,
} from '@node-real/uikit';
import { useAsyncEffect, useScroll, useUnmount } from 'ahooks';
import cn from 'classnames';
import { parseEther } from 'ethers/lib/utils.js';
import { isEmpty, round, toPairs, trimEnd } from 'lodash-es';
import { memo, useMemo, useRef, useState } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { useAccount } from 'wagmi';

import AccessItem from './AccessItem';
import { Fees } from './Fees';
import { ListItem } from './ListItem';
import { useUploadTab } from './useUploadTab';
import { useChecksumApi } from '../checksum';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../object/ObjectError';
import { genCreateObjectTx } from '../object/utils/genCreateObjectTx';

import { Animates } from '@/components/AnimatePng';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { getValidTags } from '@/components/common/ManageTags';
import { IconFont } from '@/components/IconFont';
import { reverseVisibilityType } from '@/constants/legacy';
import { broadcastTx, resolve } from '@/facade/common';
import {
  E_FILE_IS_EMPTY,
  E_FILE_TOO_LARGE,
  E_FOLDER_NAME_TOO_LONG,
  E_FULL_OBJECT_NAME_TOO_LONG,
  E_MAX_FOLDER_DEPTH,
  E_OBJECT_NAME_CONTAINS_SLASH,
  E_OBJECT_NAME_EMPTY,
  E_OBJECT_NAME_EXISTS,
  E_OBJECT_NAME_NOT_UTF8,
  E_OBJECT_NAME_TOO_LONG,
  E_UNKNOWN,
  createTxFault,
} from '@/facade/error';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { MAX_FOLDER_LEVEL } from '@/modules/object/components/CreateObject';
import { BUTTON_GOT_IT, FILE_TITLE_UPLOAD_FAILED, WALLET_CONFIRM } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  UPLOADING_STATUSES,
  WaitObject,
  addSignedTasksToUploadQueue,
  addTasksToUploadQueue,
  addToWaitQueue,
  resetWaitQueue,
  setSignatureAction,
  setTaskManagement,
  setupWaitTaskErrorMsg,
  updateWaitObjectStatus,
} from '@/store/slices/global';
import {
  SELECT_OBJECT_NUM_LIMIT,
  SINGLE_OBJECT_MAX_SIZE,
  TEditUploadContent,
} from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { SpEntity } from '@/store/slices/sp';
import { isUTF8 } from '@/utils/coder';
import {
  DragItemProps,
  DragMonitorProps,
  TransferItemTree,
  traverseTransferItems,
} from '@/utils/dom';
import { formatBytes } from '@/utils/formatter';
import { getTimestamp } from '@/utils/time';
import { setTempAccountRecords } from '@/store/slices/accounts';
import { createTempAccount } from '@/facade/account';

const defaultScroll = { top: 0 };
const defaultActionParams = {} as TEditUploadContent;

interface UploadObjectsOperationProps {
  onClose?: () => void;
  actionParams?: TEditUploadContent;
  primarySp: SpEntity;
}

export const UploadObjectsOperation = memo<UploadObjectsOperationProps>(
  function UploadObjectsOperation({
    onClose = () => {},
    actionParams = defaultActionParams,
    primarySp,
  }) {
    const dispatch = useAppDispatch();
    const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
    const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
    const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
    const objectCommonPrefix = useAppSelector((root) => root.object.objectCommonPrefix);
    const objectListRecords = useAppSelector((root) => root.object.objectListRecords);
    const pathSegments = useAppSelector((root) => root.object.pathSegments);
    const objectEditTagsData = useAppSelector((root) => root.object.objectEditTagsData);
    const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const objectWaitQueue = useAppSelector((root) => root.global.objectWaitQueue);
    const storeFeeParams = useAppSelector((root) => root.global.storeFeeParams);
    const objectUploadQueue = useAppSelector((root) => root.global.objectUploadQueue);

    const checksumApi = useChecksumApi();
    const [visibility, setVisibility] = useState<VisibilityType>(
      VisibilityType.VISIBILITY_TYPE_PRIVATE,
    );
    const { connector } = useAccount();
    const [creating, setCreating] = useState(false);
    const { tabOptions, activeKey, setActiveKey } = useUploadTab();
    const ref = useRef(null);
    const scroll = useScroll(ref) || defaultScroll;
    const bucket = bucketRecords[currentBucketName];
    const { loading: loadingSettlementFee } = useSettlementFee(bucket.PaymentAddress);

    const selectedFiles = objectWaitQueue;
    const objectList = objectListRecords[completeCommonPrefix] || [];
    const validTags = getValidTags(objectEditTagsData);
    const loading = useMemo(() => {
      return selectedFiles.some((item) => item.status === 'CHECK') || isEmpty(storeFeeParams);
    }, [storeFeeParams, selectedFiles]);
    const checkedQueue = selectedFiles.filter((item) => item.status === 'WAIT');
    const objectListObjectNames = objectList.map(
      (item) => currentBucketName + '/' + item.objectName,
    );
    const uploadingObjectNames = (objectUploadQueue?.[loginAccount] || [])
      .filter((item) => UPLOADING_STATUSES.includes(item.status))
      .map((item) => {
        return [
          item.bucketName,
          ...item.prefixFolders,
          item.waitObject.relativePath,
          item.waitObject.name,
        ]
          .filter((item) => !!item)
          .join('/');
      });

    const getErrorMsg = (type: string) => {
      return OBJECT_ERROR_TYPES[type as ObjectErrorType]
        ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
        : OBJECT_ERROR_TYPES[E_UNKNOWN];
    };

    const closeModal = () => {
      onClose();
      dispatch(setSignatureAction({}));
    };

    const validateFolder = (waitObject: WaitObject) => {
      const { file: folder, relativePath } = waitObject;
      if (!folder.name) {
        return E_FILE_IS_EMPTY;
      }
      const lastFolder = folder.name
        .split('/')
        .filter((item) => item !== '')
        .pop();
      if (lastFolder && lastFolder.length > 70) {
        return E_FOLDER_NAME_TOO_LONG;
      }
      const depth = trimEnd([objectCommonPrefix, relativePath, folder.name].join('/'), '/').split(
        '/',
      ).length;
      if (depth > MAX_FOLDER_LEVEL) {
        return E_MAX_FOLDER_DEPTH;
      }
      const fullObjectName = [completeCommonPrefix, relativePath, folder.name]
        .filter((item) => !!item)
        .join('/');
      const isExistObjectList = objectListObjectNames.includes(fullObjectName);
      const isExistUploadList = uploadingObjectNames.includes(fullObjectName);

      if (isExistObjectList || (!isExistObjectList && isExistUploadList)) {
        return E_OBJECT_NAME_EXISTS;
      }
      // Validation only works to data within the current path. The root folder has been validated when selected files. So there is no need to validate it again.
      return '';
    };

    const validateFile = (waitObject: WaitObject) => {
      const { relativePath, file } = waitObject;
      if (!file) {
        return E_FILE_IS_EMPTY;
      }
      if (file.size > SINGLE_OBJECT_MAX_SIZE) {
        return E_FILE_TOO_LARGE;
      }
      if (file.size <= 0) {
        return E_FILE_IS_EMPTY;
      }
      if (!file.name) {
        return E_OBJECT_NAME_EMPTY;
      }
      if (file.name.length > 256) {
        return E_OBJECT_NAME_TOO_LONG;
      }
      const fullPathObject = objectCommonPrefix + '/' + relativePath + '/' + file.name;
      if (fullPathObject.length > 1024) {
        return E_FULL_OBJECT_NAME_TOO_LONG;
      }
      if (!isUTF8(file.name)) {
        return E_OBJECT_NAME_NOT_UTF8;
      }
      if (file.name.includes('//')) {
        return E_OBJECT_NAME_CONTAINS_SLASH;
      }
      // Validation only works to data within the current path.
      const fullObjectName = [completeCommonPrefix, relativePath, file.name]
        .filter((item) => !!item)
        .join('/');
      const isExistObjectList = objectListObjectNames.includes(fullObjectName);
      const isExistUploadList = uploadingObjectNames.includes(fullObjectName);

      if (isExistObjectList || (!isExistObjectList && isExistUploadList)) {
        return E_OBJECT_NAME_EXISTS;
      }
      return '';
    };

    const errorHandler = (error: string) => {
      setCreating(false);
      dispatch(
        setSignatureAction({
          title: FILE_TITLE_UPLOAD_FAILED,
          icon: 'status-failed',
          desc: "Sorry, there's something wrong when signing with the wallet.",
          buttonText: BUTTON_GOT_IT,
          errorText: 'Error message: ' + error,
        }),
      );
    };

    // todo recheck files
    const onUploadClick = async () => {
      const validFiles = selectedFiles.filter((item) => item.status === 'WAIT');
      const isOneFile = validFiles.length === 1;
      setCreating(true);
      dispatch(
        setSignatureAction({
          icon: Animates.upload,
          title: 'Uploading',
          desc: WALLET_CONFIRM,
        }),
      );
      if (isOneFile) {
        // 1. cal hash
        const waitObject = validFiles[0];
        const a = performance.now();
        const res = await checksumApi?.generateCheckSumV2(waitObject.file);
        const expectCheckSums = res?.expectCheckSums || [];
        console.log('hashing time', performance.now() - a);
        // 2. getApproval & sign
        const { seedString } = await dispatch(
          getSpOffChainData(loginAccount, primarySp.operatorAddress),
        );
        const finalName = [...pathSegments, waitObject.relativePath, waitObject.name]
          .filter((item) => !!item)
          .join('/');
        const createObjectPayload: CreateObjectApprovalRequest = {
          bucketName: currentBucketName,
          objectName: finalName,
          creator: loginAccount,
          visibility: reverseVisibilityType[visibility],
          fileType: waitObject.type || 'application/octet-stream',
          contentLength: waitObject.size,
          expectCheckSums,
        };
        const [createObjectTx, _createError] = await genCreateObjectTx(createObjectPayload, {
          type: 'EDDSA',
          seed: seedString,
          domain: window.location.origin,
          address: loginAccount,
        }).then(resolve, createTxFault);

        if (!createObjectTx) {
          // TODO refactor
          dispatch(setupWaitTaskErrorMsg({ id: waitObject.id, errorMsg: _createError }));
          closeModal();
          return;
        }
        // const [tagsTx, _tagsError] = await getUpdateObjectTagsTx({
        //   address: createObjectPayload.creator,
        //   bucketName: createObjectPayload.bucketName,
        //   objectName: createObjectPayload.objectName,
        //   tags: validTags
        // });
        // if (!tagsTx) {
        //   dispatch(setupWaitTaskErrorMsg({ id: waitObject.id, errorMsg: _tagsError }));
        //   closeModal();
        //   return;
        // }
        const [txRes, error] = await broadcastTx({
          tx: createObjectTx,
          address: loginAccount,
          connector: connector!,
        });
        if (!txRes || error) {
          dispatch(setupWaitTaskErrorMsg({ id: waitObject.id, errorMsg: error ?? '' }));
          closeModal();
          return;
        }
        const createHash = txRes.transactionHash;
        dispatch(
          addSignedTasksToUploadQueue({
            spAddress: primarySp.operatorAddress,
            visibility,
            waitObject: waitObject,
            checksums: expectCheckSums,
            createHash,
            tags: validTags,
          }),
        );
      } else {
        const { totalFee } = actionParams;
        const safeAmount =
          Number(totalFee) * 1.05 > Number(bankBalance)
            ? round(Number(bankBalance), 6)
            : round(Number(totalFee) * 1.05, 6);
        const [tempAccount, error] = await createTempAccount({
          address: loginAccount,
          bucketName: currentBucketName,
          amount: parseEther(String(safeAmount)).toNumber(),
          connector: connector!,
        });
        if (!tempAccount) {
          return errorHandler(error);
        }
        dispatch(setTempAccountRecords(tempAccount));
        dispatch(
          addTasksToUploadQueue({
            spAddress: primarySp.operatorAddress,
            visibility,
            tags: validTags,
            tempAccountAddress: tempAccount.address,
          }),
        );
      }

      closeModal();
      dispatch(setTaskManagement(true));
      setCreating(false);
    };

    const handleFolderTree = (tree: TransferItemTree) => {
      const totalFiles = objectWaitQueue.length + Object.keys(tree).length;
      if (totalFiles > SELECT_OBJECT_NUM_LIMIT) {
        return toast.error({
          description: `You can only upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`,
          isClosable: true,
        });
      }
      if (totalFiles === objectWaitQueue.length) {
        return toast.error({
          description: 'You can only upload folders that contain objects.',
          isClosable: true,
        });
      }
      toPairs(tree).forEach(([key, value]) => {
        const time = getTimestamp();
        const id = parseInt(String(time + time * Math.random()));
        dispatch(addToWaitQueue({ id, file: value, time, relativePath: key }));
      });
    };

    const [{ isOver }, drop] = useDrop<DragItemProps, any, DragMonitorProps>({
      accept: [NativeTypes.FILE],
      async drop({ items }) {
        const tree = await traverseTransferItems(items);
        handleFolderTree(tree);
      },
      collect(monitor: DropTargetMonitor) {
        return {
          isOver: monitor.isOver(),
        };
      },
    });

    useAsyncEffect(async () => {
      if (isEmpty(selectedFiles)) return;
      selectedFiles.forEach((item) => {
        const { file, id } = item;
        const task = objectWaitQueue.find((item) => item.id === id);
        if (!task) return;
        const isFolder = file.name.endsWith('/');
        const error = isFolder ? validateFolder(item) : validateFile(item);
        if (!error) {
          task.status === 'CHECK' && dispatch(updateWaitObjectStatus({ id, status: 'WAIT' }));
          return;
        }
        dispatch(setupWaitTaskErrorMsg({ id, errorMsg: getErrorMsg(error).title }));
      });
    }, [actionParams, objectWaitQueue.length]);

    useUnmount(() => {
      dispatch(resetWaitQueue());
    });

    return (
      <>
        {isOver && (
          <DragOverlay>
            <IconFont w={120} type={'drag-upload'} mb={16} />
            <Text fontSize={16} fontWeight={500}>
              Drop the objects or folders you want to upload here.
            </Text>
          </DragOverlay>
        )}
        <DragContainer ref={drop}>
          <QDrawerHeader>Upload Objects</QDrawerHeader>
          <QDrawerBody ref={ref}>
            <Tabs activeKey={activeKey} onChange={(key: any) => setActiveKey(key)}>
              <TabList
                position="sticky"
                top={0}
                zIndex={1}
                bg="bg.middle"
                className={cn({ 'tab-header-fixed': scroll.top > 0 })}
              >
                {tabOptions.map((item) => (
                  <Tab
                    h="auto"
                    key={item.key}
                    fontSize={14}
                    fontWeight={500}
                    tabKey={item.key}
                    paddingBottom={6}
                  >
                    {item.icon}
                    {item.title}({item.len})
                  </Tab>
                ))}
              </TabList>
              <TabPanels>
                {tabOptions.map((item) => (
                  <TabPanel key={item.key} panelKey={item.key}>
                    <ListItem
                      handleFolderTree={handleFolderTree}
                      path={completeCommonPrefix}
                      type={item.key}
                    />
                    {/* <EditTags
                      tagsData={editTagsData}
                      onClick={onEditTags}
                      containerStyle={{ mt: 8 }}
                    /> */}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </QDrawerBody>
          {objectWaitQueue?.length > 0 && (
            <QDrawerFooter
              flexDirection={'column'}
              borderTop={'1px solid readable.border'}
              gap={'8px'}
            >
              <Flex alignItems={'center'} justifyContent={'space-between'}>
                <AccessItem freeze={loading} value={visibility} onChange={setVisibility} />
                <Box>
                  Total Upload:{' '}
                  <strong>
                    {formatBytes(
                      checkedQueue
                        .filter((item) => item.status === 'WAIT')
                        .reduce((accumulator, currentValue) => accumulator + currentValue.size, 0),
                    )}
                  </strong>{' '}
                  / <strong>{checkedQueue.length} Objects</strong>
                </Box>
              </Flex>
              <Fees />
              <Flex width={'100%'} flexDirection={'column'}>
                <DCButton
                  size={'lg'}
                  w="100%"
                  onClick={onUploadClick}
                  isDisabled={
                    loading ||
                    creating ||
                    !checkedQueue?.length ||
                    !actionParams.isBalanceAvailable ||
                    loadingSettlementFee
                  }
                  justifyContent={'center'}
                  gaClickName="dc.file.upload_modal.confirm.click"
                >
                  {(loading || creating) && !checkedQueue ? (
                    <>
                      Loading
                      <DotLoading />
                    </>
                  ) : (
                    'Upload'
                  )}
                </DCButton>
              </Flex>
            </QDrawerFooter>
          )}
        </DragContainer>
      </>
    );
  },
);

const DragContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 24px;
  z-index: -1;
  display: flex;
  flex-direction: column;
`;

const DragOverlay = styled(Flex)`
  background: rgba(245, 245, 245, 0.8);
  backdrop-filter: blur(2px);
  z-index: 10;
  position: absolute;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin: auto;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;
