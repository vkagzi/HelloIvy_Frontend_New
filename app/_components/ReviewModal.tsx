'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  module: "stream" | "career" | "college";
}

export default function ReviewModal({ open, onClose, module }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!rating) return;

    try {
      await api('/api/domain-discovery/submit-review/', {
        method: 'POST',
        body: {
          rating,
          comment,
          module,
        },
      });

      localStorage.setItem('reviewSubmitted', 'true');
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Modal Card */}
      <div className="relative w-[420px] rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer text-lg text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Heading */}
        <h2 className="mb-3 text-xl font-semibold">⭐ Rate Your Experience</h2>

        {/* <p className="mb-5 text-sm text-gray-500">
          Your feedback helps us improve the chatbot experience.
        </p> */}

        {/* Star Rating */}
        <div className="mb-5 flex gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              className={`transform cursor-pointer text-6xl transition hover:scale-110 ${
                (hover ?? rating) && (hover ?? rating)! >= num
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
              onClick={() => setRating(num)}
              onMouseEnter={() => setHover(num)}
              onMouseLeave={() => setHover(null)}
            >
              ★
            </button>
          ))}
        </div>

        {/* Comment Box */}
        <textarea
          placeholder="What worked and what didn’t ?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mb-3 w-full resize-none rounded-lg border border-gray-800 p-3 text-sm outline-none focus:border-blue-500"
          rows={4}
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            disabled={!rating}
            onClick={handleSubmit}
            className={`rounded-lg px-5 py-2 text-white transition ${
              rating
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-300'
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
