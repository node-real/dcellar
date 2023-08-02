import { useAppSelector } from '@/store';
import { TUploadStatus, UploadFile } from '@/store/slices/global';
import { ColoredAlertIcon } from '@totejs/icons';

import { sortBy } from 'lodash-es';
import { useMemo, useState } from 'react';

export type TTabKey = TUploadStatus;

export const useTaskManagementTab = () => {
  const { uploadQueue } = useAppSelector((root) => root.global);
  const { loginAccount } = useAppSelector((root) => root.persist);
  // const queue = sortBy(uploadQueue[loginAccount] || [], [
  //   (o) => {
  //     switch (o.status) {
  //       case 'SEAL':
  //         return 0;
  //       case 'UPLOAD':
  //         return 1;
  //       case 'HASH':
  //         return 1;
  //       case 'READY':
  //         return 1;
  //       case 'WAIT':
  //         return 2;
  //       case 'FINISH':
  //         return 3;
  //       case 'ERROR':
  //         return 4;
  //     }
  //   },
  // ]);
  const queue = sortBy(uploadQueue[loginAccount] || [], (o) => o.file.time);
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
    data: UploadFile[];
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
