'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { useToast } from '@/app/_components/Toast';
import { getAuthToken } from '@/lib/api';

export default function LinkedInImporter() {
  const { setParsedTranscriptData } = useProfile();
  const { addToast } = useToast();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animated progress for AI scanning
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + 5;
          if (prev < 90) return prev + 1;
          return prev;
        });
      }, 100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleImport = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      addToast('Please paste your LinkedIn profile content first.', { type: 'error' });
      return;
    }

    setLoading(true);
    addToast('Scanning profile data…', { type: 'info' });

    try {
      const token = await getAuthToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      const res = await fetch(`${baseUrl}/api/profiles/parse-linkedin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ linkedin_text: trimmed }),
      });

      setProgress(100);

      if (!res.ok) {
        throw new Error('Failed to analyze the pasted content.');
      }

      const data = await res.json();
      setParsedTranscriptData(data);
      addToast('Profile updated from LinkedIn!', { type: 'success' });
      setText('');
      setIsExpanded(false);
    } catch (err: any) {
      addToast(err.message || 'Error processing text.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      {!isExpanded ? (
        /* TRIGGER PILL */
        <button
          onClick={() => setIsExpanded(true)}
          className="
            flex items-center gap-3 w-full
            rounded-2xl border border-[#0077B5]/20 bg-[#EBF5FB]
            px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-[#0077B5]/40
          "
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#0077B5] text-white shrink-0">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[14px] font-bold text-[#0077B5]">Import from LinkedIn</span>
            <span className="text-[11px] text-[#0077B5]/60">Auto-fill all profile sections instantly</span>
          </div>
          <div className="ml-auto flex items-center justify-center h-8 w-8 rounded-full bg-[#0077B5]/10 text-[#0077B5]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
      ) : (
        /* EXPANDED PASTE BOX */
        <div className="flex flex-col gap-3 rounded-2xl border border-[#0077B5]/30 bg-[#EBF5FB] p-4 shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#0077B5] animate-pulse" />
              <span className="text-[13px] font-bold text-[#0077B5]">LinkedIn Magic Import</span>
            </div>
            <button onClick={() => setIsExpanded(false)} className="text-[#0077B5]/40 hover:text-[#0077B5]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-white/50 p-3 border border-[#0077B5]/10">
            <h4 className="text-[11px] font-bold text-[#0077B5] uppercase tracking-wider">Quick Instructions</h4>
            <div className="grid grid-cols-1 gap-2">
               <div className="flex items-center gap-2 text-[11px] text-[#005e91]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0077B5] text-[10px] text-white font-bold">1</span>
                  <span>Open your LinkedIn Profile page</span>
               </div>
               <div className="flex items-center gap-2 text-[11px] text-[#005e91]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0077B5] text-[10px] text-white font-bold">2</span>
                  <span>Press <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#0077B5]/20 font-bold">Ctrl+A</kbd> then <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#0077B5]/20 font-bold">Ctrl+C</kbd></span>
               </div>
               <div className="flex items-center gap-2 text-[11px] text-[#005e91]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0077B5] text-[10px] text-white font-bold">3</span>
                  <span>Paste everything below and click Import</span>
               </div>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            placeholder="Click here and press Ctrl+V..."
            className="
              w-full h-32 rounded-xl border border-[#0077B5]/20 bg-white p-3
              text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#0077B5]/20
              resize-none placeholder:text-gray-300
            "
          />

          <button
            onClick={handleImport}
            disabled={loading || !text.trim()}
            className="
              relative overflow-hidden w-full rounded-xl bg-[#0077B5] py-3 text-[13px] font-bold text-white
              transition-all hover:bg-[#005e91] active:scale-[0.98] disabled:opacity-50
            "
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                <span>AI Scanning Profile...</span>
              </div>
            ) : (
              'Start Magic Import'
            )}
            
            {/* Progress Bar in button */}
            {loading && (
              <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" style={{ width: `${progress}%` }} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
