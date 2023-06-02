import { client } from "@/base/client";

export const genTransferOutTx = async (configParam: {
  from: string;
  to: string;
  amount: {
    denom: 'BNB',
    amount: string;
  }
}) => {
  const sendTx = await client.crosschain.transferOut(configParam);

  return sendTx;
};
