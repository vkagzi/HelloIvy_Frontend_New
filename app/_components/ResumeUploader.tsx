'use client';
import { useState } from 'react';

export default function ResumeUploader({ onParsed }: any) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    const token = localStorage.getItem('access');

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);

    try {
      const res = await fetch(
        'http://localhost:8000/api/profiles/parse-resume/',
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );
      if (!res.ok) {
        throw new Error("Resume parsing failed");
      }
      const data = await res.json();
      console.log('Parsed Data:', data);
      onParsed(data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className=" bg-white p-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* LEFT SIDE */}
        <div className="max-w-lg">
          <h3 className="--text-product-h5 font-bold text-neutral-800">
            Auto-fill your profile using your resume
          </h3>

          {/* <p className="text-para-sm mt-1 text-neutral-600">
             or report card
          </p> */}

          {loading && (
            <p className="mt-2 text-sm text-blue-500">
              Parsing your document...
            </p>
          )}
        </div>

        {/* RIGHT SIDE UPLOAD BOX */}
        <label
          htmlFor="resumeUpload"
          className="w-full cursor-pointer md:w-[400px]"
        >
          <div className="hover:border-product-h5 rounded-xl border-2 border-dashed p-6 text-center transition">
            <div className="mb-2 text-3xl">📄</div>

            <p className="text-sm text-neutral-600">
              Drag & drop your file here or click
              <span className="text-product-h6 ml-1 font-medium">
                Upload File
              </span>
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              Supported: PDF, DOCX, JPG, PNG
            </p>
          </div>
        </label>

        {/* HIDDEN INPUT */}
        <input
          id="resumeUpload"
          type="file"
          accept=".pdf,.docx,.png,.jpg"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
