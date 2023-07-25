import { useAppSelector } from '@/store';
import { TUploadStatus, UploadFile } from '@/store/slices/global';
import { ColoredAlertIcon } from '@totejs/icons';

import { sortBy } from 'lodash-es';
import { useMemo, useState } from 'react';

export type TTabKey = TUploadStatus;

export const useTaskManagementTab = () => {
  const { uploadQueue } = useAppSelector((root) => root.global);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const queue = sortBy(uploadQueue[loginAccount] || [], [
    (o) => {
      switch (o.status) {
        case 'SEAL':
          return 0;
        case 'UPLOAD':
          return 1;
        case 'HASH':
          return 1;
        case 'READY':
          return 1;
        case 'WAIT':
          return 2;
        case 'FINISH':
          return 3;
        case 'ERROR':
          return 4;
      }
    },
  ]);
  const { uploadingQueue, completeQueue, errorQueue } = useMemo(() => {
    const uploadingQueue = queue?.filter((i) => i.status === 'UPLOAD' || i.status === 'FINISH');
    const completeQueue = queue?.filter((i) => i.status === 'SEAL');
    const errorQueue = queue?.filter((i) => i.status === 'ERROR');
    return {
      uploadingQueue,
      completeQueue,
      errorQueue,
    };
  }, [queue]);

  const tabOptions: {
    title: string;
    key: TUploadStatus | 'ALL';
    icon?: React.ReactNode;
    data: UploadFile[];
  }[] = [
    {
      title: 'All Objects',
      key: 'ALL',
      data: queue,
    },
    {
      title: 'Uploading',
      key: 'UPLOAD',
      data: uploadingQueue,
    },
    {
      title: 'Complete',
      key: 'SEAL',
      data: completeQueue,
    },
    {
      title: 'Failed',
      key: 'ERROR',
      icon: <ColoredAlertIcon width={'16px'} height={'16px'} marginRight={'4px'} />,
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
