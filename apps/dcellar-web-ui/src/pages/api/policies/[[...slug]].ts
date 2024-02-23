import { EXPLORER_API_URL } from '@/base/env';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

// eslint-disable-next-line
export default async (req: NextApiRequest, res: NextApiResponse) => {
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
