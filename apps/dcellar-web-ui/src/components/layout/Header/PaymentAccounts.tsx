import { useAppDispatch, useAppSelector } from "@/store";
import { setupAccountsInfo, setupOAList, setupPAList } from "@/store/slices/accounts";
import { setupGasObjects } from "@/store/slices/global";
import { useAsyncEffect } from "ahooks";

export const PaymentAccounts = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((state) => state.persist);
  useAsyncEffect(async () => {
    dispatch(setupOAList());
    dispatch(setupPAList());
    loginAccount && dispatch(setupAccountsInfo(loginAccount));
  }, [dispatch, setupGasObjects]);

  return <></>
}