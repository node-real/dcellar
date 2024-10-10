import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { runtimeEnv } from '@/base/env';
import { Wallet } from '@/modules/wallet';
import { EOperation } from '@/modules/wallet/type';
import { useAppDispatch } from '@/store';
import {
  isTransferOperation,
  setTransferFromAddress,
  setTransferAmount,
  setTransferToAddress,
  setTransferType,
} from '@/store/slices/wallet';
import { networkTag } from '@/utils/common';

const WalletPage = () => {
  const dispatch = useAppDispatch();
  const { query } = useRouter();

  useEffect(() => {
    const { type = EOperation.transfer_in, from, to, amount = '' } = query;
    const str = Array<string>().concat(type)[0];
    const _type = isTransferOperation(str) ? EOperation[str] : EOperation.transfer_in;
    console.log('amount', amount);
    dispatch(setTransferType(_type));
    dispatch(setTransferToAddress(to as string));
    dispatch(setTransferFromAddress(from as string));
    dispatch(setTransferAmount(amount as string));
  }, [query, dispatch]);

  return (
    <>
      <Head>
        <title>Wallet - DCellar{networkTag(runtimeEnv)}</title>
      </Head>
      <Wallet />
    </>
  );
};

export default WalletPage;
