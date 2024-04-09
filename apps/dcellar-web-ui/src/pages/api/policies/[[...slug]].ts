import { ALLOWED_DOMAINS, EXPLORER_API_URL } from '@/base/env';
import { isRefererAllowed } from '@/utils/req';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!isRefererAllowed(req.headers.referer || '', ALLOWED_DOMAINS)) {
    res.status(403).json({ message: 'Forbidden' });
  }
  const { slug } = req.query;
  const slugs = slug as string[];
  const url = `${EXPLORER_API_URL}/greenfield/permission/policy/list/by_resource/${slugs.join(
    '/',
  )}?page=1&per_page=1000`;
  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (e) {
    console.error('explorer chart error', e);
    res.json({});
  }
};

export default handler;
