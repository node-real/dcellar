import {
  RedundancyType,
  VisibilityType,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
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
} from '@node-real/uikit';
import { useScroll, useUnmount } from 'ahooks';
import cn from 'classnames';
import { parseEther } from 'ethers/lib/utils.js';
import { isEmpty, round } from 'lodash-es';
import { memo, useMemo, useRef, useState } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { useAccount } from 'wagmi';

import AccessItem from './AccessItem';
import { UploadObjectsFees } from './UploadObjectsFees';
import { ListItem } from './ListItem';
import { useUploadTab } from './useUploadTab';
import { useChecksumApi } from '../checksum';
import { getCreateObjectTx } from '../object/utils/getCreateObjectTx';

import { Animates } from '@/components/AnimatePng';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { getValidTags } from '@/components/common/ManageTags';
import { IconFont } from '@/components/IconFont';
import { broadcastTx, resolve } from '@/facade/common';
import { createTxFault } from '@/facade/error';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { BUTTON_GOT_IT, FILE_TITLE_UPLOAD_FAILED, WALLET_CONFIRM } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addDelegatedTasksToUploadQueue,
  addSignedTasksToUploadQueue,
  addTasksToUploadQueue,
  resetWaitQueue,
  setSignatureAction,
  setTaskManagement,
  setupWaitTaskErrorMsg,
} from '@/store/slices/global';
import { DELEGATE_UPLOAD, TEditUploadContent } from '@/store/slices/object';
import { SpEntity } from '@/store/slices/sp';
import { DragItemProps, DragMonitorProps, traverseTransferItems } from '@/utils/dom';
import { formatBytes } from '@/utils/formatter';
import { setTempAccountRecords } from '@/store/slices/accounts';
import { createTempAccount } from '@/facade/account';
import { MsgCreateObject } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { Long, bytesFromBase64 } from '@bnb-chain/greenfield-js-sdk';
import { useHandleFolderTree } from '@/hooks/useHandleFolderTree';
import { waitUploadFilterFn } from '@/utils/object';

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
    const pathSegments = useAppSelector((root) => root.object.pathSegments);
    const objectEditTagsData = useAppSelector((root) => root.object.objectEditTagsData);
    const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const objectWaitQueue = useAppSelector((root) => root.global.objectWaitQueue);
    const storeFeeParams = useAppSelector((root) => root.global.storeFeeParams);

    const { handleFolderTree } = useHandleFolderTree();
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
    const validTags = getValidTags(objectEditTagsData);
    const loading = useMemo(() => {
      return selectedFiles.some((item) => item.status === 'CHECK') || isEmpty(storeFeeParams);
    }, [storeFeeParams, selectedFiles]);

    const checkedQueue = selectedFiles.filter(waitUploadFilterFn);

    const cleanup = () => {
      onClose();
      dispatch(resetWaitQueue());
      dispatch(setSignatureAction({}));
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

    const onUploadClick = async () => {
      const validFiles = selectedFiles.filter(waitUploadFilterFn);
      const isOneFile = validFiles.length === 1;
      if (isEmpty(validFiles)) {
        return errorHandler('No valid files to upload.');
      }
      if (DELEGATE_UPLOAD) {
        dispatch(
          addDelegatedTasksToUploadQueue({
            spAddress: primarySp.operatorAddress,
            visibility,
          }),
        );
        cleanup();
        // for lock the scroll of main content
        setTimeout(() => {
          dispatch(setTaskManagement(true));
        }, 400);
        return;
      }
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
        const finalName = [...pathSegments, waitObject.relativePath, waitObject.name]
          .filter((item) => !!item)
          .join('/');
        const msgCreateObject: MsgCreateObject = {
          creator: loginAccount,
          bucketName: currentBucketName,
          objectName: finalName,
          payloadSize: Long.fromInt(waitObject.size),
          visibility,
          contentType: waitObject.type || 'application/octet-stream',
          expectChecksums: expectCheckSums.map((x) => bytesFromBase64(x)),
          redundancyType: RedundancyType.REDUNDANCY_EC_TYPE,
        };
        const [createObjectTx, _createError] = await getCreateObjectTx(msgCreateObject).then(
          resolve,
          createTxFault,
        );

        if (!createObjectTx) {
          dispatch(setupWaitTaskErrorMsg({ id: waitObject.id, errorMsg: _createError }));
          cleanup();
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
          dispatch(
            setupWaitTaskErrorMsg({
              id: waitObject.id,
              errorMsg: error ?? 'Something went wrong.',
            }),
          );
          cleanup();
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
          amount: parseEther(String(safeAmount)),
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

      cleanup();
      setTimeout(() => {
        dispatch(setTaskManagement(true));
      }, 400);
      setCreating(false);
    };

    const [{ isOver }, drop] = useDrop<DragItemProps, any, DragMonitorProps>({
      accept: [NativeTypes.FILE],
      async drop({ items }) {
        console.log('items', items.length);
        const tree = await traverseTransferItems(items);
        handleFolderTree(tree);
      },
      collect(monitor: DropTargetMonitor) {
        return {
          isOver: monitor.isOver(),
        };
      },
    });

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
                        .filter(waitUploadFilterFn)
                        .reduce((accumulator, currentValue) => accumulator + currentValue.size, 0),
                    )}
                  </strong>{' '}
                  / <strong>{checkedQueue.length} Objects</strong>
                </Box>
              </Flex>
              <UploadObjectsFees delegateUpload={DELEGATE_UPLOAD} />
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
