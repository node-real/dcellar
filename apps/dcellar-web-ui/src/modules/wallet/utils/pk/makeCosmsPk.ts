import { toBuffer } from '@ethereumjs/util';

import { PubKey } from './PubKey';

/**
 * @pk public key from metamask
 */
export const makeCosmsPubKey = (pk: string) => {
  const pubKeyVal = new PubKey({
    key: toBuffer(pk),
  });

  return {
    typeUrl: '/ethermint.crypto.v1.ethsecp256k1.PubKey',
    value: pubKeyVal.serializeBinary(),
  };
};
