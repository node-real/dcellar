const assetPrefix = process.env.NEXT_PUBLIC_STATIC_HOST || '';
// @ts-ignore
globalThis.importScripts(`${assetPrefix}/wasm/wasm_exec.js`);

type GlobalScope = typeof globalThis & {
  Go: any;
  greenfieldSdk: any;
} & EventTarget;

const globalScope = globalThis as GlobalScope;

const go = new globalScope.Go();
let isReady = false;
WebAssembly.instantiateStreaming(
  globalScope.fetch(`${assetPrefix}/wasm/hash.wasm`),
  go.importObject,
).then(async (result) => {
  go.run(result.instance);
  isReady = true;
});

// eslint-disable-next-line no-restricted-globals
globalScope.addEventListener('message', (e) => {
  const bytes = e.data;
  const segmentSize = 16 * 1024 * 1024;
  const dataBlocks = 4;
  const parityBlocks = 2;
  const loadHashResult = async () => {
    const hashResult = await globalScope.greenfieldSdk.getCheckSums(
      bytes,
      segmentSize,
      dataBlocks,
      parityBlocks,
    );
    const { contentLength, expectCheckSums } = hashResult;
    globalScope.postMessage({
      contentLength,
      expectCheckSums: JSON.parse(expectCheckSums),
    });
  };
  const intervalId = setInterval(function () {
    if (isReady) {
      loadHashResult();
      clearInterval(intervalId);
    }
  }, 100);
});
