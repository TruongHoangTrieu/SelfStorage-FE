import { api } from '../api';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'SYSTEM' | 'RESERVATION' | 'PAYMENT' | 'CONTRACT' | 'HANDOVER' | 'RENEWAL' | 'OVERDUE' | 'SUPPORT';
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.isRead !== undefined) query.append('isRead', String(params.isRead));
    if (params?.type) query.append('type', params.type);

    const queryString = query.toString();
    return api.get<NotificationResponse>(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  getUnreadCount: () => {
    return api.get<{ unreadCount: number }>('/notifications/unread-count');
  },

  markAsRead: (id: string) => {
    return api.patch<NotificationItem>(`/notifications/${id}/read`);
  },

  markAllAsRead: () => {
    return api.patch<{ success: boolean; unreadCount: number }>('/notifications/read-all');
  },

  delete: (id: string) => {
    return api.delete<{ success: boolean }>(`/notifications/${id}`);
  },
};
