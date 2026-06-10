import { pdf, DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

/**
 * Renders a @react-pdf/renderer <Document> to a blob.
 *
 * @param document  A React element that is a `<Document>` from @react-pdf/renderer.
 */
export async function getPDFBlob(
  document: ReactElement<DocumentProps>,
): Promise<Blob> {
  return await pdf(document).toBlob();
}

/**
 * Renders a @react-pdf/renderer <Document> to a blob and triggers a download.
 *
 * @param document  A React element that is a `<Document>` from @react-pdf/renderer.
 * @param filename  The download filename (without .pdf extension).
 */
export async function downloadPDF(
  document: ReactElement<DocumentProps>,
  filename: string,
): Promise<void> {
  const blob = await getPDFBlob(document);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
