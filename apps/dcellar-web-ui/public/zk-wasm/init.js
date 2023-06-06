(async function () {
  if (!WebAssembly.instantiateStreaming) { // polyfill
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
      const source = await (await resp).arrayBuffer();
      return await WebAssembly.instantiate(source, importObject);
    };
  }

  const go = new Go();

  const {module: mod, instance: inst} = await WebAssembly.instantiateStreaming(fetch("/zk-wasm/main.wasm"), go.importObject);

  async function run() {
    console.clear();

    await go.run(inst);
    inst = await WebAssembly.instantiate(mod, go.importObject); // reset instance
  }

  run();
})()
