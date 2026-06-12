import type { NextConfig } from 'next';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/api$/, '') + '/api';

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA:
      process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      '',
  },
  allowedDevOrigins: ['0.0.0.0'],
  crossOrigin: 'anonymous',
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/admin/school-dashboard',
        destination: '/school/dashboard',
        permanent: true,
      },
      {
        source: '/admin/school-students',
        destination: '/school/students',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Rewrite Django API routes
      // NOTE: /api/auth/* is NOT rewritten - it's handled by Next.js Auth.js
      {
        source: '/api/accounts/:path*',
        destination: `${API_BASE_URL}/accounts/:path*`,
      },
      {
        source: '/api/profiles/:path*',
        destination: `${API_BASE_URL}/profiles/:path*`,
      },
      {
        source: '/api/essay-brainstorm/:path*',
        destination: `${API_BASE_URL}/essay-brainstorm/:path*`,
      },
      {
        source: '/api/locations/:path*',
        destination: `${API_BASE_URL}/locations/:path*`,
      },
      {
        source: '/api/career-discovery/:path*',
        destination: `${API_BASE_URL}/career-discovery/:path*`,
      },
      {
        source: '/api/domain-discovery/:path*',
        destination: `${API_BASE_URL}/domain-discovery/:path*`,
      },
      {
        source: '/api/college-selector/:path*',
        destination: `${API_BASE_URL}/college-selector/:path*`,
      },
      {
        source: '/api/tts/:path*',
        destination: `${API_BASE_URL}/tts/:path*`,
      },
      {
        source: '/api/schools/:path*',
        destination: `${API_BASE_URL}/schools/:path*`,
      },
      {
        source: '/api/notifications/:path*',
        destination: `${API_BASE_URL}/notifications/:path*`,
      },
      {
        source: '/api/deadlines/:path*',
        destination: `${API_BASE_URL}/deadlines/:path*`,
      },
      {
        source: '/api/documents/:path*',
        destination: `${API_BASE_URL}/documents/:path*`,
      },
      {
        source: '/api/payments/:path*',
        destination: `${API_BASE_URL}/payments/:path*`,
      },
      {
        source: '/api/pricing/:path*',
        destination: `${API_BASE_URL}/pricing/:path*`,
      },
      // Add other Django API routes here as needed
      // Any /api/* routes not listed above will be handled by Next.js
    ];
  },
};

export default nextConfig;
