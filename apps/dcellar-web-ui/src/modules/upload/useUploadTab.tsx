import { useAppSelector } from '@/store';
import { ColoredAlertIcon, ColoredErrorIcon } from '@totejs/icons';
import { useMemo, useState } from 'react';

export type TTabKey = 'ALL' | 'WAIT' | 'ERROR';

export const useTab = () => {
  const { waitQueue } = useAppSelector((root) => root.global);
  const { allLen, waitLen, errorLen } = useMemo(() => {
    const allLen = waitQueue.length;
    const waitLen = waitQueue.filter((item) => item.status === 'WAIT').length;
    const errorLen = waitQueue.filter((item) => item.status === 'ERROR').length;
    return {
      allLen,
      waitLen,
      errorLen
    }
  }, [waitQueue])
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
      icon: <ColoredAlertIcon width={'16px'} height={'16px'} marginRight={'4px'} />
    },
  ];
  const [activeKey, setActiveKey] = useState(tabOptions[0].key);

  return {
    tabOptions,
    activeKey,
    setActiveKey,
  }
};
