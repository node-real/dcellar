import axios from 'axios';
import qs from 'query-string';
import { NextApiRequest, NextApiResponse } from 'next';
import { ALLOWED_DOMAINS, EXPLORER_API_URL } from '@/base/env';
import { isRefererAllowed } from '@/utils/req';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!isRefererAllowed(req.headers.referer || '', ALLOWED_DOMAINS)) {
    res.status(403).json({ message: 'Forbidden' });
  }
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
