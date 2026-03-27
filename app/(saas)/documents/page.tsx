'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api-client';

interface DocumentItem {
  id: number;
  file_url: string;
  file_name: string;
  category: string;
  note: string;
  uploaded_by_email: string;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await api<{ documents: DocumentItem[] }>('/api/documents/');
        setDocuments(data.documents);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Shared Documents
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-400">No documents shared with you yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4"
            >
              <div>
                <p className="font-medium text-gray-900">{doc.file_name}</p>
                <p className="text-xs text-gray-500">
                  {doc.category && (
                    <span className="mr-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {doc.category}
                    </span>
                  )}
                  Shared by {doc.uploaded_by_email} ·{' '}
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
                {doc.note && (
                  <p className="mt-1 text-xs text-gray-500">{doc.note}</p>
                )}
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
