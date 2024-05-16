import { useAppSelector } from '@/store';
import { UPLOADING_STATUSES, UploadObject } from '@/store/slices/global';

import { sortBy } from 'lodash-es';
import { useMemo, useState } from 'react';

export enum UploadingPanelKey {
  ALL = 'ALL',
  UPLOADING = 'RETRY-WAIT-HASH-UPLOAD-SIGN-SEAL',
  STOPPED = 'CANCEL',
  COMPLETE = 'FINISH',
  FAILED = 'ERROR',
}

export const useTaskManagementTab = () => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const objectUploadQueue = useAppSelector((root) => root.global.objectUploadQueue);

  const queue = sortBy(objectUploadQueue[loginAccount] || [], (o) => o.waitObject.time);

  const { uploadingQueue, stoppedQueue, completeQueue, errorQueue } = useMemo(() => {
    const uploadingQueue = queue?.filter((i) => UPLOADING_STATUSES.includes(i.status));
    const completeQueue = queue?.filter((i) => i.status === 'FINISH');
    const stoppedQueue = queue?.filter((i) => i.status === 'CANCEL');
    const errorQueue = queue?.filter((i) => ['ERROR'].includes(i.status));
    return {
      uploadingQueue,
      stoppedQueue,
      completeQueue,
      errorQueue,
    };
  }, [queue]);

  const tabOptions: {
    title: string;
    key: UploadingPanelKey;
    icon?: React.ReactNode;
    data: UploadObject[];
  }[] = [
    {
      title: 'All Objects',
      key: UploadingPanelKey.ALL,
      data: queue,
    },
    {
      title: 'Uploading',
      key: UploadingPanelKey.UPLOADING,
      data: uploadingQueue,
    },
    {
      title: 'Stopped',
      key: UploadingPanelKey.STOPPED,
      data: stoppedQueue,
    },
    {
      title: 'Complete',
      key: UploadingPanelKey.COMPLETE,
      data: completeQueue,
    },
    {
      title: 'Failed',
      key: UploadingPanelKey.FAILED,
      data: errorQueue,
    },
  ];

  const [activeKey, setActiveKey] = useState(tabOptions[0].key);

  return {
    queue,
    tabOptions,
    activeKey,
    setActiveKey,
  };
};
