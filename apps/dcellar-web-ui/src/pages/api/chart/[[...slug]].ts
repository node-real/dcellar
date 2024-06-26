import axios from 'axios';
import qs from 'query-string';
import { NextApiRequest, NextApiResponse } from 'next';
import { EXPLORER_API_URL } from '@/base/env';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ...query } = req.query;
  const slugs = slug as string[];
  const url = `${EXPLORER_API_URL}/greenfield/chart/${slugs.join('/')}?${qs.stringify(query)}`;
  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (e) {
    console.error('explorer chart error', e);
    res.json({});
  }
};

export default handler;
