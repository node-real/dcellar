import { useMemo, useState } from 'react';

import { useAppSelector } from '@/store';
import { errorUploadFilterFn, waitUploadFilterFn } from '@/utils/object';

export type TTabKey = 'ALL' | 'WAIT' | 'ERROR';

export const useUploadTab = () => {
  const objectWaitQueue = useAppSelector((root) => root.global.objectWaitQueue);

  const { allLen, waitLen, errorLen } = useMemo(() => {
    const allLen = objectWaitQueue.length;
    const waitLen = objectWaitQueue.filter(waitUploadFilterFn).length;
    const errorLen = objectWaitQueue.filter(errorUploadFilterFn).length;
    return {
      allLen,
      waitLen,
      errorLen,
    };
  }, [objectWaitQueue]);

  const tabOptions: {
    title: string;
    key: TTabKey;
    len: number;
    icon?: React.ReactNode;
  }[] = [
    {
      title: 'All Objects',
      key: 'ALL',
      len: allLen,
    },
    {
      title: 'Awaiting Upload',
      key: 'WAIT',
      len: waitLen,
    },
    {
      title: 'Error',
      key: 'ERROR',
      len: errorLen,
      // icon: <ColoredAlertIcon width={'16px'} height={'16px'} marginRight={'4px'} />
    },
  ];
  const [activeKey, setActiveKey] = useState(tabOptions[0].key);

  return {
    tabOptions,
    activeKey,
    setActiveKey,
  };
};
