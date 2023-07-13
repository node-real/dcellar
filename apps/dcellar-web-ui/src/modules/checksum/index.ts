import { WorkerApi } from '@/modules/checksum/checksumWorkerV2';
import * as Comlink from 'comlink';
import { useMount } from 'ahooks';

const getChecksumApi = () => {
  const worker = new Worker(new URL('@/modules/checksum/checksumWorkerV2.ts', import.meta.url), {
    type: 'module',
  });
  return Comlink.wrap<WorkerApi>(worker);
};

let api: Comlink.Remote<WorkerApi> | null = null;

// todo refactor
export const useChecksumApi = () => {
  useMount(() => {
    api = api || getChecksumApi();
  });

  return api;
};
