(async function () {
  if (!WebAssembly.instantiateStreaming) {
    // polyfill
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
      const source = await (await resp).arrayBuffer();
      return await WebAssembly.instantiate(source, importObject);
    };
  }
})();

// for main.wasm
(async () => {
  const go = new Go();
  const fetchPromise = fetch(`${window.__ASSET_PREFIX}/wasm/main.wasm`);
  await WebAssembly.instantiateStreaming(fetchPromise, go.importObject);
})();
