import { client } from "@/base/client";

export const genSendTx = async (configParam: {
    fromAddress: string;
    toAddress: string;
    amount: [{
      denom: 'BNB',
      amount: string;
    }]
  }) => {
    const sendTx = await client.account.transfer(configParam);

    return sendTx;
  }
