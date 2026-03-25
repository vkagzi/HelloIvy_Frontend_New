import { NextApiRequest, NextApiResponse } from 'next';
import { forwardToBackend } from '@/lib/api-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return forwardToBackend(req, res, {
    path: '/api/interview-prep/save-response/',
    method: 'POST',
  });
}
