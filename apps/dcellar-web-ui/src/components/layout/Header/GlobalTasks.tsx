import { memo, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  progressFetchList,
  selectHashTask,
  selectUploadQueue,
  updateHashChecksum,
  updateHashStatus,
  updateUploadMsg,
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
import { headObject, queryLockFee } from '@/facade/object';
import Long from 'long';
import { formatLockFee } from '@/utils/object';

interface GlobalTasksProps {}

export const GlobalTasks = memo<GlobalTasksProps>(function GlobalTasks() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { spInfo, primarySpInfo } = useAppSelector((root) => root.sp);
  const { bucketName } = useAppSelector((root) => root.object);
  const primarySp = primarySpInfo[bucketName];
  const hashTask = useAppSelector(selectHashTask);
  const checksumApi = useChecksumApi();
  const [counter, setCounter] = useState(0);
  const queue = useAppSelector(selectUploadQueue(loginAccount));
  const upload = queue.filter((t) => t.status === 'UPLOAD');
  const wait = queue.filter((t) => t.status === 'WAIT');
  const offset = 3 - upload.length;

  const select3Task = useMemo(() => {
    if (offset <= 0) return [];
    return wait.slice(0, offset).map((p) => p.id);
  }, [offset, wait]);

  const sealQueue = queue.filter((q) => q.status === 'SEAL').map((s) => s.id);

  useAsyncEffect(async () => {
    if (!hashTask) return;
    dispatch(updateHashStatus({ id: hashTask.id, status: 'HASH' }));
    const a = performance.now();
    const res = await checksumApi?.generateCheckSumV2(hashTask.file);
    console.log('hashing time', performance.now() - a);
    const params = {
      primarySpAddress: primarySp.operatorAddress,
      createAt: Long.fromInt(Math.floor(hashTask.id / 1000)),
      payloadSize: Long.fromInt(hashTask.file.size),
    };
    const [data, error] = await queryLockFee(params);
    const { expectCheckSums } = res!;
    dispatch(
      updateHashChecksum({
        id: hashTask.id,
        checksum: expectCheckSums,
        lockFee: formatLockFee(data?.amount),
      }),
    );
  }, [hashTask, dispatch]);

  // todo refactor
  const runUploadTask = async (task: UploadFile) => {
    const domain = getDomain();
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, task.spAddress));
    const uploadOptions = await generatePutObjectOptions({
      bucketName: task.bucketName,
      objectName: [...task.folders, task.file.name].join('/'),
      body: task.file.file,
      endpoint: spInfo[task.spAddress].endpoint,
      txnHash: task.createHash,
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
        const { bucketName, folders, file } = task;
        const objectName = [...folders, file.name].join('/');
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
