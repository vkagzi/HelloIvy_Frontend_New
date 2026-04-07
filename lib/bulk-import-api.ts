import api from '@/lib/api-client';

export interface ValidateEmailsResponse {
  valid: string[];
  invalid: { email: string; reason: string }[];
}

export interface BulkImportResult {
  total_submitted: number;
  total_created: number;
  total_failed: number;
  created: { email: string; id: number; email_sent: boolean }[];
  failed: { email: string; reason: string }[];
}

export const bulkImportApi = {
  validate: async (emails: string[]): Promise<ValidateEmailsResponse> => {
    return api<ValidateEmailsResponse>('/api/accounts/admin/users/bulk-import/validate/', {
      method: 'POST',
      body: { emails },
    });
  },

  import: async (
    emails: string[],
    role: string,
    schoolId: number | null,
    academicLevel?: string | null,
    gradeLevel?: string | null,
    sendPasswordEmail: boolean = true,
  ): Promise<BulkImportResult> => {
    return api<BulkImportResult>('/api/accounts/admin/users/bulk-import/', {
      method: 'POST',
      body: {
        emails,
        role,
        school_id: schoolId,
        academic_level: academicLevel || null,
        grade_level: gradeLevel || null,
        send_password_email: sendPasswordEmail,
      },
    });
  },
};
