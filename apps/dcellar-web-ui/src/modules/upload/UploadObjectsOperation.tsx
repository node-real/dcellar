import React, { memo, useMemo, useRef, useState } from 'react';
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
} from '@totejs/uikit';
import { BUTTON_GOT_IT, FILE_TITLE_UPLOAD_FAILED, WALLET_CONFIRM } from '@/modules/object/constant';
import { Fees } from './Fees';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import AccessItem from './AccessItem';
import {
  broadcastFault,
  createTxFault,
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
  simulateFault,
} from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  SELECT_OBJECT_NUM_LIMIT,
  setEditObjectTags,
  setEditObjectTagsData,
  setStatusDetail,
  SINGLE_OBJECT_MAX_SIZE,
  TEditUploadContent,
  TStatusDetail,
} from '@/store/slices/object';
import {
  addSignedTasksToUploadQueue,
  addTasksToUploadQueue,
  addToWaitQueue,
  resetWaitQueue,
  setTaskManagement,
  setTmpAccount,
  setupWaitTaskErrorMsg,
  updateWaitFileStatus,
  UPLOADING_STATUSES,
  WaitFile,
} from '@/store/slices/global';
import { useAsyncEffect, useScroll, useUnmount } from 'ahooks';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../object/ObjectError';
import { isEmpty, round, toPairs, trimEnd } from 'lodash-es';
import { ListItem } from './ListItem';
import { useUploadTab } from './useUploadTab';
import { createTmpAccount } from '@/facade/account';
import { parseEther } from 'ethers/lib/utils.js';
import { useAccount } from 'wagmi';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { SpItem } from '@/store/slices/sp';
import { formatBytes } from '@/utils/formatter';
import { isUTF8 } from '@/utils/coder';
import { Animates } from '@/components/AnimatePng';
import cn from 'classnames';
import { useChecksumApi } from '../checksum';
import { CreateObjectApprovalRequest } from '@bnb-chain/greenfield-js-sdk';
import { reverseVisibilityType } from '@/constants/legacy';
import { genCreateObjectTx } from '../object/utils/genCreateObjectTx';
import { getSpOffChainData } from '@/store/slices/persist';
import { resolve } from '@/facade/common';
import { signTypedDataCallback } from '@/facade/wallet';
import styled from '@emotion/styled';
import { IconFont } from '@/components/IconFont';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import {
  DragItemProps,
  DragMonitorProps,
  TransferItemTree,
  traverseTransferItems,
} from '@/utils/dom';
import { getTimestamp } from '@/utils/time';
import { MAX_FOLDER_LEVEL } from '@/modules/object/components/NewObject';
import { DEFAULT_TAG, EditTags, getValidTags } from '@/components/common/ManageTag';

interface UploadObjectsOperationProps {
  onClose?: () => void;
  actionParams?: TEditUploadContent;
  primarySp: SpItem;
}

const defaultScroll = { top: 0 };
const defaultActionParams = {} as TEditUploadContent;

