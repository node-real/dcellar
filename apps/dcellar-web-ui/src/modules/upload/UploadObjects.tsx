import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Flex,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerFooter,
  QDrawerHeader,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@totejs/uikit';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  FILE_STATUS_UPLOADING,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_UPLOAD_URL,
  OBJECT_AUTH_TEMP_ACCOUNT_CREATING,
} from '@/modules/file/constant';
import Fee from './SimulateFee';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { WarningInfo } from '@/components/common/WarningInfo';
import AccessItem from './AccessItem';
import {
  E_FILE_IS_EMPTY,
  E_FILE_TOO_LARGE,
  E_OBJECT_NAME_CONTAINS_SLASH,
  E_OBJECT_NAME_EMPTY,
  E_OBJECT_NAME_EXISTS,
  E_OBJECT_NAME_NOT_UTF8,
  E_OBJECT_NAME_TOO_LONG,
  E_UNKNOWN,
} from '@/facade/error';
import { isUTF8 } from '../file/utils/file';
import { useAppDispatch, useAppSelector } from '@/store';
import { formatBytes } from '../file/utils';
import { DCDrawer } from '@/components/common/DCDrawer';
import { TEditUpload, TStatusDetail, setEditUpload, setEditUploadStatus, setStatusDetail } from '@/store/slices/object';
import {
  addTasksToUploadQueue,
  resetWaitQueue,
  setTaskManagement,
  setTmpAccount,
  updateWaitFileStatus,
  updateWaitTaskMsg,
} from '@/store/slices/global';
import { useAsyncEffect, useUpdateEffect } from 'ahooks';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '../object/ObjectError';
import { duplicateName } from '@/utils/object';
import { isEmpty, round } from 'lodash-es';
import { ListItem } from './ListItem';
import { useTab } from './useUploadTab';
import { createTmpAccount } from '@/facade/account';
import { parseEther } from 'ethers/lib/utils.js';

const MAX_SIZE = 256;

