import { Buffer } from 'buffer';
import { sha256 } from 'hash-wasm';
import { values } from 'lodash-es';
import { encodeBase64 } from '@/utils/coder';
import { useMount } from 'ahooks';

export type THashResult = {
  contentLength: number;
  expectCheckSums: string[];
  fileChunks: number;
};

export function checksum() {
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

  const primaryWorkerScript = `
  importScripts('https://unpkg.com/hash-wasm@4.11.0/dist/sha256.umd.min.js')

  const encodePrimary = async (chunkId, buffer) => {
    const primary = await hashwasm.sha256(new Uint8Array(buffer));
    return [chunkId, primary];
  };

  onmessage = async (e) => {
    const { chunkId, buffer, taskId } = e.data;

    const result = await encodePrimary(chunkId, buffer);

    postMessage({
      result,
      taskId,
    });
  };

  `
  const _initPrimaryWorkers = ({ consumers }: { consumers: { [k: number]: any } }) => {
    const workers = new Array(WORKER_POOL_SIZE).fill(1).map(() => {
      // return new Worker(new URL('./calcPrimaryWorker', import.meta.url));
      return new Worker(URL.createObjectURL(new Blob([primaryWorkerScript], { type: "text/javascript" })));
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

  const workerScript = `
  importScripts('https://unpkg.com/hash-wasm@4.11.0/dist/sha256.umd.min.js')
  importScripts("https://unpkg.com/comlink/dist/umd/comlink.js");
  importScripts('https://dcellar.io/static/dcellar-web-ui/wasm/wasm_exec.js');
  function encodeBase64(data, pad) {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const len = data.length;
    const extraBytes = len % 3;
    const parts = [];

    const len2 = len - extraBytes;
    for (let i = 0; i < len2; i += 3) {
      const tmp = ((data[i] << 16) & 0xff0000) + ((data[i + 1] << 8) & 0xff00) + (data[i + 2] & 0xff);

      const triplet =
        base64Chars.charAt((tmp >> 18) & 0x3f) +
        base64Chars.charAt((tmp >> 12) & 0x3f) +
        base64Chars.charAt((tmp >> 6) & 0x3f) +
        base64Chars.charAt(tmp & 0x3f);

      parts.push(triplet);
    }

    if (extraBytes === 1) {
      const tmp = data[len - 1];
      const a = base64Chars.charAt(tmp >> 2);
      const b = base64Chars.charAt((tmp << 4) & 0x3f);
      const res = a + b;
      parts.push(res);
      if (pad) {
        parts.push('==');
      }
    } else if (extraBytes === 2) {
      const tmp = (data[len - 2] << 8) + data[len - 1];
      const a = base64Chars.charAt(tmp >> 10);
      const b = base64Chars.charAt((tmp >> 4) & 0x3f);
      const c = base64Chars.charAt((tmp << 2) & 0x3f);
      const res = a + b + c
      parts.push(res);
      if (pad) {
        parts.push('=');
      }
    }

    return parts.join('');
  }

  const init = async () => {
    const go = new Go();
    const result = await WebAssembly.instantiateStreaming(
      fetch('https://dcellar.io/static/dcellar-web-ui/wasm/main.wasm'),
      go.importObject,
    );
    if (result) {
      go.run(result.instance);
      // Ensure hash-wasm initial success,
      // Otherwise, after the browser finishes loading the page,
      // the user immediately uploads a large object,
      // and hash-wasm has a certain probability of initialization failure due to memory problems in chrome.
      await hashwasm.sha256('');
    }
  };

  init();

  const encodeRawSegment = async (
    chunkId,
    buffer,
    dataBlocks,
    parityBlocks,
  ) => {
    const results = [];
    const bytes = new Uint8Array(buffer);

    if (typeof greenfieldSdk === 'undefined') {
      await init();
    }
    const result = greenfieldSdk.encodeRawSegment(bytes, dataBlocks, parityBlocks);
    const shards = JSON.parse(result.result);

    // Empty chunks should also return digest arrays of the corresponding length.
    await Promise.all(
      shards.map(async (shard, idx) => {
        if (!results[idx]) {
          results[idx] = [];
        }
        // const hex = await hashwasm.sha256(encodeBase64(shard || ''));
        const hex = await hashwasm.sha256(encodeBase64(shard || ''));
        results[idx].unshift(hex);
      }),
    );

    return [chunkId, results];
  };

  onmessage = async (e) => {
    const { chunkId, buffer, dataBlocks, parityBlocks, taskId } = e.data;

    const result = await encodeRawSegment(chunkId, buffer, dataBlocks, parityBlocks);

    postMessage({
      result,
      taskId,
    });
  };
  `;

  const _initSecondWorkers = ({ consumers }: { consumers: { [k: number]: any } }) => {
    const workers = new Array(WORKER_POOL_SIZE).fill(1).map(() => {
      // return new Worker(new URL('./calcSecondWorker', import.meta.url));
      return new Worker(URL.createObjectURL(new Blob([workerScript], { type: "text/javascript" })));
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

  const generateCheckSumV2 = async (file: File): Promise<THashResult> => {
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
      console.log('check sum error', e);
    }

    return checkSumRes!;
  };

  return {
    generateCheckSumV2
  };
}

let api: { generateCheckSumV2: Function } | null = null;

export const useChecksumApi = () => {
  useMount(() => {
    api = api || checksum();
  });

  return api;
};
