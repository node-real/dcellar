import { useAppSelector } from '@/store';
import { UploadObject } from '@/store/slices/global';

import { sortBy } from 'lodash-es';
import { useMemo, useState } from 'react';

export enum UploadingPanelKey {
  ALL = 'ALL',
  UPLOADING = 'HASH-UPLOAD-SEAL',
  COMPLETE = 'FINISH',
  FAILED = 'ERROR-CANCEL',
}

export const useTaskManagementTab = () => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const objectUploadQueue = useAppSelector((root) => root.global.objectUploadQueue);

  const queue = sortBy(objectUploadQueue[loginAccount] || [], (o) => o.waitObject.time);

  const { uploadingQueue, completeQueue, errorQueue } = useMemo(() => {
    const uploadingQueue = queue?.filter((i) =>
      ['HASH', 'UPLOAD', 'SEAL', 'SEALING'].includes(i.status),
    );
    const completeQueue = queue?.filter((i) => i.status === 'FINISH');
    const errorQueue = queue?.filter((i) => ['ERROR', 'CANCEL'].includes(i.status));
    return {
      uploadingQueue,
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
