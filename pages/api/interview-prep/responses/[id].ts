import { NextApiRequest, NextApiResponse } from 'next';
import { forwardToBackend } from '@/lib/api-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  return forwardToBackend(req, res, {
    path: `/api/interview-prep/responses/${id}/`,
  });
}
