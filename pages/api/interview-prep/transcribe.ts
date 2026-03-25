import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { getBackendUrl } from '@/lib/api-server';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser for file uploads
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [fields, files] = await form.parse(req);

    // Handle audio file
    if (!files.audio) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    // Read the file content
    const fileContent = fs.readFileSync(audioFile.filepath);

    // Create FormData for Django
    const formData = new FormData();
    const blob = new Blob([fileContent], { type: audioFile.mimetype ?? undefined });
    formData.append('audio', blob, audioFile.originalFilename || 'audio.wav');

    // Get auth token from request headers
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward to Django
    const djangoResponse = await fetch(
      getBackendUrl('/api/interview-prep/transcribe/'),
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );

    const responseData = await djangoResponse.json();

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    if (!djangoResponse.ok) {
      return res.status(djangoResponse.status).json(responseData);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
