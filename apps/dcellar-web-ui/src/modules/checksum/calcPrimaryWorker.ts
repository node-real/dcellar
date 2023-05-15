import { SHA256, lib } from 'crypto-js';

const encodePrimary = async (chunkId: number, buffer: ArrayBuffer) => {
  const wordArray = lib.WordArray.create(buffer as never);
  const primary = SHA256(wordArray).toString();

  return [chunkId, primary];
};

onmessage = async (e) => {
  const { chunkId, buffer } = e.data;

  const result = await encodePrimary(chunkId, buffer);
  postMessage({
    result,
  });
};
