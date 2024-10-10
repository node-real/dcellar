import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
import { useHandleFolderTree } from '@/hooks/useHandleFolderTree';
import { BatchOperations } from '@/modules/object/components/BatchOperations';
import { UploadMenuList } from '@/modules/object/components/UploadMenuList';
import { useAppDispatch, useAppSelector } from '@/store';
import { EStreamRecordStatus, selectAccount } from '@/store/slices/accounts';
import { setupBucket, setupBucketQuota } from '@/store/slices/bucket';
import {
  SELECT_OBJECT_NUM_LIMIT,
  SINGLE_OBJECT_MAX_SIZE,
  setObjectListRefreshing,
  setObjectOperation,
  setObjectListPageRestored,
  setObjectSelectedKeys,
  setupListObjects,
} from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { TransferItemTree } from '@/utils/dom';
import { formatBytes } from '@/utils/formatter';
import { Flex, Menu, Tooltip, toast } from '@node-real/uikit';
import { debounce, keyBy, toPairs } from 'lodash-es';
import { ChangeEvent, memo, useCallback } from 'react';

export const MAX_FOLDER_LEVEL = 10;
export const MAX_FOLDER_NAME_LEN = 70;

interface NewObjectProps {
  showRefresh?: boolean;
  gaFolderClickName?: string;
  gaUploadClickName?: string;
  shareMode?: boolean;
}

