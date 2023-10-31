import axios from 'axios';
import qs from 'query-string';
import { NextApiRequest, NextApiResponse } from 'next';
import { BILLING_API_URL } from '@/base/env';

// eslint-disable-next-line
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ...query } = req.query;
  const slugs = slug as string[];
  const url = `${BILLING_API_URL}/greenfield/bill_monthly/${slugs.join('/')}?${qs.stringify(query)}`
  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (e) {
    console.log('bill_monthly', e);
    res.json({});
  }
  res.json([])
};
