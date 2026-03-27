'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api-client';

interface NotificationItem {
  id: number;
  notification_id: number;
  message: string;
  sender_email: string;
  school_name: string | null;
  target_grade: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{
        notifications: NotificationItem[];
        total: number;
      }>(`/api/notifications/?page=${page}&page_size=20`);
      setNotifications(data.notifications);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await api(`/api/notifications/${id}/read/`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
    } catch {
      // silent
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Notifications</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-400">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border bg-white px-5 py-4 ${
                n.is_read
                  ? 'border-gray-200'
                  : 'border-purple-200 bg-purple-50/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    From {n.school_name || 'School'} ·{' '}
                    {new Date(n.created_at).toLocaleString()}
                    {n.target_grade ? ` · Grade ${n.target_grade}` : ''}
                  </p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="ml-3 rounded-md px-2 py-1 text-xs text-purple-600 hover:bg-purple-100"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
