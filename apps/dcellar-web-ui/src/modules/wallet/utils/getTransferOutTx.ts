import { getClient } from '@/facade';

export const getTransferOutTx = async (configParam: {
  from: string;
  to: string;
  amount: {
    denom: 'BNB';
    amount: string;
  };
}) => {
  const client = await getClient();
  return await client.crosschain.transferOut(configParam);
};
