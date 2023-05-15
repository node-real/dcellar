import { SHA256, enc } from 'crypto-js';
globalThis.importScripts('/wasm/wasm_exec.js');

const { Base64 } = enc;

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

  shards.forEach((shard: never, idx: number) => {
    const words = Base64.parse(shard);
    if (!results[idx]) {
      results[idx] = [];
    }
    results[idx].unshift(SHA256(words).toString());
  });

  return [chunkId, results];
};

onmessage = async (e) => {
  const { chunkId, buffer, dataBlocks, parityBlocks } = e.data;

  const result = await encodeRawSegment(chunkId, buffer, dataBlocks, parityBlocks);
  postMessage({
    result,
  });
};
