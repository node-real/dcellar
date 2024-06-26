import { useChecksumApi } from '@/modules/checksum';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  UploadObject,
  progressFetchList,
  refreshTaskFolder,
  selectHashTask,
  selectSignTask,
  selectUploadQueue,
  setupUploadTaskErrorMsg,
  updateUploadChecksum,
  updateUploadCreateHash,
  updateUploadProgress,
  updateUploadStatus,
  uploadQueueAndRefresh,
} from '@/store/slices/global';
import { getSpOffChainData } from '@/store/slices/persist';
import { useAsyncEffect } from 'ahooks';
import { memo, useEffect, useMemo, useState } from 'react';

import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { resolve } from '@/facade/common';
import {
  broadcastFault,
  createTxFault,
  E_BUCKET_FLOW_RATE_NOT_SET,
  simulateFault,
} from '@/facade/error';
import { delegateCreateFolder, getObjectMeta } from '@/facade/object';
import { getCreateObjectTx } from '@/modules/object/utils/getCreateObjectTx';
import { setupAccountRecords } from '@/store/slices/accounts';
import { setupSpMeta } from '@/store/slices/sp';
import { parseErrorXml, sleep } from '@/utils/common';
import {
  AuthType,
  DelegatedCreateFolderRequest,
  Long,
  RedundancyType,
  bytesFromBase64,
} from '@bnb-chain/greenfield-js-sdk';
import axios from 'axios';
import { isEmpty } from 'lodash-es';
import { MsgCreateObject } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { getPutObjectRequestConfig } from '@/utils/object';

const MAX_PARALLEL_UPLOADS = 10;
const SEALING_INTERVAL = 3_000;
const SLEEP_INTERVAL = 6_000;
const SEALING_TIMEOUT = 180_000;

interface GlobalTasksProps {}

/**
 * Global Object Upload Manager
 *
 * This component includes two upload methods:
 * 1. Local signature calculation upload:
 *    State transition sequence: WAIT -> HASH -> HASHED -> SIGN -> SIGNED -> UPLOAD -> SEAL -> ...
 * 2. Delegate Primary SP upload(default):
 *    State transition sequence: WAIT -> UPLOAD -> SEAL -> ...
 */
