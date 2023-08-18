import { memo, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  progressFetchList,
  selectHashTask,
  selectUploadQueue,
  setupUploadTaskErrorMsg,
  updateUploadChecksum,
  updateUploadProgress,
  updateUploadStatus,
  UploadFile,
  uploadQueueAndRefresh,
} from '@/store/slices/global';
import { useChecksumApi } from '@/modules/checksum';
import { useAsyncEffect } from 'ahooks';
import { getDomain } from '@/utils/getDomain';
import { getSpOffChainData } from '@/store/slices/persist';
import { generatePutObjectOptions } from '@/modules/file/utils/generatePubObjectOptions';
import axios from 'axios';
import { headObject } from '@/facade/object';
import { TCreateObject } from '@bnb-chain/greenfield-js-sdk';
import { reverseVisibilityType } from '@/utils/constant';
import { genCreateObjectTx } from '@/modules/file/utils/genCreateObjectTx';
import { resolve } from '@/facade/common';
import { broadcastFault, commonFault, createTxFault, simulateFault } from '@/facade/error';
import { parseErrorXml } from '@/utils/common';
import { isEmpty, keyBy } from 'lodash-es';

interface GlobalTasksProps {}

export const GlobalTasks = memo<GlobalTasksProps>(function GlobalTasks() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { spInfo } = useAppSelector((root) => root.sp);
  const { tmpAccount } = useAppSelector((root) => root.global);
  const hashTask = useAppSelector(selectHashTask(loginAccount));
  const checksumApi = useChecksumApi();
  const [counter, setCounter] = useState(0);
  const queue = useAppSelector(selectUploadQueue(loginAccount));
  const folderInfos = keyBy(queue.filter((q) => q.waitFile.name.endsWith('/')), 'name');
  const upload = queue.filter((t) => t.status === 'UPLOAD');
  const ready = queue.filter((t) => {
    const isFolder = t.waitFile.name.endsWith('/');
    const parentFolder = isFolder ? t.waitFile.name.split('/').slice(0, -1).join('/') + '/' : t.waitFile.relativePath + '/';
    if (!folderInfos[parentFolder]) {
      return t.status === 'READY';
    }
    if (t.waitFile.relativePath && folderInfos[parentFolder]) {
      return folderInfos[parentFolder].status === 'FINISH' && t.status === 'READY';
    }
  });
  const offset = 1 - upload.length;

  const select1Task = useMemo(() => {
    if (offset <= 0) return [];
    return ready.slice(0, offset).map((p) => p.id);
  }, [offset, ready]);

  const sealQueue = queue.filter((q) => q.status === 'SEAL').map((s) => s.id);

  useAsyncEffect(async () => {
    if (!hashTask) return;
    dispatch(updateUploadStatus({ ids: [hashTask.id], status: 'HASH', account: loginAccount }));
    const a = performance.now();
    const res = await checksumApi?.generateCheckSumV2(hashTask.waitFile.file);
    console.log('hashing time', performance.now() - a);
    if (isEmpty(res)) {
      return dispatch(setupUploadTaskErrorMsg({
        account: loginAccount,
        task: hashTask,
        errorMsg: 'calculating hash error',
      }))
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

  // todo refactor
  const runUploadTask = async (task: UploadFile) => {
    // 1. get approval from sp
    const domain = getDomain();
    const isFolder = task.waitFile.name.endsWith('/');
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, task.spAddress));
    const finalName = [...task.prefixFolders, task.waitFile.relativePath, task.waitFile.name].filter(item => !!item).join('/');
    const createObjectPayload: TCreateObject = {
      bucketName: task.bucketName,
      objectName: finalName,
      creator: tmpAccount.address,
      visibility: reverseVisibilityType[task.visibility],
      fileType: task.waitFile.type || 'application/octet-stream',
      contentLength: task.waitFile.size,
      expectCheckSums: task.checksum,
      signType: 'authTypeV1',
      privateKey: tmpAccount.privateKey,
    };
    const [createObjectTx, _createError] = await genCreateObjectTx(createObjectPayload).then(
      resolve,
      createTxFault,
    );
    if (_createError) {
      return dispatch(setupUploadTaskErrorMsg({
        account: loginAccount,
        task,
        errorMsg: _createError,
      }))
    }

    const [simulateInfo, simulateError] = await createObjectTx!
      .simulate({
        denom: 'BNB',
      })
      .then(resolve, simulateFault);
    if (!simulateInfo || simulateError) {
      return dispatch(setupUploadTaskErrorMsg({
        account: loginAccount,
        task,
        errorMsg: simulateError,
      }))
    }

    const broadcastPayload = {
      denom: 'BNB',
      gasLimit: Number(simulateInfo?.gasLimit),
      gasPrice: simulateInfo?.gasPrice || '5000000000',
      payer: tmpAccount.address,
      granter: loginAccount,
      privateKey: tmpAccount.privateKey,
    };
    const [res, error] = await createObjectTx!
      .broadcast(broadcastPayload)
      .then(resolve, broadcastFault);
    if (!res || error) {
      return dispatch(setupUploadTaskErrorMsg({
        account: loginAccount,
        task,
        errorMsg: error,
      }))
    }
    const fullObjectName = [...task.prefixFolders, task.waitFile.relativePath, task.waitFile.name].filter(item => !!item).join('/');
    const payload = {
      bucketName: task.bucketName,
      objectName: fullObjectName,
      body: task.waitFile.file,
      endpoint: spInfo[task.spAddress].endpoint,
      txnHash: res.transactionHash,
      userAddress: loginAccount,
      domain,
      seedString,
    }
    const [uploadOptions, gpooError] = await generatePutObjectOptions(payload).then(resolve, commonFault);

    if (!uploadOptions || gpooError) {
      return dispatch(setupUploadTaskErrorMsg({
        account: loginAccount,
        task,
        errorMsg: gpooError,
      }))
    }
    const { url, headers } = uploadOptions;
    if (isFolder) {
      dispatch(updateUploadStatus({
        account: loginAccount,
        ids: [task.id],
        status: 'SEAL',
      }));
    } else {
      axios.put(url, task.waitFile.file, {
        async onUploadProgress(progressEvent) {
          const progress = Math.round((progressEvent.loaded / (progressEvent.total as number)) * 100);
          await dispatch(progressFetchList(task));
          dispatch(updateUploadProgress({ account: loginAccount, id: task.id, progress }));
        },
        headers: {
          Authorization: headers.get('Authorization'),
          'X-Gnfd-Txn-hash': headers.get('X-Gnfd-Txn-hash'),
          'X-Gnfd-User-Address': headers.get('X-Gnfd-User-Address'),
          'X-Gnfd-App-Domain': headers.get('X-Gnfd-App-Domain'),
        },
      }).catch(async (e: Response | any) => {
        const {message} = await parseErrorXml(e)
        dispatch(setupUploadTaskErrorMsg({
          account: loginAccount,
          task,
          errorMsg: message || e?.message || 'upload error',
        }))
      })
    };
  }
  useAsyncEffect(async () => {
    if (!select1Task.length) return;
    dispatch(updateUploadStatus({ ids: select1Task, status: 'UPLOAD', account: loginAccount }));
    const tasks = queue.filter((t) => select1Task.includes(t.id));
    tasks.forEach(runUploadTask);
  }, [select1Task.join('')]);

  useAsyncEffect(async () => {
    if (!sealQueue.length) return;
    const tasks = queue.filter((t) => sealQueue.includes(t.id));

    const _tasks = await Promise.all(
      tasks.map(async (task) => {
        const { bucketName, prefixFolders, waitFile } = task;
        const objectName = [...prefixFolders, waitFile.relativePath, waitFile.name].filter(item => !!item).join('/');
        const objectInfo = await headObject(bucketName, objectName);

        if (!objectInfo || ![0, 1].includes(objectInfo.objectStatus)) {
          dispatch(setupUploadTaskErrorMsg({
            account: loginAccount,
            task,
            errorMsg: 'Something went wrong.',
          }))
          return -1;
        }
        if (objectInfo.objectStatus === 1) {
          dispatch(uploadQueueAndRefresh(task));
        }
        return objectInfo.objectStatus;
      }),
    );

    if (_tasks.some((t) => t === 0)) {
      setTimeout(() => setCounter((c) => c + 1), 1500);
    }
  }, [sealQueue.join(''), counter]);

  return <></>;
});
