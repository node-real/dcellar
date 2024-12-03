import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const url = `https://bsc-explorer-api.nodereal.io/api/token/getPrice?symbol=bnb`;
  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (e) {
    console.error('bnb_price', e);
    res.json({});
  }
};

export default handler;
