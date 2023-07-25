import { memo, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  progressFetchList,
  selectHashTask,
  selectUploadQueue,
  updateHashStatus,
  updateHashTaskMsg,
  updateUploadChecksum,
  updateUploadMsg,
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
import { headObject, queryLockFee } from '@/facade/object';
import Long from 'long';
import { TCreateObject } from '@bnb-chain/greenfield-chain-sdk';
import { reverseVisibilityType } from '@/utils/constant';
import { genCreateObjectTx } from '@/modules/file/utils/genCreateObjectTx';
import { resolve } from '@/facade/common';
import { broadcastFault, createTxFault, simulateFault } from '@/facade/error';
import { isEmpty } from 'lodash-es';

interface GlobalTasksProps {}

export const GlobalTasks = memo<GlobalTasksProps>(function GlobalTasks() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { spInfo: spInfos } = useAppSelector((root) => root.sp);
  const { primarySp, bucketName} = useAppSelector((root) => root.object);
  const { tmpAccount } = useAppSelector((root) => root.global);
  const { sps: globalSps } = useAppSelector((root) => root.sp);
  const hashTask = useAppSelector(selectHashTask(loginAccount));
  console.log('hashTask', hashTask);
  const checksumApi = useChecksumApi();
  const [counter, setCounter] = useState(0);
  const queue = useAppSelector(selectUploadQueue(loginAccount));
  const upload = queue.filter((t) => t.status === 'UPLOAD');
  const ready = queue.filter((t) => t.status === 'READY');
  const offset = 3 - upload.length;

  const select3Task = useMemo(() => {
    if (offset <= 0) return [];
    return ready.slice(0, offset).map((p) => p.id);
  }, [offset, ready]);

  const sealQueue = queue.filter((q) => q.status === 'SEAL').map((s) => s.id);

  useAsyncEffect(async () => {
    if (!hashTask) return;
    dispatch(updateUploadStatus({ ids: [hashTask.id], status: 'HASH', account: loginAccount }));
    const res = await checksumApi?.generateCheckSumV2(hashTask.file.file);
    if (isEmpty(res)) {
      dispatch(updateUploadMsg({ id: hashTask.id, msg: 'calculating hash error', account: loginAccount }));
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
    debugger;
    const domain = getDomain();
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, task.sp));
    const secondarySpAddresses = globalSps
      .filter((item: any) => item.operator !== primarySp.operatorAddress)
      .map((item: any) => item.operatorAddress);
    const spInfo = {
      endpoint: primarySp.endpoint,
      primarySp: primarySp.operatorAddress,
      sealAddress: primarySp.sealAddress,
      secondarySpAddresses,
    };
    const finalName = [...task.prefixFolders, task.file.name].join('/');
    const createObjectPayload: TCreateObject = {
      bucketName,
      objectName: finalName,
      creator: tmpAccount.address,
      visibility: reverseVisibilityType[task.visibility],
      fileType: task.file.type || 'application/octet-stream',
      contentLength: task.file.size,
      expectCheckSums: task.checksum,
      spInfo,
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

    if (error) {
      console.log('error', error)
    }
    const uploadOptions = await generatePutObjectOptions({
      bucketName: task.bucketName,
      objectName: [...task.prefixFolders, task.file.name].join('/'),
      body: task.file.file,
      endpoint: spInfos[task.sp].endpoint,
      txnHash: res?.transactionHash || '',
      userAddress: loginAccount,
      domain,
      seedString,
    });
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
    });
  };

  useAsyncEffect(async () => {
    if (!select3Task.length) return;
    dispatch(updateUploadStatus({ ids: select3Task, status: 'UPLOAD', account: loginAccount }));
    const tasks = queue.filter((t) => select3Task.includes(t.id));
    tasks.forEach(runUploadTask);
  }, [select3Task.join('')]);

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
            updateUploadMsg({ id: task.id, msg: 'Something want wrong', account: loginAccount }),
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
      setTimeout(() => setCounter((c) => c + 1), 500);
    }
  }, [sealQueue.join(''), counter]);

  return <></>;
});
