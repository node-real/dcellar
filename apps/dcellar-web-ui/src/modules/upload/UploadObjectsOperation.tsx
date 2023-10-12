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
} from '@totejs/uikit';
import { BUTTON_GOT_IT, FILE_TITLE_UPLOAD_FAILED, WALLET_CONFIRM } from '@/modules/object/constant';
import { Fees } from './Fees';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import AccessItem from './AccessItem';
import {
  E_FILE_IS_EMPTY,
  E_FILE_TOO_LARGE,
  E_FOLDER_NAME_TOO_LONG,
  E_FULL_OBJECT_NAME_TOO_LONG,
  E_OBJECT_NAME_CONTAINS_SLASH,
  E_OBJECT_NAME_EMPTY,
  E_OBJECT_NAME_EXISTS,
  E_OBJECT_NAME_NOT_UTF8,
  E_OBJECT_NAME_TOO_LONG,
  E_UNKNOWN,
} from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setStatusDetail,
  SINGLE_OBJECT_MAX_SIZE,
  TEditUploadContent,
  TStatusDetail,
} from '@/store/slices/object';
import {
  addTasksToUploadQueue,
  setTaskManagement,
  setTmpAccount,
  setupWaitTaskErrorMsg,
  updateWaitFileStatus,
  UPLOADING_STATUSES,
  WaitFile,
} from '@/store/slices/global';
import { useAsyncEffect, useScroll } from 'ahooks';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../object/ObjectError';
import { isEmpty, round } from 'lodash-es';
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
    const { bankBalance } = useAppSelector((root) => root.accounts);
    const { bucketName, path, objects } = useAppSelector((root) => root.object);
    const { bucketInfo } = useAppSelector((root) => root.bucket);
    const { loginAccount } = useAppSelector((root) => root.persist);
    const { waitQueue, storeFeeParams } = useAppSelector((root) => root.global);
    const [visibility, setVisibility] = useState<VisibilityType>(
      VisibilityType.VISIBILITY_TYPE_PRIVATE,
    );
    const { connector } = useAccount();
    const selectedFiles = waitQueue;
    const objectList = objects[path]?.filter((item) => !item.objectName.endsWith('/')) || [];
    const { uploadQueue } = useAppSelector((root) => root.global);
    const [creating, setCreating] = useState(false);
    const { tabOptions, activeKey, setActiveKey } = useUploadTab();
    const bucket = bucketInfo[bucketName];
    const { loading: loadingSettlementFee } = useSettlementFee(bucket.PaymentAddress);
    const ref = useRef(null);
    const scroll = useScroll(ref) || defaultScroll;

    const getErrorMsg = (type: string) => {
      return OBJECT_ERROR_TYPES[type as ObjectErrorType]
        ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
        : OBJECT_ERROR_TYPES[E_UNKNOWN];
    };

    const validateFolder = (waitFile: WaitFile) => {
      const { file: folder } = waitFile;
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
      const fullPathObject = relativePath + '/' + file.name;
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
      setCreating(true);
      dispatch(
        setStatusDetail({
          icon: Animates.upload,
          title: 'Uploading',
          desc: WALLET_CONFIRM,
        }),
      );
      const { totalFee } = actionParams;
      const safeAmount =
        Number(totalFee) * 1.05 > Number(bankBalance)
          ? round(Number(bankBalance), 6)
          : round(Number(totalFee) * 1.05, 6);
      const [tmpAccount, error] = await createTmpAccount({
        address: loginAccount,
        bucketName,
        amount: parseEther(String(safeAmount)).toString(),
        connector,
      });
      if (!tmpAccount) {
        return errorHandler(error);
      }

      dispatch(setTmpAccount(tmpAccount));
      onClose();
      dispatch(setStatusDetail({} as TStatusDetail));
      setTimeout(() => {
        dispatch(setTaskManagement(true));
        dispatch(addTasksToUploadQueue(primarySp.operatorAddress, visibility));
        // drawer overlay will not unmount
      }, 500);
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
    }, [actionParams]);

    const loading = useMemo(() => {
      return selectedFiles.some((item) => item.status === 'CHECK') || isEmpty(storeFeeParams);
    }, [storeFeeParams, selectedFiles]);
    const checkedQueue = selectedFiles.filter((item) => item.status === 'WAIT');

    return (
      <>
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
                  <ListItem path={path} type={item.key} />
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </QDrawerBody>
        <QDrawerFooter flexDirection={'column'} borderTop={'1px solid readable.border'} gap={'8px'}>
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
      </>
    );
  },
);
