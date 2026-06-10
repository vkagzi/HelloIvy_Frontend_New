'use client';

import React, { useState } from 'react';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { useToast } from '@/app/_components/Toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Linkedin, Loader2, ClipboardPaste } from 'lucide-react';
import api from '@/lib/api';

const LinkedInImporter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [loading, setLoading] = useState(false);
  const { setParsedTranscriptData } = useProfile();
  const { addToast } = useToast();

  const handleImport = async () => {
    if (!pasteData.trim()) {
      addToast('Please paste your LinkedIn profile content first.', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profiles/parse-linkedin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ linkedin_text: pasteData }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.detail || `Import failed (Status ${res.status})`);
      }

      const data = await res.json();
      console.log('!!! [LinkedInImporter] Received Parsed Data:', data);
      
      // Update global context
      setParsedTranscriptData(data);
      
      addToast('Profile data extracted successfully! Please review the fields.', { type: 'success' });
      setIsOpen(false);
      setPasteData('');
    } catch (err: any) {
      console.error('[LinkedInImporter] Error:', err);
      addToast(err.message || 'Failed to parse LinkedIn text. Try again.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-[#0077b5] text-[#0077b5] hover:bg-[#0077b5] hover:text-white transition-all duration-300 shadow-sm">
          <Linkedin className="h-4 w-4" />
          <span>Magic Paste from LinkedIn</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-white border-2 border-slate-100 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-[#0077b5]">
            <Linkedin className="h-6 w-6 fill-current" />
            <DialogTitle className="text-2xl font-bold text-slate-800">LinkedIn Magic Paste</DialogTitle>
          </div>
          <DialogDescription className="text-base text-slate-600 leading-relaxed">
            Follow these steps to import your profile 100% reliably:
            <ol className="mt-4 space-y-2 list-decimal list-inside font-medium text-slate-700">
              <li>Open your <span className="text-[#0077b5]">LinkedIn Profile</span> in a new tab</li>
              <li>Press <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs">Ctrl + A</kbd> (Select All)</li>
              <li>Press <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs">Ctrl + C</kbd> (Copy)</li>
              <li><span className="text-[#0077b5]">Paste (Ctrl + V)</span> the full text in the box below:</li>
            </ol>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 group">
          <label className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-[#0077b5] transition-colors">
            Paste Profile Data Here
          </label>
          <div className="relative">
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="Paste here..."
              className="w-full h-40 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#0077b5] focus:ring-0 transition-all resize-none text-slate-800 placeholder:text-slate-400"
            />
            {pasteData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <ClipboardPaste className="h-12 w-12" />
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400 italic">
            * We extract your education, experience, awards, and skills safely. No password needed.
          </p>
        </div>

        <DialogFooter className="flex sm:justify-between items-center bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-lg border-t border-slate-100">
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={loading} className="text-slate-500 hover:text-slate-700 font-medium">
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={loading || !pasteData.trim()}
            className="bg-[#0077b5] hover:bg-[#006699] text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 flex items-center gap-2 transform active:scale-95 transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Linkedin className="h-4 w-4" />
            )}
            {loading ? 'Processing...' : 'Run Magic Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkedInImporter;
