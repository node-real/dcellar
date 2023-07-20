(async function () {
  if (!WebAssembly.instantiateStreaming) {
    // polyfill
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
      const source = await (await resp).arrayBuffer();
      return await WebAssembly.instantiate(source, importObject);
    };
  }

  const go = new Go();

  const { module: mod, instance: inst } = await WebAssembly.instantiateStreaming(
    fetch(`${window.__ASSET_PREFIX}/wasm/zk-main.wasm`),
    go.importObject,
  );

  async function run() {
    await go.run(inst);
    await WebAssembly.instantiate(mod, go.importObject); // reset instance
  }

  run();
})();

// for main.wasm
(async () => {
  const go = new Go();
  const fetchPromise = fetch(`${window.__ASSET_PREFIX}/wasm/main.wasm`);
  await WebAssembly.instantiateStreaming(fetchPromise, go.importObject);
})();