export const GlobalObjectUploadManager = memo<GlobalTasksProps>(
  function GlobalObjectUploadManager() {
    const dispatch = useAppDispatch();
    const SP_RECOMMEND_META = useAppSelector((root) => root.apollo.SP_RECOMMEND_META);
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const spRecords = useAppSelector((root) => root.sp.spRecords);
    const objectSealingTimestamp = useAppSelector((root) => root.global.objectSealingTimestamp);
    const tempAccountRecords = useAppSelector((root) => root.accounts.tempAccountRecords);
    const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
    const objectRecords = useAppSelector((root) => root.object.objectRecords);
    const hashTask = useAppSelector(selectHashTask(loginAccount));
    const signTask = useAppSelector(selectSignTask(loginAccount));
    const queue = useAppSelector(selectUploadQueue(loginAccount));

    const checksumApi = useChecksumApi();
    const { setOpenAuthModal, isAuthPending } = useOffChainAuth();
    const [authModal, setAuthModal] = useState(false);

    const uploadQueue = queue.filter((t) => t.status === 'UPLOAD');
    const waitUploadQueue = queue.filter(
      (t) => t.status === 'SIGNED' || (t.status === 'WAIT' && t.delegateUpload),
    );
    const uploadOffset = MAX_PARALLEL_UPLOADS - uploadQueue.length;
    const uploadTasks = useMemo(() => {
      if (uploadOffset <= 0) return [];
      return waitUploadQueue.slice(0, uploadOffset).map((p) => p.id);
    }, [uploadOffset, waitUploadQueue]);

    const sealQueue = queue.filter((q) => q.status === 'SEAL');
    const sealingQueue = queue.filter((q) => q.status === 'SEALING');
    const sealOffset = MAX_PARALLEL_UPLOADS - sealingQueue.length;
    const sealTasks = useMemo(() => {
      if (sealOffset <= 0) return [];
      return sealQueue.slice(0, sealOffset).map((p) => p.id);
    }, [sealOffset, sealQueue]);

    const retryCheckQueue = queue.filter((t) => t.status === 'RETRY_CHECK');
    const retryCheckingQueue = queue.filter((t) => t.status === 'RETRY_CHECKING');
    const retryOffset = MAX_PARALLEL_UPLOADS - retryCheckingQueue.length;
    const retryTasks = useMemo(() => {
      if (retryOffset <= 0) return [];
      return retryCheckQueue.slice(0, retryOffset).map((p) => p.id);
    }, [retryCheckQueue, retryOffset]);

    const runRetryCheckTask = async (task: UploadObject) => {
      if (authModal) return;
      const { bucketName, prefixFolders, waitObject } = task;
      const objectName = [...prefixFolders, waitObject.relativePath, waitObject.name]
        .filter(Boolean)
        .join('/');
      const endpoint = spRecords[task.spAddress].endpoint;
      const [objectMeta, error] = await getObjectMeta(bucketName, objectName, endpoint);
      if (error && error.code !== 404) {
        return dispatch(
          setupUploadTaskErrorMsg({
            account: loginAccount,
            task,
            errorMsg: error.message || 'Something went wrong.',
          }),
        );
      }
      const objectStatus = objectMeta?.ObjectInfo?.ObjectStatus;
      if (objectStatus === 1) {
        dispatch(uploadQueueAndRefresh(task));
        dispatch(setupAccountRecords(bucketRecords[task.bucketName].PaymentAddress));
        return;
      }

      dispatch(
        updateUploadStatus({
          account: loginAccount,
          ids: [task.id],
          status: 'WAIT',
        }),
      );
    };

    const runUploadTask = async (task: UploadObject) => {
      if (authModal) return;
      const name = task.waitObject.name;
      const isFolder = name.endsWith('/');
      const { seedString } = await dispatch(getSpOffChainData(loginAccount, task.spAddress));
      const endpoint = spRecords[task.spAddress].endpoint;
      const fullObjectName = [
        ...task.prefixFolders,
        task.waitObject.relativePath,
        task.waitObject.name,
      ]
        .filter(Boolean)
        .join('/');
      const key = `${task.bucketName}/${fullObjectName}`;
      const sealed = objectRecords[key]?.ObjectInfo.ObjectStatus === 1;
      const [uploadOptions, error1] = await getPutObjectRequestConfig(
        task,
        loginAccount,
        seedString,
        endpoint,
        task.waitObject.file,
        sealed,
        fullObjectName,
      );
      if (!uploadOptions || error1) {
        return dispatch(
          setupUploadTaskErrorMsg({
            account: loginAccount,
            task,
            errorMsg: error1,
          }),
        );
      }
      const { url, headers } = uploadOptions;
      // create folder by user wallet.
      if (isFolder && !task.delegateUpload) {
        dispatch(
          updateUploadStatus({
            account: loginAccount,
            ids: [task.id],
            status: 'SEAL',
          }),
        );
        // create folder by primary sp.
      } else if (isFolder && task.delegateUpload) {
        const fullObjectName = [
          ...task.prefixFolders,
          task.waitObject.relativePath,
          task.waitObject.name,
        ]
          .filter((item) => !!item)
          .join('/');
        const delegateRequest: DelegatedCreateFolderRequest = {
          bucketName: task.bucketName,
          objectName: fullObjectName,
          endpoint: endpoint,
          delegatedOpts: {
            visibility: task.visibility,
          },
        };
        const authType: AuthType = {
          type: 'EDDSA',
          seed: seedString,
          domain: window.location.origin,
          address: loginAccount,
        };
        const [res2, error2] = await delegateCreateFolder(delegateRequest, authType);
        if (error2) {
          const authExpired = [
            'bad signature',
            'invalid signature',
            'user public key is expired',
          ].includes(error2 || '');
          return dispatch(
            setupUploadTaskErrorMsg({
              account: loginAccount,
              task,
              errorMsg: authExpired ? 'Authentication expired.' : error1 || 'upload error',
            }),
          );
        }
        return dispatch(
          updateUploadStatus({
            account: loginAccount,
            ids: [task.id],
            status: 'FINISH',
          }),
        );
      } else {
        axios
          .put(url, task.waitObject.file, {
            signal: task.abortController?.signal,
            async onUploadProgress(progressEvent) {
              const progress = progressEvent.total
                ? Math.floor((progressEvent.loaded / progressEvent.total) * 100)
                : 0;
              progress > 30 && (await dispatch(progressFetchList(task)));
              if (authModal) return;
              dispatch(updateUploadProgress({ account: loginAccount, id: task.id, progress }));
            },
            headers: {
              Authorization: headers.get('Authorization'),
              'content-type': headers.get('content-type'),
              'x-gnfd-app-domain': headers.get('x-gnfd-app-domain'),
              'x-gnfd-content-sha256': headers.get('x-gnfd-content-sha256'),
              'x-gnfd-date': headers.get('x-gnfd-date'),
              'x-gnfd-expiry-timestamp': headers.get('x-gnfd-expiry-timestamp'),
              'x-gnfd-txn-hash': headers.get('x-gnfd-txn-hash'),
              'x-gnfd-user-address': headers.get('x-gnfd-user-address'),
              'X-Gnfd-App-Reg-Public-Key': headers.get('X-Gnfd-App-Reg-Public-Key'),
            },
          })
          .then(async () => {
            // The connection is closed by this time.
            const status = isFolder ? 'FINISH' : 'SEAL';
            dispatch(updateUploadStatus({ ids: [task.id], status, account: loginAccount }));
          })
          .catch(async (e: Response | any) => {
            console.error('upload error', e);
            let { message } = await parseErrorXml(e);
            const authExpired = [
              'bad signature',
              'invalid signature',
              'user public key is expired',
            ].includes(message || '');
            if (authExpired) {
              setOpenAuthModal();
              setAuthModal(true);
              dispatch(refreshTaskFolder(task));
            }

            // todo refactor
            const rateLimitNotSet = message?.includes(
              'the flow rate limit is not set for the bucket',
            );
            const rateLimitLow =
              message?.includes('is greater than the flow rate limit') ||
              message?.includes('payment account is not changed but the bucket is limited');
            if (rateLimitNotSet) {
              message = E_BUCKET_FLOW_RATE_NOT_SET;
            }
            if (rateLimitLow) {
              message = 'Flow rate exceeds limit.';
            }

            setTimeout(() => {
              dispatch(
                setupUploadTaskErrorMsg({
                  account: loginAccount,
                  task,
                  status: e?.code === 'ERR_CANCELED' ? 'CANCEL' : 'ERROR',
                  errorMsg: authExpired
                    ? 'Authentication expired.'
                    : message || e?.message || 'upload error',
                }),
              );
            }, 200);
          });
      }
    };

    const runSealingTask = async (task: UploadObject) => {
      if (authModal) return;

      const { bucketName, prefixFolders, waitObject } = task;
      const objectName = [...prefixFolders, waitObject.relativePath, waitObject.name]
        .filter(Boolean)
        .join('/');

      const endpoint = spRecords[task.spAddress].endpoint;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [objectMeta, error] = await getObjectMeta(bucketName, objectName, endpoint);
        const objectStatus = objectMeta?.ObjectInfo?.ObjectStatus;
        const preTs = objectSealingTimestamp[task.id];
        const handleSealingTimeout = () => {
          dispatch(
            setupUploadTaskErrorMsg({
              account: loginAccount,
              task,
              errorMsg: 'Sealing timeout exceeded.',
            }),
          );
          return;
        };
        if (error) {
          if (error.code === 429 || error.code === 404) {
            if (Date.now() - preTs >= SEALING_TIMEOUT) {
              handleSealingTimeout();
              return;
            }
            await sleep(SLEEP_INTERVAL);
            continue;
          } else {
            dispatch(
              setupUploadTaskErrorMsg({
                account: loginAccount,
                task,
                errorMsg: error.message || 'Something went wrong.',
              }),
            );
            return;
          }
        }

        if (objectStatus === 1) {
          dispatch(uploadQueueAndRefresh(task));
          dispatch(setupAccountRecords(bucketRecords[task.bucketName].PaymentAddress));
          return;
        }

        if (Date.now() - preTs >= SEALING_TIMEOUT) {
          handleSealingTimeout();
          return;
        }

        await sleep(SEALING_INTERVAL);
      }
    };

    // retry checking
    useAsyncEffect(async () => {
      if (!retryTasks.length) return;
      dispatch(
        updateUploadStatus({ ids: retryTasks, status: 'RETRY_CHECKING', account: loginAccount }),
      );
      const tasks = queue.filter((t) => retryTasks.includes(t.id));
      tasks.forEach(runRetryCheckTask);
    }, [retryTasks.join('')]);

    // 1. hash
    useAsyncEffect(async () => {
      if (!hashTask) return;
      dispatch(updateUploadStatus({ ids: [hashTask.id], status: 'HASH', account: loginAccount }));
      const a = performance.now();
      const res = await checksumApi?.generateCheckSumV2(hashTask.waitObject.file);
      console.log('hashing time', performance.now() - a);
      if (isEmpty(res)) {
        return dispatch(
          setupUploadTaskErrorMsg({
            account: loginAccount,
            task: hashTask,
            errorMsg: 'calculating hash error',
          }),
        );
      }
      const { expectCheckSums } = res!;
      dispatch(
        updateUploadChecksum({
          account: loginAccount,
          id: hashTask.id,
          checksum: expectCheckSums,
        }),
      );
    }, [hashTask, dispatch]);

    useEffect(() => {
      if (isAuthPending) return;
      setAuthModal(false);
    }, [isAuthPending]);

    // 2. sign
    useAsyncEffect(async () => {
      const task = signTask;
      if (!task || !task.tempAccountAddress) return;
      const tempAccount = tempAccountRecords[task.tempAccountAddress];
      dispatch(updateUploadStatus({ ids: [task.id], status: 'SIGN', account: loginAccount }));
      const completeObjectName = [
        ...task.prefixFolders,
        task.waitObject.relativePath,
        task.waitObject.name,
      ]
        .filter((item) => !!item)
        .join('/');
      const msgCreateObject: MsgCreateObject = {
        creator: tempAccount.address,
        bucketName: task.bucketName,
        objectName: completeObjectName,
        visibility: task.visibility,
        contentType: task.waitObject.type || 'application/octet-stream',
        payloadSize: Long.fromInt(task.waitObject.size),
        expectChecksums: task.checksum.map((x) => bytesFromBase64(x)),
        redundancyType: RedundancyType.REDUNDANCY_EC_TYPE,
      };
      const [createObjectTx, _createError] = await getCreateObjectTx(msgCreateObject).then(
        resolve,
        createTxFault,
      );
      if (_createError) {
        console.error('createError', _createError);
        return dispatch(
          setupUploadTaskErrorMsg({
            account: loginAccount,
            task,
            errorMsg: _createError,
          }),
        );
      }
      const [simulateInfo, simulateError] = await createObjectTx!
        .simulate({
          denom: 'BNB',
        })
        .then(resolve, simulateFault);
      if (!simulateInfo || simulateError) {
        console.error('simulateError', simulateError);
        return dispatch(
          setupUploadTaskErrorMsg({
            account: loginAccount,
            task,
            errorMsg: simulateError,
          }),
        );
      }
      const broadcastPayload = {
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: tempAccount.address,
        granter: loginAccount,
        privateKey: tempAccount.privateKey,
      };
      const [res, error] = await createObjectTx!
        .broadcast(broadcastPayload)
        .then(resolve, broadcastFault);
      if (!res || error) {
        console.error('broadTxError', error);
        return dispatch(
          setupUploadTaskErrorMsg({
            account: loginAccount,
            task,
            errorMsg: error,
          }),
        );
      }
      dispatch(
        updateUploadCreateHash({
          account: loginAccount,
          id: task.id,
          createHash: res.transactionHash,
        }),
      );
    }, [signTask]);

    // 3. upload
    useAsyncEffect(async () => {
      if (!uploadTasks.length) return;
      // Add abortController to each task
      const extraFields: Record<string, Partial<UploadObject>> = uploadTasks.reduce(
        (acc, id) => {
          acc[id] = {
            abortController: new AbortController(),
          };
          return acc;
        },
        {} as Record<string, Partial<UploadObject>>,
      );
      dispatch(
        updateUploadStatus({
          ids: uploadTasks,
          status: 'UPLOAD',
          account: loginAccount,
          extraFields,
        }),
      );

      const tasks = queue
        .filter((t) => uploadTasks.includes(t.id))
        .map((t) => ({ ...t, ...extraFields[t.id] }));
      tasks.forEach(runUploadTask);
    }, [uploadTasks.join('')]);

    // 4. seal
    useAsyncEffect(async () => {
      if (!sealTasks.length) return;
      dispatch(updateUploadStatus({ ids: sealTasks, status: 'SEALING', account: loginAccount }));
      const tasks = queue.filter((t) => sealTasks.includes(t.id));
      tasks.forEach(runSealingTask);
    }, [sealTasks.join('')]);

    useAsyncEffect(async () => {
      if (!loginAccount || !SP_RECOMMEND_META) return;
      dispatch(setupSpMeta());
    }, [loginAccount, SP_RECOMMEND_META]);

    return <></>;
  },
);
