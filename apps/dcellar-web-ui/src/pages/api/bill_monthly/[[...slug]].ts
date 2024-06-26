import { BILLING_API_URL } from '@/base/env';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import qs from 'query-string';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ...query } = req.query;
  const slugs = slug as string[];
  const url = `${BILLING_API_URL}/greenfield/bill_monthly/${slugs.join('/')}?${qs.stringify(query)}`;
  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (e) {
    console.error('bill_monthly', e);
    res.json({});
  }
};

export default handler;