export const UploadObjects = () => {
  const dispatch = useAppDispatch();
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const { editUpload, bucketName, path, objects } = useAppSelector((root) => root.object);
  const {primarySpInfo} = useAppSelector((root) => root.sp);
  const primarySp = primarySpInfo[bucketName];
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { waitQueue, preLockFeeObjects } = useAppSelector((root) => root.global);
  const [visibility, setVisibility] = useState<VisibilityType>(
    VisibilityType.VISIBILITY_TYPE_PRIVATE,
  );
  const selectedFiles = waitQueue;
  const objectList = objects[path]?.filter((item) => !item.objectName.endsWith('/'));
  const [creating, setCreating] = useState(false);
  const { tabOptions, activeKey, setActiveKey } = useTab();

  const onClose = () => {
    dispatch(setEditUploadStatus(false))
    dispatch(setEditUpload({} as TEditUpload));
    dispatch(resetWaitQueue());
  };

  const getErrorMsg = (type: string) => {
    return OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];
  };

  const basicValidate = (file: File) => {
    if (!file) {
      return E_FILE_IS_EMPTY;
    }
    if (file.size > MAX_SIZE * 1024 * 1024) {
      return E_FILE_TOO_LARGE;
    }
    if (file.size <= 0) {
      return E_FILE_IS_EMPTY;
    }
    if (!file.name) {
      return E_OBJECT_NAME_EMPTY;
    }
    if (file.name.length > 1024) {
      return E_OBJECT_NAME_TOO_LONG;
    }
    if (!isUTF8(file.name)) {
      return E_OBJECT_NAME_NOT_UTF8;
    }
    if (file.name.includes('//')) {
      return E_OBJECT_NAME_CONTAINS_SLASH;
    }
    if (duplicateName(file.name, objectList)) {
      return E_OBJECT_NAME_EXISTS;
    }
    return '';
  };

  const errorHandler = (error: string) => {
    setCreating(false);
    dispatch(
      setStatusDetail({
        title: FILE_TITLE_UPLOAD_FAILED,
        icon: FILE_FAILED_URL,
        desc: 'Sorry, there’s something wrong when signing with the wallet.',
        buttonText: BUTTON_GOT_IT,
        buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
        errorText: 'Error message: ' + error,
      }),
    );
  };

  const onUploadClick = async () => {
    setCreating(true);
    dispatch(
      setStatusDetail({
        icon: FILE_UPLOAD_URL,
        title: OBJECT_AUTH_TEMP_ACCOUNT_CREATING,
        desc: FILE_STATUS_UPLOADING,
      }),
    );
    const { totalFee: amount } = editUpload;
    const safeAmount = Number(amount) * 1.05 > Number(availableBalance) ? round(Number(availableBalance), 6) : round(Number(amount) * 1.05, 6);
    const [tmpAccount, error] = await createTmpAccount({
      address: loginAccount,
      bucketName,
      amount: parseEther(String(safeAmount)).toString(),
    });
    if (!tmpAccount) {
      return errorHandler(error);
    }

    dispatch(setTmpAccount(tmpAccount));
    dispatch(addTasksToUploadQueue(primarySp.operatorAddress, visibility));
    dispatch(setStatusDetail({} as TStatusDetail));
    dispatch(setTaskManagement(true));
    onClose();
    setCreating(false);
  };

  useAsyncEffect(async () => {
    if (isEmpty(selectedFiles)) return;
    selectedFiles.forEach((item) => {
      const { file, id } = item;
      const error = basicValidate(file);
      if (!error) {
        dispatch(updateWaitFileStatus({ id, status: 'WAIT' }));
        return;
      }
      dispatch(updateWaitTaskMsg({ id, msg: getErrorMsg(error).title }));
    });
  }, [editUpload]);

  useUpdateEffect(() => {
    if (selectedFiles.length === 0) {
      dispatch(setEditUploadStatus(false))
      dispatch(setEditUpload({} as TEditUpload));
    }
  }, [selectedFiles.length]);

  const loading = useMemo(() => {
    return selectedFiles.some((item) => item.status === 'CHECK') || isEmpty(preLockFeeObjects);
  }, [preLockFeeObjects, selectedFiles]);

  const hasSuccess = waitQueue.some((item) => item.status === 'WAIT');

  return (
    <DCDrawer isOpen={!!editUpload.isOpen} onClose={onClose}>
      <QDrawerCloseButton />
      <QDrawerHeader>Upload Objects</QDrawerHeader>
      {!isEmpty(selectedFiles) && (
        <QDrawerBody marginTop={'24px'}>
          <Tabs activeKey={activeKey} onChange={(key: any) => setActiveKey(key)}>
            <TabList>
              {tabOptions.map((item) => (
                <Tab h="auto" key={item.key} tabKey={item.key} paddingBottom={'8px'}>
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
      )}
      <QDrawerFooter
        flexDirection={'column'}
        marginTop={'12px'}
        borderTop={'1px solid readable.border'}
        gap={'8px'}
      >
        <Flex alignItems={'center'} justifyContent={'space-between'} marginTop={'8px'}>
          <AccessItem freeze={loading} value={visibility} onChange={setVisibility} />
          <Box>
            Total Upload:{' '}
            <strong>
              {formatBytes(
                selectedFiles.reduce(
                  (accumulator, currentValue) => accumulator + currentValue.size,
                  0,
                ),
              )}
            </strong>{' '}
            / <strong>{selectedFiles.length} Files</strong>
          </Box>
        </Flex>
        <Fee />
        <Flex width={'100%'} flexDirection={'column'}>
          <DCButton
            w="100%"
            variant={'dcPrimary'}
            onClick={onUploadClick}
            isDisabled={loading || creating || !hasSuccess || !editUpload.isBalanceAvailable}
            justifyContent={'center'}
            gaClickName="dc.file.upload_modal.confirm.click"
          >
            {(loading || creating) && !hasSuccess ? (
              <>
                Loading
                <DotLoading />
              </>
            ) : (
              'Upload'
            )}
          </DCButton>
          <WarningInfo content="Please be aware that data loss might occur during testnet phase." />
        </Flex>
      </QDrawerFooter>
    </DCDrawer>
  );
};
