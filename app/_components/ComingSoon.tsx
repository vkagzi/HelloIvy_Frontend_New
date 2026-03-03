'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface ComingSoonProps {
  title: string;
  icon: string;
  description: string;
  features?: string[];
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  icon,
  description,
  features,
}) => {
  const router = useRouter();

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-3xl">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-2xl md:p-12">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 opacity-30 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-24 -ml-24 h-48 w-48 rounded-full bg-gradient-to-tr from-pink-100 to-yellow-100 opacity-30 blur-3xl"></div>

          {/* Confetti Icons */}
          <div
            className="absolute top-8 left-12 animate-bounce text-2xl text-yellow-400"
            style={{ animationDelay: '0s' }}
          >
            ✨
          </div>
          <div
            className="absolute top-16 right-20 animate-bounce text-xl text-pink-400"
            style={{ animationDelay: '0.2s' }}
          >
            ⭐
          </div>
          <div
            className="absolute bottom-20 left-16 animate-bounce text-lg text-purple-400"
            style={{ animationDelay: '0.4s' }}
          >
            💫
          </div>
          <div
            className="absolute right-24 bottom-12 animate-bounce text-2xl text-blue-400"
            style={{ animationDelay: '0.6s' }}
          >
            ✨
          </div>
          <div className="absolute top-32 right-12 rotate-12 text-sm text-orange-400">
            ╱
          </div>
          <div className="absolute top-24 left-32 -rotate-12 text-sm text-cyan-400">
            ╲
          </div>
          <div className="absolute right-32 bottom-32 rotate-45 text-sm text-green-400">
            ╱
          </div>
          <div className="absolute bottom-40 left-20 -rotate-45 text-sm text-red-400">
            ╲
          </div>
          <div className="absolute top-40 right-40 text-xs text-indigo-400">
            ×
          </div>
          <div className="absolute bottom-24 left-40 text-xs text-pink-400">
            ×
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mb-6 inline-flex h-20 w-20 transform items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 shadow-lg transition-transform hover:scale-110">
                <span className="text-4xl">{icon}</span>
              </div>
              <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
                {title}
              </h1>
              <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 text-lg font-semibold text-white">
                COMING SOON
              </div>
            </div>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-center text-xl leading-relaxed text-gray-600">
              {description}
            </p>

            {/* Features */}
            {features && features.length > 0 && (
              <div className="mb-10">
                <h3 className="mb-4 text-center text-xl font-semibold text-gray-800">
                  What to Expect:
                </h3>
                <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-2">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="flex-1 text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Section */}
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-100 to-blue-100 p-6">
              <div className="text-center">
                <p className="mb-4 text-gray-700">
                  <span className="font-semibold">
                    Want to be notified when this feature launches?
                  </span>
                  <br />
                  We're working hard to bring you this amazing feature!
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-lg border-2 border-purple-200 px-4 py-3 focus:border-purple-500 focus:outline-none sm:w-64"
                  />
                  <button className="w-full transform rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg sm:w-auto">
                    Notify Me
                  </button>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => router.push('/app')}
                className="inline-flex items-center gap-2 font-semibold text-purple-600 transition-colors hover:text-purple-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Follow us on social media for updates •{' '}
            <span className="font-semibold text-purple-600">@HelloIvy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