export const CreateObject = memo<NewObjectProps>(function NewObject({
  showRefresh = false,
  gaFolderClickName = '',
  gaUploadClickName = '',
  shareMode = false,
}) {
  const dispatch = useAppDispatch();
  const { handleFolderTree } = useHandleFolderTree();
  const isBucketDiscontinue = useAppSelector((root) => root.bucket.isBucketDiscontinue);
  const isBucketMigrating = useAppSelector((root) => root.bucket.isBucketMigrating);
  const isBucketOwner = useAppSelector((root) => root.bucket.isBucketOwner);
  const pathSegments = useAppSelector((root) => root.object.pathSegments);
  const objectCommonPrefix = useAppSelector((root) => root.object.objectCommonPrefix);
  const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
  const objectRecords = useAppSelector((root) => root.object.objectRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const objectListRecords = useAppSelector((root) => root.object.objectListRecords);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const primarySpRecords = useAppSelector((root) => root.sp.primarySpRecords);
  const bucket = bucketRecords[currentBucketName];
  const accountDetail = useAppSelector(selectAccount(bucket?.PaymentAddress));
  const isFlowRateLimit = ['1', '3'].includes(bucket?.OffChainStatus);
  const primarySp = primarySpRecords[currentBucketName];
  const onOpenCreateFolder = () => {
    if (disabled) return;
    dispatch(setObjectOperation({ operation: ['', 'create_folder'] }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refreshList = useCallback(
    debounce(async () => {
      const { seedString } = await dispatch(
        getSpOffChainData(loginAccount, primarySp.operatorAddress),
      );
      const query = new URLSearchParams();
      const params = {
        seedString,
        query,
        endpoint: primarySp.endpoint,
      };
      dispatch(setObjectSelectedKeys([]));
      dispatch(setupBucketQuota(currentBucketName));
      dispatch(setObjectListRefreshing(true));
      dispatch(setObjectListPageRestored(false));
      dispatch(setupBucket(currentBucketName));
      await dispatch(setupListObjects(params));
      dispatch(setObjectListRefreshing(false));
    }, 150),
    [loginAccount, primarySp?.operatorAddress, currentBucketName],
  );

  if (!isBucketOwner && !shareMode)
    return (
      <>
        {showRefresh && (
          <DCButton
            variant="ghost"
            onClick={refreshList}
            leftIcon={<IconFont type="refresh" w={24} />}
          />
        )}
      </>
    );

  const folderExist = !objectCommonPrefix || !!objectRecords[completeCommonPrefix + '/'];

  const invalidPath =
    pathSegments.some((name) => new Blob([name]).size > MAX_FOLDER_NAME_LEN) || !folderExist;
  const maxFolderDepth = invalidPath || pathSegments.length >= MAX_FOLDER_LEVEL;

  const loading = !objectListRecords[completeCommonPrefix];
  const disabled =
    maxFolderDepth ||
    isBucketDiscontinue ||
    isFlowRateLimit ||
    isBucketMigrating ||
    loading ||
    accountDetail.status === EStreamRecordStatus.FROZEN;
  const uploadDisabled =
    isBucketDiscontinue ||
    isFlowRateLimit ||
    isBucketMigrating ||
    invalidPath ||
    pathSegments.length > MAX_FOLDER_LEVEL ||
    loading ||
    accountDetail.status === EStreamRecordStatus.FROZEN;

  const onFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const tree: TransferItemTree = keyBy(files, 'name');
    handleFolderTree(tree);
    dispatch(setObjectOperation({ operation: ['', 'upload'] }));
    e.target.value = '';
  };

  const onFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const tree: TransferItemTree = {};
    Object.values(files).forEach((file: File) => {
      const folders = file.webkitRelativePath.split('/').slice(0, -1);
      let relativePath = '';
      folders.forEach((folder) => {
        relativePath += folder + '/';
        if (!tree[relativePath] && relativePath) {
          // folder
          tree[relativePath] = new File([], relativePath, { type: 'text/plain' });
        }
      });

      tree[file.webkitRelativePath] = file;
    });

    handleFolderTree(tree);
    dispatch(setObjectOperation({ operation: ['', 'upload'] }));
    e.target.value = '';
  };

  return (
    <Flex gap={12}>
      {showRefresh && (
        <>
          <DCButton
            variant="ghost"
            onClick={refreshList}
            leftIcon={<IconFont type="refresh" w={24} />}
          />
          <BatchOperations shareMode={shareMode} />
        </>
      )}
      {!shareMode && (
        <>
          <Tooltip
            content={
              invalidPath
                ? 'Folder does not exist.'
                : `You have reached the maximum supported folder depth (${MAX_FOLDER_LEVEL}).`
            }
            placement={'bottom-start'}
            visibility={maxFolderDepth && !loading ? 'visible' : 'hidden'}
          >
            <div>
              <GAClick name={gaFolderClickName}>
                <DCButton
                  whiteSpace="nowrap"
                  variant="second"
                  onClick={onOpenCreateFolder}
                  disabled={disabled}
                >
                  Create Folder
                </DCButton>
              </GAClick>
            </div>
          </Tooltip>
          <Menu matchWidth>
            <Tooltip
              placement="top-end"
              content={
                isBucketDiscontinue
                  ? 'Bucket in the discontinue status cannot upload objects.'
                  : isFlowRateLimit
                    ? "The bucket's flow rate exceeds the payment account limit. Contact the account owner or switch accounts to increase it."
                    : isBucketMigrating
                      ? 'Bucket in the migrating status cannot upload objects.'
                      : accountDetail.status === EStreamRecordStatus.FROZEN
                        ? 'The payment account in the frozen status cannot upload objects.'
                        : uploadDisabled
                          ? 'Path invalid'
                          : `Please limit object size to ${formatBytes(
                              SINGLE_OBJECT_MAX_SIZE,
                            )} and upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`
              }
            >
              <div>
                <UploadMenuList
                  gaUploadClickName={gaUploadClickName}
                  disabled={uploadDisabled}
                  handleFilesChange={onFilesChange}
                  handlerFolderChange={onFolderChange}
                >
                  <IconFont type="upload" w={24} />
                  Upload
                  <Flex
                    className="ui-icon__container"
                    paddingX={'4px'}
                    height={'40px'}
                    borderRightRadius={4}
                    alignItems={'center'}
                    borderLeft={disabled ? '1px solid readable.border' : '1px solid #5ED47F'}
                  >
                    <IconFont
                      transform="rotate(-90deg)"
                      className="ui-icon"
                      type="back"
                      w={16}
                      mx={4}
                    />
                  </Flex>
                </UploadMenuList>
              </div>
            </Tooltip>
          </Menu>
        </>
      )}
    </Flex>
  );
});
