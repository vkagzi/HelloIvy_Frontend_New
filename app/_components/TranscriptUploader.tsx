'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { useToast } from '@/app/_components/Toast';
import { getAuthToken } from '@/lib/api';

export default function TranscriptUploader({
  targetSection,
  targetIndex
}: {
  targetSection?: string;
  targetIndex?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setParsedTranscriptData } = useProfile();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);

  // Simulated extraction progress after upload is 100%
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExtracting) {
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 70) return prev + 2; // Moving through pre-processing
          if (prev < 90) return prev + 1; // AI is scanning
          if (prev < 98) return Math.round(prev + 0.2); // Finalizing extraction
          return prev; // Hold at 98% until done
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isExtracting]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setIsExtracting(false);
    setUploadProgress(0);
    addToast('Scanning transcript... This may take a moment. Please don\'t leave this page.', { type: 'info' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await getAuthToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const url = `${baseUrl}/api/profiles/parse-transcript/`;

      const xhr = new XMLHttpRequest();

      // Wrap XHR in a promise
      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', url, true);
        
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // Use 0-50% for actual file upload progress
            const percentComplete = Math.round((event.loaded / event.total) * 50);
            setUploadProgress(percentComplete);
            if (percentComplete === 50) {
              setIsExtracting(true);
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              setIsExtracting(false);
              setUploadProgress(100);
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || errorData.detail || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error occurred during upload'));
        xhr.onabort = () => reject(new Error('Upload aborted'));

        xhr.send(formData);
      });

      console.log('Parsed Transcript Data:', response);

      // Update global context so all forms can read this
      setParsedTranscriptData({ ...(response as any), _target: { section: targetSection, index: targetIndex } });
      addToast('Data successfully extracted and auto-filled!', { type: 'success' });
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error parsing transcript. Please try again.', { type: 'error' });
    } finally {
      setLoading(false);
      setIsExtracting(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
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
      
      {loading && (
        <div className="mt-1 w-full max-w-[140px]">
          <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-neutral-500 font-medium text-right">
            {uploadProgress < 50 
              ? `Uploading: ${Math.round(uploadProgress * 2)}%` 
              : uploadProgress < 100 
                ? `Extracting Data: ${Math.round(uploadProgress)}%`
                : 'Finishing...'}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}