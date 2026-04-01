'use server';

import { uploadToAzureBlob } from '@/lib/azure-blob-upload';

/**
 * Uploads a school logo to Azure Blob Storage and returns the public URL.
 * Accepts a FormData with a single `logo` file field.
 */
export async function uploadSchoolLogo(formData: FormData): Promise<string> {
  const file = formData.get('logo');
  if (!(file instanceof File)) {
    throw new Error('No logo file provided.');
  }

  const { url } = await uploadToAzureBlob(file);
  return url;
}
