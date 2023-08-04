import { useAppDispatch } from "@/store";
import { setupGasObjects } from "@/store/slices/global";
import { useAsyncEffect } from "ahooks";

export const GasObjects = () => {
  const dispatch = useAppDispatch();
  useAsyncEffect(async () => {
    dispatch(setupGasObjects());
  }, [dispatch, setupGasObjects]);

  return <></>
}