// add memo avoid parent state change rerender
export const UploadObjectsOperation = memo<UploadObjectsOperationProps>(
  function UploadObjectsOperation({
    onClose = () => {},
    actionParams = defaultActionParams,
    primarySp,
  }) {
    const dispatch = useAppDispatch();
    const checksumApi = useChecksumApi();
    const { bankBalance } = useAppSelector((root) => root.accounts);
    const { bucketName, path, prefix, objects, folders, editTagsData } = useAppSelector(
      (root) => root.object,
    );
    const { bucketInfo } = useAppSelector((root) => root.bucket);
    const { loginAccount } = useAppSelector((root) => root.persist);
    const { waitQueue, storeFeeParams } = useAppSelector((root) => root.global);
    const [visibility, setVisibility] = useState<VisibilityType>(
      VisibilityType.VISIBILITY_TYPE_PRIVATE,
    );
    const { connector } = useAccount();
    const selectedFiles = waitQueue;
    const objectList = objects[path] || [];
    const { uploadQueue } = useAppSelector((root) => root.global);
    const [creating, setCreating] = useState(false);
    const { tabOptions, activeKey, setActiveKey } = useUploadTab();
    const bucket = bucketInfo[bucketName];
    const { loading: loadingSettlementFee } = useSettlementFee(bucket.PaymentAddress);
    const ref = useRef(null);
    const scroll = useScroll(ref) || defaultScroll;
    const validTags = getValidTags(editTagsData);

    const getErrorMsg = (type: string) => {
      return OBJECT_ERROR_TYPES[type as ObjectErrorType]
        ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
        : OBJECT_ERROR_TYPES[E_UNKNOWN];
    };

    const closeModal = () => {
      onClose();
      dispatch(setStatusDetail({} as TStatusDetail));
    };

    const objectListObjectNames = objectList.map((item) => bucketName + '/' + item.objectName);
    const uploadingObjectNames = (uploadQueue?.[loginAccount] || [])
      .filter((item) => UPLOADING_STATUSES.includes(item.status))
      .map((item) => {
        return [
          item.bucketName,
          ...item.prefixFolders,
          item.waitFile.relativePath,
          item.waitFile.name,
        ]
          .filter((item) => !!item)
          .join('/');
      });

    const validateFolder = (waitFile: WaitFile) => {
      const { file: folder, relativePath } = waitFile;
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
      const depth = trimEnd([prefix, relativePath, folder.name].join('/'), '/').split('/').length;
      if (depth > MAX_FOLDER_LEVEL) {
        return E_MAX_FOLDER_DEPTH;
      }
      const fullObjectName = [path, relativePath, folder.name].filter((item) => !!item).join('/');
      const isExistObjectList = objectListObjectNames.includes(fullObjectName);
      const isExistUploadList = uploadingObjectNames.includes(fullObjectName);

      if (isExistObjectList || (!isExistObjectList && isExistUploadList)) {
        return E_OBJECT_NAME_EXISTS;
      }
      // Validation only works to data within the current path. The root folder has been validated when selected files. So there is no need to validate it again.
      return '';
    };

    const validateFile = (waitFile: WaitFile) => {
      const { relativePath, file } = waitFile;
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
      const fullPathObject = prefix + '/' + relativePath + '/' + file.name;
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
      const fullObjectName = [path, relativePath, file.name].filter((item) => !!item).join('/');
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
        setStatusDetail({
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
        setStatusDetail({
          icon: Animates.upload,
          title: 'Uploading',
          desc: WALLET_CONFIRM,
        }),
      );
      if (isOneFile) {
        // 1. cal hash
        const waitFile = validFiles[0];
        const a = performance.now();
        const res = await checksumApi?.generateCheckSumV2(waitFile.file);
        const expectCheckSums = res?.expectCheckSums || [];
        console.log('hashing time', performance.now() - a);
        // 2. getApproval & sign
        const { seedString } = await dispatch(
          getSpOffChainData(loginAccount, primarySp.operatorAddress),
        );
        const finalName = [...folders, waitFile.relativePath, waitFile.name]
          .filter((item) => !!item)
          .join('/');
        const createObjectPayload: CreateObjectApprovalRequest = {
          bucketName: bucketName,
          objectName: finalName,
          creator: loginAccount,
          visibility: reverseVisibilityType[visibility],
          fileType: waitFile.type || 'application/octet-stream',
          contentLength: waitFile.size,
          expectCheckSums,
          tags: {
            tags: validTags,
          },
        };
        const [createObjectTx, _createError] = await genCreateObjectTx(createObjectPayload, {
          type: 'EDDSA',
          seed: seedString,
          domain: window.location.origin,
          address: loginAccount,
        }).then(resolve, createTxFault);
        if (_createError) {
          // TODO refactor
          dispatch(setupWaitTaskErrorMsg({ id: waitFile.id, errorMsg: _createError }));
          closeModal();
          return;
        }
        const [simulateInfo, simulateError] = await createObjectTx!
          .simulate({
            denom: 'BNB',
          })
          .then(resolve, simulateFault);
        if (!simulateInfo || simulateError) {
          dispatch(setupWaitTaskErrorMsg({ id: waitFile.id, errorMsg: simulateError }));
          closeModal();
          return;
        }
        const broadcastPayload = {
          denom: 'BNB',
          gasLimit: Number(simulateInfo?.gasLimit),
          gasPrice: simulateInfo?.gasPrice || '5000000000',
          payer: loginAccount,
          granter: loginAccount,
          signTypedDataCallback: signTypedDataCallback(connector!),
        };
        const [txRes, error] = await createObjectTx!
          .broadcast(broadcastPayload)
          .then(resolve, broadcastFault);
        if (!txRes || error) {
          dispatch(setupWaitTaskErrorMsg({ id: waitFile.id, errorMsg: error }));
          closeModal();
          return;
        }
        const createHash = txRes.transactionHash;
        dispatch(
          addSignedTasksToUploadQueue({
            spAddress: primarySp.operatorAddress,
            visibility,
            waitFile,
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
        console.time('createTmpAccount');
        const [tmpAccount, error] = await createTmpAccount({
          address: loginAccount,
          bucketName,
          amount: parseEther(String(safeAmount)).toString(),
          connector,
        });
        console.timeEnd('createTmpAccount');
        if (!tmpAccount) {
          return errorHandler(error);
        }
        dispatch(setTmpAccount(tmpAccount));
        dispatch(addTasksToUploadQueue(primarySp.operatorAddress, visibility, validTags));
      }

      closeModal();
      dispatch(setTaskManagement(true));
      setCreating(false);
    };

    useAsyncEffect(async () => {
      if (isEmpty(selectedFiles)) return;
      selectedFiles.forEach((item) => {
        const { file, id } = item;
        const task = waitQueue.find((item) => item.id === id);
        if (!task) return;
        const isFolder = file.name.endsWith('/');
        const error = isFolder ? validateFolder(item) : validateFile(item);
        if (!error) {
          task.status === 'CHECK' && dispatch(updateWaitFileStatus({ id, status: 'WAIT' }));
          return;
        }
        dispatch(setupWaitTaskErrorMsg({ id, errorMsg: getErrorMsg(error).title }));
      });
    }, [actionParams, waitQueue.length]);

    useUnmount(() => {
      dispatch(resetWaitQueue());
    });

    const loading = useMemo(() => {
      return selectedFiles.some((item) => item.status === 'CHECK') || isEmpty(storeFeeParams);
    }, [storeFeeParams, selectedFiles]);

    const checkedQueue = selectedFiles.filter((item) => item.status === 'WAIT');

    const handleFolderTree = (tree: TransferItemTree) => {
      const totalFiles = waitQueue.length + Object.keys(tree).length;
      if (totalFiles > SELECT_OBJECT_NUM_LIMIT) {
        return toast.error({
          description: `You can only upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`,
          isClosable: true,
        });
      }
      if (totalFiles === waitQueue.length) {
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

    const onEditTags = () => {
      dispatch(setEditObjectTags(['new', 'create']));
    };

    useUnmount(() => dispatch(setEditObjectTagsData([DEFAULT_TAG])));

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
                    <ListItem handleFolderTree={handleFolderTree} path={path} type={item.key} />
                    <EditTags
                      tagsData={editTagsData}
                      onClick={onEditTags}
                      containerStyle={{ mt: 8 }}
                    />
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </QDrawerBody>
          {waitQueue?.length > 0 && (
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
