import { getClient } from "@/base/client";

export const genSendTx = async (configParam: {
    fromAddress: string;
    toAddress: string;
    amount: [{
      denom: 'BNB',
      amount: string;
    }]
  }) => {
    const client = await getClient();
    const sendTx = await client.account.transfer(configParam);

    return sendTx;
  }
