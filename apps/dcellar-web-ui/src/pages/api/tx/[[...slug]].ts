import axios from 'axios';
import qs from 'query-string';
import { NextApiRequest, NextApiResponse } from 'next';
import { EXPLORER_API_URL } from '@/base/env';

// eslint-disable-next-line
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ...query } = req.query;
  const slugs = slug as string[];
  const url = `${EXPLORER_API_URL}/greenfield/tx/${slugs.join('/')}?${qs.stringify(query)}`;

  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (e) {
    console.log('tx', e);
    res.json({});
  }
};