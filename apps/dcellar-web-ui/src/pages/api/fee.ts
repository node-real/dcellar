import { NextApiRequest, NextApiResponse } from 'next';

const defaultFee = {
  storageFee: '0.00004005',
  quotaFee: '0.00015672',
  storeParams: {
    primarySpStorePrice: '0.00828393206',
    readPrice: '0.05575446448',
    secondarySpStorePrice: '0.0009940718472',
    validatorTaxRate: '0.01',
    minChargeSize: 131072,
    redundantDataChunkNum: 4,
    redundantParityChunkNum: 2,
    reserveTime: '15552000',
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const fee = (global as any).__MAINNET_CHAIN_FEE || defaultFee;
  res.json(fee);
};

export default handler;
