import { sha256 } from 'hash-wasm';
import { decodeBase64 } from '@/utils/coder';

const isProd = process.env.NODE_ENV === 'production';
globalThis.importScripts(`${isProd ? '/static/dcellar-web-ui' : ''}/wasm/wasm_exec.js`);

declare global {
  const Go: new () => { run: (x: WebAssembly.Instance) => void; importObject: WebAssembly.Imports };
  const greenfieldSdk: {
    getCheckSums: (b: Uint8Array, seg: number, db: number, pb: number) => void;
    encodeRawSegment: (b: Uint8Array, db: number, pb: number) => { result: string };
  };
}

const init = async () => {
  const go = new Go();
  const result = await WebAssembly.instantiateStreaming(
    fetch(`${isProd ? '/static/dcellar-web-ui' : ''}/wasm/main.wasm`),
    go.importObject,
  );
  if (result) {
    go.run(result.instance);
    // Ensure hash-wasm initial success,
    // Otherwise, after the browser finishes loading the page,
    // the user immediately uploads a large object,
    // and hash-wasm has a certain probability of initialization failure due to memory problems in chrome.
    await sha256('');
  }
};

init();

const encodeRawSegment = async (
  chunkId: number,
  buffer: ArrayBuffer,
  dataBlocks: number,
  parityBlocks: number,
) => {
  const results: [string?][] = [];
  const bytes = new Uint8Array(buffer);

  if (typeof greenfieldSdk === 'undefined') {
    await init();
  }
  const result = greenfieldSdk.encodeRawSegment(bytes, dataBlocks, parityBlocks);
  const shards = JSON.parse(result.result);

  // Empty chunks should also return digest arrays of the corresponding length.
  await Promise.all(
    shards.map(async (shard: never, idx: number) => {
      if (!results[idx]) {
        results[idx] = [];
      }
      const hex = await sha256(decodeBase64(shard || ''));
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
