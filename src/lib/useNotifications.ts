'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { notificationsApi, NotificationItem } from './api/notifications';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useNotifications(userId?: string | number | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await notificationsApi.getUnreadCount();
      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Ignore unauthenticated or network errors silently
    }
  }, [userId]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications({ page: 1, limit: 15 });
      if (res?.items) {
        setNotifications(res.items);
        setUnreadCount(res.unreadCount ?? 0);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Connect WebSocket when user is logged in
  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // Initialize socket connection
    const socket = io(`${SOCKET_URL}/notifications`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔔 Connected to notifications socket');
    });

    socket.on('notification', (newNotif: NotificationItem) => {
      // Prepend to notifications list
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Trigger modern toast notification
      toast.info(newNotif.title, {
        description: newNotif.body,
        duration: 5000,
      });
    });

    socket.on('unread_count', (data: { unreadCount: number }) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    });

    socket.on('facility_event', (eventData: any) => {
      toast.warning(eventData.title || 'Thông báo cơ sở', {
        description: eventData.body,
        duration: 6000,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      toast.error('Không thể cập nhật thông báo');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch {
      toast.error('Không thể cập nhật thông báo');
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
