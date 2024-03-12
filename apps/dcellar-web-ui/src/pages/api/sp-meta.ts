import axios from 'axios';
import { defaultApolloConfig, mainnetSpMetaEndpoint } from '@/base/env';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const endpoint =
    ((global as any).__GLOBAL_CONFIG || {}).SP_RECOMMEND_META ||
    defaultApolloConfig.SP_RECOMMEND_META;
  const mainnetEndpoint =
    ((global as any).__GLOBAL_CONFIG || {}).MAINNET_SP_RECOMMEND_META || mainnetSpMetaEndpoint;
  const finalEndpoint = req.query.network === 'mainnet' ? mainnetEndpoint : endpoint;

  if (!finalEndpoint) res.json([]);
  try {
    const { data } = await axios.post(finalEndpoint, { data: {} });
    res.json(data);
  } catch (e) {
    console.error('sp-meta error', e);
    res.json([]);
  }
};

export default handler;
