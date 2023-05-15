import { utils } from 'ethers';
import { ISignature712 } from '@bnb-chain/gnfd-js-sdk';

/**
 * recover public key from signature
 */
export const recoverPk = ({ messageHash, signature }: ISignature712) => {
  const pk = utils.recoverPublicKey(messageHash, signature);
  return utils.computePublicKey(pk, true);
};
