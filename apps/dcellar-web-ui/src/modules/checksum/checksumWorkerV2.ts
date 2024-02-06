import { Buffer } from 'buffer';
import * as Comlink from 'comlink';
import { sha256 } from 'hash-wasm';
import { values } from 'lodash-es';
import { encodeBase64 } from '@/utils/coder';

export interface WorkerApi {
  generateCheckSumV2: typeof generateCheckSumV2;
}

export type THashResult = {
  contentLength: number;
  expectCheckSums: string[];
  fileChunks: number;
};

const segmentSize = 16 * 1024 * 1024;
const dataBlocks = 4;
const parityBlocks = 2;
const WORKER_POOL_SIZE = 6;

const _createFileChunks = (file: File) => {
  if (!file.size) return [{ file }];
  const SIZE = segmentSize;
  const fileChunkList = [];
  let cur = 0;
  while (cur < file.size) {
    fileChunkList.push({ file: file.slice(cur, cur + SIZE) });
    cur += SIZE;
  }
  return fileChunkList;
};

const _generateIntegrityHash = async (list: string[]) => {
  const hex = await sha256(Buffer.from(list.join(''), 'hex'));
  return encodeBase64(Uint8Array.from(Buffer.from(hex, 'hex')));
};

const _initPrimaryWorkers = ({ consumers }: { consumers: { [k: number]: any } }) => {
  const workers = new Array(WORKER_POOL_SIZE).fill(1).map(() => {
    return new Worker(new URL('./calcPrimaryWorker', import.meta.url), {
      type: 'module',
    });
  });
  workers.forEach((it) => {
    it.onmessage = (e: MessageEvent) => {
      const { result, taskId } = e.data;
      const id = result[0];
      if (!consumers[id]) return;
      const { resolve, data, taskId: _taskId } = consumers[id];
      if (taskId !== _taskId) return;
      data[result[0]] = result[1];
      resolve();
    };
  });

  return workers;
};
const _initSecondWorkers = ({ consumers }: { consumers: { [k: number]: any } }) => {
  const workers = new Array(WORKER_POOL_SIZE).fill(1).map(() => {
    return new Worker(new URL('./calcSecondWorker', import.meta.url), {
      type: 'module',
    });
  });
  workers.forEach((it) => {
    it.onmessage = (e: MessageEvent) => {
      const { result, taskId } = e.data;
      const id = result[0];
      if (!consumers[id]) return;
      const { resolve, data, taskId: _taskId } = consumers[id];
      if (taskId !== _taskId) return;
      data[result[0]] = result[1];
      resolve();
    };
  });

  return workers;
};

// js vm instance memory will not release immediately. try reuse worker thread.
let primaryWorkers: any[] = [];
let secondWorkers: any[] = [];

const primaryWorkerConsumers: { [k: number]: any } = {};
primaryWorkers = _initPrimaryWorkers({
  consumers: primaryWorkerConsumers,
});

const secondWorkerConsumers: { [k: number]: any } = {};
secondWorkers = _initSecondWorkers({
  consumers: secondWorkerConsumers,
});

export const generateCheckSumV2 = async (file: File): Promise<THashResult> => {
  if (!file) return {} as THashResult;

  const taskId = Date.now();
  let checkSumRes: THashResult;

  values(primaryWorkerConsumers).forEach((r: any) => r.resolve());
  values(secondWorkerConsumers).forEach((r: any) => r.resolve());

  try {
    const fileChunks = _createFileChunks(file);
    const secondResults: any[] = [];
    const primaryResults: any[] = [];

    const segments = fileChunks.map(async (fileItem, chunkId) => {
      const buffer = await fileItem.file.arrayBuffer();

      const primaryPromise = new Promise((resolve) => {
        primaryWorkerConsumers[chunkId] = {
          resolve,
          data: primaryResults,
          taskId,
        };

        const workerIdx = chunkId % WORKER_POOL_SIZE;
        primaryWorkers[workerIdx].postMessage({ chunkId, buffer, taskId });
      });

      // shards
      const shardsPromise = new Promise((resolve) => {
        secondWorkerConsumers[chunkId] = {
          resolve,
          data: secondResults,
          taskId,
        };

        const workerIdx = chunkId % WORKER_POOL_SIZE;
        secondWorkers[workerIdx].postMessage({ chunkId, buffer, dataBlocks, parityBlocks, taskId });
      });

      return Promise.all([shardsPromise, primaryPromise]);
    });

    await Promise.all(segments);

    const combinedShards: any[] = [];
    secondResults.forEach((items, idx) => {
      items.forEach((child: never, childIdx: number) => {
        if (!combinedShards[childIdx]) {
          combinedShards[childIdx] = [];
        } else if (!combinedShards[childIdx][idx]) {
          combinedShards[childIdx][idx] = [];
        }
        combinedShards[childIdx][idx] = child[0];
      });
    });

    const primaryCheckSum = await _generateIntegrityHash(primaryResults as any);
    const secondsCheckSum = await Promise.all(
      combinedShards.map((it: any) => _generateIntegrityHash(it)),
    );
    const value = [primaryCheckSum].concat(secondsCheckSum);
    checkSumRes = {
      fileChunks: fileChunks.length,
      contentLength: file.size,
      expectCheckSums: value,
    };
  } catch (e) {
    console.error('check sum error', e);
  }

  return checkSumRes!;
};

Comlink.expose({
  generateCheckSumV2,
});
