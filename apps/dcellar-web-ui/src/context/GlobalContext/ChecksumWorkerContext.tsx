import { createContext, MutableRefObject, PropsWithChildren, useEffect, useRef } from 'react';
import * as Comlink from 'comlink';
import { WorkerApi } from '@/modules/checksum/checksumWorkerV2';

type WorkerContextType = Comlink.Remote<WorkerApi>;

export const ChecksumWorkerContext = createContext({} as MutableRefObject<WorkerContextType>);

export const ChecksumWorkerProvider = ({ children }: PropsWithChildren) => {
  const checksumWorkerRef = useRef<Worker>();
  const checksumWorkerApiRef = useRef<Comlink.Remote<WorkerApi>>({} as WorkerContextType);

  useEffect(() => {
    if (checksumWorkerRef.current) return;

    checksumWorkerRef.current = new Worker(
      new URL('@/modules/checksum/checksumWorkerV2.ts', import.meta.url),
      { type: 'module' },
    );
    checksumWorkerApiRef.current = Comlink.wrap<WorkerApi>(checksumWorkerRef.current);

    return () => {
      checksumWorkerRef.current?.terminate();
    };
  }, []);

  return (
    <ChecksumWorkerContext.Provider value={checksumWorkerApiRef}>
      {children}
    </ChecksumWorkerContext.Provider>
  );
};
