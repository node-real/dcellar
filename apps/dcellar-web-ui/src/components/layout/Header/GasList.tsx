import { useAppDispatch } from "@/store";
import { setupGasList } from "@/store/slices/global";
import { useAsyncEffect } from "ahooks";

export const GasList = () => {
  const dispatch = useAppDispatch();
  useAsyncEffect(async () => {
    dispatch(setupGasList());
  }, [dispatch, setupGasList]);

  return <></>
}