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

export type SupportRealtimeEvent =
  | { type: 'support_ticket_created'; ticket: SupportTicketItem }
  | { type: 'support_ticket_updated'; ticket: SupportTicketItem }
  | { type: 'support_ticket_note_added'; ticketId: string; log: SupportTicketLog };

const SUPPORT_CHANNEL_NAME = 'selfstorage_support_realtime';
const SUPPORT_STORAGE_KEY = 'selfstorage_support_rt_event';

export function emitSupportRealtimeEvent(event: SupportRealtimeEvent) {
  if (typeof window === 'undefined') return;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(SUPPORT_CHANNEL_NAME);
      bc.postMessage(event);
      bc.close();
    }
  } catch {}
  try {
    localStorage.setItem(
      SUPPORT_STORAGE_KEY,
      JSON.stringify({ ...event, _ts: Date.now() })
    );
  } catch {}
  window.dispatchEvent(new CustomEvent(SUPPORT_CHANNEL_NAME, { detail: event }));
}

export function subscribeSupportRealtimeEvent(
  handler: (event: SupportRealtimeEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let bc: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(SUPPORT_CHANNEL_NAME);
      bc.onmessage = (msg) => {
        if (msg?.data?.type) handler(msg.data);
      };
    }
  } catch {}

  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<SupportRealtimeEvent>).detail;
    if (detail?.type) handler(detail);
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key === SUPPORT_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.type) handler(parsed);
      } catch {}
    }
  };

  window.addEventListener(SUPPORT_CHANNEL_NAME, onCustom);
  window.addEventListener('storage', onStorage);

  return () => {
    if (bc) bc.close();
    window.removeEventListener(SUPPORT_CHANNEL_NAME, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const supportApi = {
  // Upload ảnh sự cố / hỗ trợ lên server (Cloudinary) kèm fallback DataURL
  uploadPhoto: async (file: File): Promise<{ url: string; public_id?: string }> => {
    const formData = new FormData();
    formData.append('photo', file);

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') || localStorage.getItem('access_token')
        : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    // 1. Thử endpoint /api/support/upload-photo nếu có
    try {
      const resSupport = await fetch('/api/support/upload-photo', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });
      if (resSupport.ok) {
        const data = await resSupport.json();
        if (data?.url) return data;
      }
    } catch {}

    // 2. Dùng endpoint chuẩn Cloudinary /api/handovers/upload-photo
    try {
      const resHandover = await fetch('/api/handovers/upload-photo', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });
      if (resHandover.ok) {
        const data = await resHandover.json();
        if (data?.url) return data;
      }
    } catch {}

    // 3. Fallback DataURL để luôn hiển thị được hình ảnh
    const dataUrl = await fileToDataUrl(file);
    return { url: dataUrl };
  },

  // Tạo ticket mới
  create: async (dto: CreateSupportTicketDto) => {
    const res = await api.post<SupportTicketItem>('/support/requests', dto);
    if (res) {
      emitSupportRealtimeEvent({ type: 'support_ticket_created', ticket: res });
    }
    return res;
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
    const res = await api.patch<SupportTicketItem>(`/support/requests/${id}/assign`, { staffId });
    if (res) {
      emitSupportRealtimeEvent({ type: 'support_ticket_updated', ticket: res });
    }
    return res;
  },

  // Cập nhật tiến độ / trạng thái xử lý
  updateProgress: async (id: string, dto: UpdateTicketProgressDto) => {
    const res = await api.patch<SupportTicketItem>(`/support/requests/${id}/progress`, dto);
    if (res) {
      emitSupportRealtimeEvent({ type: 'support_ticket_updated', ticket: res });
    }
    return res;
  },

  // Thêm phản hồi / ghi chú vào ticket
  addNote: async (id: string, note: string) => {
    const res = await api.post<SupportTicketLog>(`/support/requests/${id}/notes`, { note });
    if (res) {
      emitSupportRealtimeEvent({ type: 'support_ticket_note_added', ticketId: id, log: res });
    }
    return res;
  },
};
