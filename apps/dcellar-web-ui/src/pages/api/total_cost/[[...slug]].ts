import { BILLING_API_URL } from '@/base/env';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;
  const slugs = slug as string[];
  const url = `${BILLING_API_URL}/greenfield/total_cost/${slugs.join('/')}`;
  try {
    const { data } = await axios.get(url, { data: {} });
    res.json(data);
  } catch (e) {
    console.error('total_cost', e);
    res.json({});
  }
};

export default handler;
