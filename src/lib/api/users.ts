import { api } from '../api';

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  facilityId?: string | null;
  assignedFacility?: {
    id: string;
    name: string;
    code: string;
    address?: string;
  } | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role?: {
      name: string;
    };
  };
}

export interface LoginHistoryItem {
  id: string;
  userId: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role?: {
      name: string;
    };
  };
  facility?: {
    id: string;
    name: string;
    code: string;
  } | null;
  loginTime: string;
  ipAddress: string;
  deviceInfo: string;
  status: 'SUCCESS' | 'BLOCKED_SUSPENDED';
  action: string;
}

export const usersApi = {
  getUsers: async (params?: { search?: string; role?: string; status?: string; facilityId?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.role) q.append('role', params.role);
    if (params?.status) q.append('status', params.status);
    if (params?.facilityId) q.append('facilityId', params.facilityId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await api.get<UserItem[]>(`/users${qs}`);
    return Array.isArray(res) ? res : ((res as any)?.data || []);
  },

  getRoles: async () => {
    const res = await api.get<RoleItem[]>('/users/roles');
    return Array.isArray(res) ? res : ((res as any)?.data || []);
  },

  getAuditLogs: async (params?: { limit?: number; userId?: string; action?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.userId) q.append('userId', params.userId);
    if (params?.action) q.append('action', params.action);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await api.get<ActivityLogItem[]>(`/users/audit-logs${qs}`);
    return Array.isArray(res) ? res : ((res as any)?.data || []);
  },

  getLoginHistory: async (params?: { limit?: number; userId?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.userId) q.append('userId', params.userId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await api.get<LoginHistoryItem[]>(`/users/login-history${qs}`);
    return Array.isArray(res) ? res : ((res as any)?.data || []);
  },

  createUser: async (data: {
    fullName: string;
    email: string;
    phone?: string;
    password?: string;
    roleName: string;
    facilityId?: string;
    reason?: string;
  }) => {
    return api.post<UserItem>('/users', data);
  },

  updateUserRole: async (
    userId: string,
    roleName: string,
    options?: { facilityId?: string; reason?: string },
  ) => {
    return api.patch<UserItem>(`/users/${userId}/role`, {
      roleName,
      facilityId: options?.facilityId,
      reason: options?.reason,
    });
  },

  updateUserStatus: async (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    return api.patch<UserItem>(`/users/${userId}/status`, { status });
  },

  assignFacility: async (userId: string, facilityId: string, roleInFacility = 'STAFF') => {
    return api.post<any>(`/users/${userId}/assign-facility`, { facilityId, roleInFacility });
  },

  revokeFacility: async (userId: string) => {
    return api.delete<any>(`/users/${userId}/revoke-facility`);
  },
};
