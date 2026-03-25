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

    // Extract form fields
    const interviewType = Array.isArray(fields.interview_type)
      ? fields.interview_type[0]
      : fields.interview_type;
    const targetCollege = Array.isArray(fields.target_college)
      ? fields.target_college[0]
      : fields.target_college;
    const targetProgram = Array.isArray(fields.target_program)
      ? fields.target_program[0]
      : fields.target_program;

    // Validate required fields
    if (!interviewType) {
      return res.status(400).json({ error: 'Interview type is required' });
    }

    // Handle resume file if uploaded
    let resumeFile = null;
    if (files.resume) {
      const file = Array.isArray(files.resume) ? files.resume[0] : files.resume;

      // Read the file content
      const fileContent = fs.readFileSync(file.filepath);
      resumeFile = {
        originalFilename: file.originalFilename,
        mimetype: file.mimetype,
        size: file.size,
        content: fileContent,
      };

      // Clean up temp file
      fs.unlinkSync(file.filepath);
    }

    // Forward request to Django backend
    const formData = new FormData();
    formData.append('interview_type', interviewType);
    if (targetCollege) formData.append('target_college', targetCollege);
    if (targetProgram) formData.append('target_program', targetProgram);

    if (resumeFile) {
      const blob = new Blob([resumeFile.content], {
        type: resumeFile.mimetype ?? undefined,
      });
      formData.append(
        'resume',
        blob,
        resumeFile.originalFilename || 'resume.pdf'
      );
    }

    // Get auth token from request headers
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward to Django
    const djangoResponse = await fetch(
      getBackendUrl('/api/interview-prep/start-session/'),
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );

    const responseData = await djangoResponse.json();

    if (!djangoResponse.ok) {
      return res.status(djangoResponse.status).json(responseData);
    }

    return res.status(201).json(responseData);
  } catch (error) {
    console.error('Error in interview session creation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
