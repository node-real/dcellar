import { sha256 } from 'hash-wasm';
import { decodeBase64 } from '@/utils/base64';
globalThis.importScripts('/wasm/wasm_exec.js');

declare global {
  const Go: new () => { run: (x: WebAssembly.Instance) => void; importObject: WebAssembly.Imports };
  const greenfieldSdk: {
    getCheckSums: (b: Uint8Array, seg: number, db: number, pb: number) => void;
    encodeRawSegment: (b: Uint8Array, db: number, pb: number) => { result: string };
  };
}

const init = async () => {
  const go = new Go();
  const result = await WebAssembly.instantiateStreaming(fetch('/wasm/main.wasm'), go.importObject);
  if (result) {
    go.run(result.instance);
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
  const { chunkId, buffer, dataBlocks, parityBlocks } = e.data;

  const result = await encodeRawSegment(chunkId, buffer, dataBlocks, parityBlocks);
  postMessage({
    result,
  });
};
