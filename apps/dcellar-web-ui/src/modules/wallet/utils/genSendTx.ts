import { getClient } from '@/facade';

export const genSendTx = async (configParam: {
  fromAddress: string;
  toAddress: string;
  amount: [
    {
      denom: 'BNB';
      amount: string;
    },
  ];
}) => {
  const client = await getClient();
  return await client.account.transfer(configParam);
};
