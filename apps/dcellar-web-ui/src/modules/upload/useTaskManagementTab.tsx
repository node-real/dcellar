import { useAppSelector } from '@/store';
import { UploadObject } from '@/store/slices/global';

import { sortBy } from 'lodash-es';
import { useMemo, useState } from 'react';

export const useTaskManagementTab = () => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const objectUploadQueue = useAppSelector((root) => root.global.objectUploadQueue);

  const queue = sortBy(objectUploadQueue[loginAccount] || [], (o) => o.waitObject.time);

  const { uploadingQueue, completeQueue, errorQueue } = useMemo(() => {
    const uploadingQueue = queue?.filter((i) => ['HASH', 'UPLOAD', 'SEAL'].includes(i.status));
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
    key: 'ALL' | 'HASH-UPLOAD-SEAL' | 'FINISH' | 'ERROR-CANCEL';
    icon?: React.ReactNode;
    data: UploadObject[];
  }[] = [
    {
      title: 'All Objects',
      key: 'ALL',
      data: queue,
    },
    {
      title: 'Uploading',
      key: 'HASH-UPLOAD-SEAL',
      data: uploadingQueue,
    },
    {
      title: 'Complete',
      key: 'FINISH',
      data: completeQueue,
    },
    {
      title: 'Failed',
      key: 'ERROR-CANCEL',
      // icon: <ColoredAlertIcon width={'16px'} height={'16px'} marginRight={'4px'} />,
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
