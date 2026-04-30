'use client';

import React, { useRef, useState } from 'react';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { useToast } from '@/app/_components/Toast';
import api from '@/lib/api';

export default function TranscriptUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setParsedTranscriptData } = useProfile();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    addToast('Scanning transcript... This may take a moment.', { type: 'info' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api('/api/profiles/parse-transcript/', {
        method: 'POST',
        body: formData,
        rawBody: true,
      });

      console.log('Parsed Transcript Data:', data);
      
      // Update global context so all forms can read this
      setParsedTranscriptData(data);
      addToast('Data successfully extracted and auto-filled!', { type: 'success' });
    } catch (err) {
      console.error(err);
      addToast('Error parsing transcript. Please try again.', { type: 'error' });
    } finally {
      setLoading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        {loading ? 'Scanning...' : 'Upload Transcript'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
