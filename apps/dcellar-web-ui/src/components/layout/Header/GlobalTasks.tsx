import { memo, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  progressFetchList,
  selectHashTask,
  selectUploadQueue,
  updateUploadChecksum,
  updateUploadProgress,
  updateUploadStatus,
  updateUploadTaskMsg,
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
import { TCreateObject } from '@bnb-chain/greenfield-chain-sdk';
import { reverseVisibilityType } from '@/utils/constant';
import { genCreateObjectTx } from '@/modules/file/utils/genCreateObjectTx';
import { resolve } from '@/facade/common';
import { broadcastFault, commonFault, createTxFault, simulateFault } from '@/facade/error';
import { isEmpty } from 'lodash-es';

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
  const upload = queue.filter((t) => t.status === 'UPLOAD');
  const ready = queue.filter((t) => t.status === 'READY');
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
    const res = await checksumApi?.generateCheckSumV2(hashTask.file.file);
    console.log('hashing time', performance.now() - a);
    if (isEmpty(res)) {
      dispatch(updateUploadTaskMsg({ id: hashTask.id, msg: 'calculating hash error', account: loginAccount }));
      return;
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
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, task.spAddress));
    const finalName = [...task.prefixFolders, task.file.name].join('/');
    const createObjectPayload: TCreateObject = {
      bucketName: task.bucketName,
      objectName: finalName,
      creator: tmpAccount.address,
      visibility: reverseVisibilityType[task.visibility],
      fileType: task.file.type || 'application/octet-stream',
      contentLength: task.file.size,
      expectCheckSums: task.checksum,
      signType: 'authTypeV1',
      privateKey: tmpAccount.privateKey,
    };
    const [createObjectTx, _createError] = await genCreateObjectTx(createObjectPayload).then(
      resolve,
      createTxFault,
    );
    if (_createError) {
      return dispatch(updateUploadTaskMsg({
        account: loginAccount,
        id: task.id,
        msg: _createError,
      }))
    }

    const [simulateInfo, simulateError] = await createObjectTx!
      .simulate({
        denom: 'BNB',
      })
      .then(resolve, simulateFault);
    if (!simulateInfo || simulateError) {
      return dispatch(updateUploadTaskMsg({
        account: loginAccount,
        id: task.id,
        msg: simulateError,
      }));
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
      dispatch(updateUploadTaskMsg({
        account: loginAccount,
        id: task.id,
        msg: error,
      }));
      return;
    }
    const [uploadOptions, gpooError] = await generatePutObjectOptions({
      bucketName: task.bucketName,
      objectName: [...task.prefixFolders, task.file.name].join('/'),
      body: task.file.file,
      endpoint: spInfo[task.spAddress].endpoint,
      txnHash: res.transactionHash,
      userAddress: loginAccount,
      domain,
      seedString,
    }).then(resolve, commonFault);

    if (!uploadOptions || gpooError) {
      return dispatch(updateUploadTaskMsg({
        account: loginAccount,
        id: task.id,
        msg: gpooError,
      }));
    }
    const { url, headers } = uploadOptions;
    axios.put(url, task.file.file, {
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
    }).catch(e => {
      console.log('upload error', e);
      dispatch(updateUploadTaskMsg({
        account: loginAccount,
        id: task.id,
        msg: e?.message || 'Upload error',
      }));
    })
  };

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
        const { bucketName, prefixFolders, file } = task;
        const objectName = [...prefixFolders, file.name].join('/');
        const objectInfo = await headObject(bucketName, objectName);
        if (!objectInfo || ![0, 1].includes(objectInfo.objectStatus)) {
          dispatch(
            updateUploadTaskMsg({ id: task.id, msg: 'Something went wrong.', account: loginAccount }),
          );
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
