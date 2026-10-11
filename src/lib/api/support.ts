import { api } from '../api';

export type SupportCategory =
  | 'UNIT'
  | 'LOCK'
  | 'ACCESS_CODE'
  | 'PAYMENT'
  | 'STORED_ITEMS'
  | 'LOST_KEY'
  | 'DAMAGE'
  | 'OTHER';

export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface SupportTicketLog {
  id: string;
  supportRequestId: string;
  userId: string;
  user?: {
    id: string;
    fullName: string;
    role: string;
  };
  note: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  createdAt: string;
}

export interface SupportTicketItem {
  id: string;
  requestCode: string;
  customerId: string;
  facilityId: string;
  contractItemId?: string | null;
  assignedStaffId?: string | null;
  category: SupportCategory;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  photos?: string[];
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  facility?: {
    id: string;
    name: string;
    code?: string;
    address?: string;
  };
  contractItem?: {
    id: string;
    unit?: {
      id: string;
      unitNumber: string;
      floor?: string | number;
    };
  };
  assignedStaff?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  logs?: SupportTicketLog[];
}

export interface CreateSupportTicketDto {
  facilityId: string;
  contractItemId?: string;
  category: SupportCategory;
  subject: string;
  description: string;
  priority?: SupportPriority;
  photos?: string[];
}

export interface UpdateTicketProgressDto {
  status: SupportStatus;
  note: string;
  photos?: string[];
}

export const supportApi = {
  // Tạo ticket mới
  create: async (dto: CreateSupportTicketDto) => {
    return api.post<SupportTicketItem>('/support/requests', dto);
  },

  // Lấy danh sách ticket
  findAll: async (params?: {
    page?: number;
    limit?: number;
    facilityId?: string;
    customerId?: string;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.facilityId) q.append('facilityId', params.facilityId);
    if (params?.customerId) q.append('customerId', params.customerId);
    if (params?.status) q.append('status', params.status);
    if (params?.category) q.append('category', params.category);
    if (params?.priority) q.append('priority', params.priority);
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<{
      data: SupportTicketItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    } | SupportTicketItem[]>(`/support/requests${qs}`);
  },

  // Chi tiết ticket kèm logs
  findOne: async (id: string) => {
    return api.get<SupportTicketItem>(`/support/requests/${id}`);
  },

  // Phân công nhân viên tiếp nhận ticket
  assignStaff: async (id: string, staffId: string) => {
    return api.patch<SupportTicketItem>(`/support/requests/${id}/assign`, { staffId });
  },

  // Cập nhật tiến độ / trạng thái xử lý
  updateProgress: async (id: string, dto: UpdateTicketProgressDto) => {
    return api.patch<SupportTicketItem>(`/support/requests/${id}/progress`, dto);
  },

  // Thêm phản hồi / ghi chú vào ticket
  addNote: async (id: string, note: string) => {
    return api.post<SupportTicketLog>(`/support/requests/${id}/notes`, { note });
  },
};
