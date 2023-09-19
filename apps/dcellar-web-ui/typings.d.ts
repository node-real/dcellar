/// <reference types="redux-persist" />

declare global {
  interface Window {
    web3: any;
    ethereum: any;
    ga: any;
    clipboardData: any;
    trustWallet: any;
    trustwallet: any;
    // zk.wasm export
    eddsaSign: any;
  }
}
