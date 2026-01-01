import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from request headers
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward to Django
    const djangoResponse = await fetch(
      'http://localhost:8000/api/interview-prep/save-response/',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body),
      }
    );

    const responseData = await djangoResponse.json();

    if (!djangoResponse.ok) {
      return res.status(djangoResponse.status).json(responseData);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error saving response:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
