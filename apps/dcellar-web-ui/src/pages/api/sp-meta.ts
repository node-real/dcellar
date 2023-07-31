import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// @ts-ignore
// eslint-disable-next-line
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const endpoint = ((global as any).__GLOBAL_CONFIG || {}).SP_RECOMMEND_META;

  if (!endpoint) res.json([]);
  try {
    const { data } = await axios.post(endpoint, { data: {} });
    res.json(data);
  } catch (e) {
    console.log(e);
    res.json([]);
  }
};
