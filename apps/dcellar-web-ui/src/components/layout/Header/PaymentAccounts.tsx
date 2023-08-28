import { GREENFIELD_CHAIN_ID } from "@/base/env";
import { useAppDispatch, useAppSelector } from "@/store";
import { setBankBalance, setupAccountsInfo, setupOAList, setupPAList } from "@/store/slices/accounts";
import { setupGasObjects } from "@/store/slices/global";
import { useAsyncEffect } from "ahooks";
import { useRouter } from "next/router";
import { useBalance } from "wagmi";

export const PaymentAccounts = () => {
  const dispatch = useAppDispatch();
  const { asPath } = useRouter();
  const { loginAccount } = useAppSelector((state) => state.persist);
  useAsyncEffect(async () => {
    dispatch(setupOAList());
    dispatch(setupPAList());
    loginAccount && dispatch(setupAccountsInfo(loginAccount));
  }, [dispatch, setupGasObjects]);
  const { data: gnfdBalance, refetch } = useBalance({
    address: loginAccount as any,
    chainId: GREENFIELD_CHAIN_ID,
    watch: true,
    cacheTime: 5000,
  });
  const metamaskValue = gnfdBalance?.formatted ?? '0';
  useAsyncEffect(async () => {
    if (!loginAccount) return;
    // update metamask
    refetch();
    dispatch(setBankBalance(metamaskValue));
  }, [asPath, refetch]);

  return <></>
}