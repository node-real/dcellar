if (!WebAssembly.instantiateStreaming) {
  // polyfill
  WebAssembly.instantiateStreaming = async (resp, importObject) => {
    const source = await (await resp).arrayBuffer();
    return await WebAssembly.instantiate(source, importObject);
  };
}

(async () => {
  const go = new Go();
  const moduleBytes = fetch(`${window.__ASSET_PREFIX}/wasm/zk.wasm`);
  const module = await WebAssembly.instantiateStreaming(moduleBytes, go.importObject);

  go.run(module.instance);
})();

(async () => {
  const go = new Go();
  const moduleBytes = fetch(`${window.__ASSET_PREFIX}/wasm/hash.wasm`);
  const module = await WebAssembly.instantiateStreaming(moduleBytes, go.importObject);

  go.run(module.instance);
})();