import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';

export interface UploadToAzureOptions {
  /** The container to upload into. Defaults to AZURE_STORAGE_CONTAINER_NAME env var. */
  containerName?: string;
  /** Override the blob name. If omitted, a unique name is generated from the original file name. */
  blobName?: string;
}

export interface AzureUploadResult {
  url: string;
  blobName: string;
  containerName: string;
}

/**
 * Uploads a File (or Buffer + metadata) to Azure Blob Storage and returns the
 * public URL of the uploaded blob.
 *
 * Required env vars:
 *   AZURE_STORAGE_CONNECTION_STRING  — Azure Storage account connection string
 *   AZURE_STORAGE_CONTAINER_NAME     — Default container name
 */
export async function uploadToAzureBlob(
  file: File,
  options: UploadToAzureOptions = {}
): Promise<AzureUploadResult> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }

  const containerName =
    options.containerName ?? process.env.AZURE_STORAGE_CONTAINER_NAME;
  if (!containerName) {
    throw new Error(
      'Container name must be provided via options or AZURE_STORAGE_CONTAINER_NAME'
    );
  }

  const extension = file.name.split('.').pop() ?? '';
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const blobName =
    options.blobName ?? `${uniqueSuffix}${extension ? `.${extension}` : ''}`;

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Ensure container exists (no-op if it already does)
  await containerClient.createIfNotExists({ access: 'blob' });

  const blockBlobClient: BlockBlobClient =
    containerClient.getBlockBlobClient(blobName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: file.type },
  });

  return {
    url: blockBlobClient.url,
    blobName,
    containerName,
  };
}
