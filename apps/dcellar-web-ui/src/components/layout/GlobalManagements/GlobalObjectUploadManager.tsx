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

import { reverseVisibilityType } from '@/constants/legacy';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { resolve } from '@/facade/common';
import { broadcastFault, commonFault, createTxFault, simulateFault } from '@/facade/error';
import { getObjectMeta } from '@/facade/object';
import { genCreateObjectTx } from '@/modules/object/utils/genCreateObjectTx';
import {
  TMakePutObjectHeaders,
  makePutObjectHeaders,
} from '@/modules/object/utils/generatePubObjectOptions';
import { setupAccountRecords } from '@/store/slices/accounts';
import { setupSpMeta } from '@/store/slices/sp';
import { parseErrorXml, sleep } from '@/utils/common';
import { AuthType, CreateObjectApprovalRequest } from '@bnb-chain/greenfield-js-sdk';
import axios from 'axios';
import { isEmpty } from 'lodash-es';

interface GlobalTasksProps {}

export const GlobalObjectUploadManager = memo<GlobalTasksProps>(
  function GlobalObjectUploadManager() {
    const dispatch = useAppDispatch();
    const SP_RECOMMEND_META = useAppSelector((root) => root.apollo.SP_RECOMMEND_META);
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const spRecords = useAppSelector((root) => root.sp.spRecords);
    const objectSealingTimestamp = useAppSelector((root) => root.global.objectSealingTimestamp);
    const tempAccountRecords = useAppSelector((root) => root.accounts.tempAccountRecords);
    const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
    const hashTask = useAppSelector(selectHashTask(loginAccount));
    const signTask = useAppSelector(selectSignTask(loginAccount));
    const queue = useAppSelector(selectUploadQueue(loginAccount));

    const checksumApi = useChecksumApi();
    const [counter, setCounter] = useState(0);
    const { setOpenAuthModal, isAuthPending } = useOffChainAuth();
    const [authModal, setAuthModal] = useState(false);

    const uploadQueue = queue.filter((t) => t.status === 'UPLOAD');
    const signedQueue = queue.filter((t) => t.status === 'SIGNED');
    const uploadOffset = 1 - uploadQueue.length;
    const select1Task = useMemo(() => {
      if (uploadOffset <= 0) return [];
      return signedQueue.slice(0, uploadOffset).map((p) => p.id);
    }, [uploadOffset, signedQueue]);
    const sealQueue = queue.filter((q) => q.status === 'SEAL').map((s) => s.id);

    const runUploadTask = async (task: UploadObject) => {
      if (authModal) return;
      const { seedString } = await dispatch(getSpOffChainData(loginAccount, task.spAddress));
      const fullObjectName = [
        ...task.prefixFolders,
        task.waitObject.relativePath,
        task.waitObject.name,
      ]
        .filter((item) => !!item)
        .join('/');
      const payload: TMakePutObjectHeaders = {
        bucketName: task.bucketName,
        objectName: fullObjectName,
        body: task.waitObject.file,
        endpoint: spRecords[task.spAddress].endpoint,
        txnHash: task.createHash,
      };
      const authType = {
        type: 'EDDSA',
        seed: seedString,
        domain: window.location.origin,
        address: loginAccount,
      } as AuthType;
      const [uploadOptions, gpooError] = await makePutObjectHeaders(payload, authType).then(
        resolve,
        commonFault,
      );

      if (!uploadOptions || gpooError) {
        return dispatch(
          setupUploadTaskErrorMsg({
            account: loginAccount,
            task,
            errorMsg: gpooError,
          }),
        );
      }
      const { url, headers } = uploadOptions;
      const isFolder = task.waitObject.name.endsWith('/');
      if (isFolder) {
        dispatch(
          updateUploadStatus({
            account: loginAccount,
            ids: [task.id],
            status: 'SEAL',
          }),
        );
      } else {
        axios
          .put(url, task.waitObject.file, {
            async onUploadProgress(progressEvent) {
              const progress = Math.floor(
                (progressEvent.loaded / (progressEvent.total as number)) * 100,
              );
              await dispatch(progressFetchList(task));
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
            },
          })
          .then(async () => {
            // The connection is closed by this time.
            dispatch(updateUploadStatus({ ids: [task.id], status: 'SEAL', account: loginAccount }));
          })
          .catch(async (e: Response | any) => {
            console.error('upload error', e);
            const { message } = await parseErrorXml(e);
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
            setTimeout(() => {
              dispatch(
                setupUploadTaskErrorMsg({
                  account: loginAccount,
                  task,
                  errorMsg: authExpired
                    ? 'Authentication expired.'
                    : message || e?.message || 'upload error',
                }),
              );
            }, 200);
          });
      }
    };

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
      const finalName = [...task.prefixFolders, task.waitObject.relativePath, task.waitObject.name]
        .filter((item) => !!item)
        .join('/');
      const createObjectPayload: CreateObjectApprovalRequest = {
        bucketName: task.bucketName,
        objectName: finalName,
        creator: tempAccount.address,
        visibility: reverseVisibilityType[task.visibility],
        fileType: task.waitObject.type || 'application/octet-stream',
        contentLength: task.waitObject.size,
        expectCheckSums: task.checksum,
        duration: 5000,
      };
      const [createObjectTx, _createError] = await genCreateObjectTx(createObjectPayload, {
        type: 'ECDSA',
        privateKey: tempAccount.privateKey,
      }).then(resolve, createTxFault);
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
      if (!select1Task.length) return;
      dispatch(updateUploadStatus({ ids: select1Task, status: 'UPLOAD', account: loginAccount }));
      const tasks = queue.filter((t) => select1Task.includes(t.id));
      tasks.forEach(runUploadTask);
    }, [select1Task.join('')]);

    // 4. seal
    useAsyncEffect(async () => {
      if (!sealQueue.length) return;
      const tasks = queue.filter((t) => sealQueue.includes(t.id));

      const _tasks = await Promise.all(
        tasks.map(async (task) => {
          const { bucketName, prefixFolders, waitObject } = task;
          const objectName = [...prefixFolders, waitObject.relativePath, waitObject.name]
            .filter((item) => !!item)
            .join('/');

          const endpoint = spRecords[task.spAddress].endpoint;
          const [objectMeta, error] = await getObjectMeta(bucketName, objectName, endpoint);
          const objectStatus = objectMeta?.ObjectInfo?.ObjectStatus ?? undefined;
          const preTs = objectSealingTimestamp[task.id] || Date.now();

          // for folder object not sync to meta service
          if (error?.code === 404) {
            return 0;
          }

          if (error?.code === 429 && Date.now() - preTs < 2 * 60 * 1000) {
            await sleep(1000);
          } else if (
            error ||
            ![0, 1].includes(objectStatus as number) ||
            Date.now() - preTs > 2 * 60 * 1000
          ) {
            dispatch(
              setupUploadTaskErrorMsg({
                account: loginAccount,
                task,
                errorMsg: error?.message || 'Something went wrong.',
              }),
            );
            return -1;
          }
          if (objectStatus === 1) {
            dispatch(uploadQueueAndRefresh(task));
            const bucket = bucketRecords[task.bucketName];
            dispatch(setupAccountRecords(bucket.PaymentAddress));
          }
          return objectStatus;
        }),
      );

      if (_tasks.some((t) => t === 0)) {
        setTimeout(() => setCounter((c) => c + 1), 1500);
      }
    }, [sealQueue.join(''), counter]);

    useAsyncEffect(async () => {
      if (!loginAccount || !SP_RECOMMEND_META) return;
      dispatch(setupSpMeta());
    }, [loginAccount, SP_RECOMMEND_META]);

    return <></>;
  },
);