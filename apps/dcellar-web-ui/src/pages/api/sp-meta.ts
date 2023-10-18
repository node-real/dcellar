import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// @ts-ignore
// eslint-disable-next-line
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const endpoint = ((global as any).__GLOBAL_CONFIG || {}).SP_RECOMMEND_META;
  const mainnetEndpoint = ((global as any).__GLOBAL_CONFIG || {}).MAINNET_SP_RECOMMEND_META
  const finalEndpoint = req.query.network === 'mainnet' ? mainnetEndpoint : endpoint;

  if (!finalEndpoint) res.json([]);
  try {
    const { data } = await axios.post(finalEndpoint, { data: {} });
    res.json(data);
  } catch (e) {
    console.log(e);
    res.json([]);
  }
};
