import React from 'react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <p className="text-sm text-red-700">Error: {message}</p>
    </div>
  );
}
