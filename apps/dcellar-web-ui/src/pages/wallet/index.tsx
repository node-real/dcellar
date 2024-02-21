import { useEffect } from 'react';
import Head from 'next/head';
import { Wallet } from '@/modules/wallet';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/store';
import { EOperation } from '@/modules/wallet/type';
import { isTrans, setFrom, setSendAmount, setTo, setTransType } from '@/store/slices/wallet';
import { runtimeEnv } from '@/base/env';
import { networkTag } from '@/utils/common';

const WalletPage = () => {
  const dispatch = useAppDispatch();
  const { query } = useRouter();

  useEffect(() => {
    const { type = EOperation.transfer_in, from, to, amount = '' } = query;
    const str = Array<string>().concat(type)[0];
    const _type = isTrans(str) ? EOperation[str] : EOperation.transfer_in;
    dispatch(setTransType(_type));
    dispatch(setTo(to as string));
    dispatch(setFrom(from as string));
    dispatch(setSendAmount(amount as string));
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
