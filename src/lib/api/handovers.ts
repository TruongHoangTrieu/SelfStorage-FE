import { api, ApiError } from '../api';
import { CheckInAppointment, AvailableUnit, StaffUser } from '../../app/staff/types';

export interface BackendCheckInResponse {
  message: string;
  reservation: {
    id: number;
    reservationCode: string;
    status: string;
    facility?: {
      id: number;
      name: string;
      code?: string;
      address?: string;
    };
    customer?: {
      id: number;
      fullName: string;
      email: string;
      phone: string;
    };
  };
  contract: {
    id: number;
    contractCode: string;
    status: string;
    startDate: string;
    endDate: string;
    signedAt?: string;
  };
  contractItems: Array<{
    id: number;
    unitId: number;
    unitNumber: string;
    rentalPrice: string;
    depositAmount: string;
    accessCode: string;
    accessCodeStatus: string;
    status: string;
  }>;
  handoverRecords: Array<{
    id: number;
    contractItemId: number;
    staffId: number;
    type: string;
    condition: string;
    notes?: string;
    inspectionDate: string;
  }>;
}

/**
 * Normalizes backend reservation object to UI CheckInAppointment
 */
export function normalizeReservation(item: any): CheckInAppointment {
  const firstItem = item.items?.[0] || {};
  const unit = firstItem.unit || {};
  const unitType = firstItem.unitType || {};

  // Parse appointment date & time
  let slotTime = '09:00 SA';
  let timeCategory: 'morning' | 'afternoon' = 'morning';
  let startDate = '20/09/2026';

  if (item.appointmentDate) {
    try {
      const dateObj = new Date(item.appointmentDate);
      const hours = dateObj.getHours();
      const mins = dateObj.getMinutes().toString().padStart(2, '0');
      timeCategory = hours < 12 ? 'morning' : 'afternoon';
      const period = hours < 12 ? 'SA' : 'CH';
      slotTime = `${hours % 12 || 12}:${mins} ${period}`;
      startDate = dateObj.toLocaleDateString('vi-VN');
    } catch {
      // fallback
    }
  }

  // Map backend status to UI status
  let uiStatus: CheckInAppointment['status'] = 'pending';
  const rawStatus = (item.status || '').toUpperCase();
  if (rawStatus === 'COMPLETED') {
    uiStatus = 'completed';
  } else if (rawStatus === 'CONFIRMED' || rawStatus === 'ARRIVED') {
    uiStatus = 'arrived';
  } else if (rawStatus === 'IN_PROGRESS' || rawStatus === 'PROCESSING') {
    uiStatus = 'in_progress';
  } else {
    uiStatus = 'pending';
  }

  const depositVal = firstItem.depositAmount ? Number(firstItem.depositAmount) : 0;
  const depositFormatted = depositVal > 0
    ? `${new Intl.NumberFormat('vi-VN').format(depositVal)} đ (100%)`
    : 'Chưa đặt cọc';

  const monthlyRentVal = firstItem.price ? Number(firstItem.price) : (item.totalAmount ? Number(item.totalAmount) : 0);
  const monthlyRentFormatted = monthlyRentVal > 0
    ? `${new Intl.NumberFormat('vi-VN').format(monthlyRentVal)} đ/tháng`
    : '1.200.000 đ/tháng';

  return {
    id: item.reservationCode || `RSV-${item.id}`,
    rawId: item.id,
    facilityId: item.facilityId || item.facility?.id,
    facilityName: item.facility?.name || 'Cơ sở Landmark 81',
    facilityAddress: item.facility?.address || 'Khu B, Bình Thạnh, TP.HCM',
    customerName: item.customer?.fullName || 'Khách hàng',
    phone: item.customer?.phone || '0900 000 000',
    email: item.customer?.email || 'customer@selfstorage.com',
    idCard: item.customer?.idCard || '079095012345',
    slotTime,
    timeCategory,
    unitType: unitType.name || 'Kho Tiêu chuẩn',
    unitTypeId: unitType.id,
    unitSize: unitType.size ? `${unitType.size} ${unitType.sizeUnit || 'm²'}` : '3m² (1.5 x 2.0m)',
    unitId: unit.id,
    assignedUnit: unit.unitNumber || `U-${item.id}`,
    preferredFloor: unit.floor || 'Tầng 1',
    status: uiStatus,
    depositStatus: depositVal > 0 ? 'paid' : 'unpaid',
    depositAmount: depositFormatted,
    monthlyRent: monthlyRentFormatted,
    startDate,
    durationMonths: item.rentalPeriod || 6,
    purpose: item.notes || 'Lưu trữ đồ gia đình và hồ sơ cá nhân',
    specialNotes: unit.condition ? `Hiện trạng ô kho: ${unit.condition}` : undefined,
    accessPin: firstItem.accessCode || undefined,
    contractCode: item.rentalContract?.contractCode || undefined,
    completedAt: rawStatus === 'COMPLETED' ? 'Đã hoàn tất' : undefined,
  };
}

/**
 * Normalizes backend storage unit to UI AvailableUnit
 */
export function normalizeStorageUnit(unit: any): AvailableUnit {
  const unitType = unit.unitType || {};
  return {
    id: `u-${unit.id}`,
    rawId: unit.id,
    code: unit.unitNumber,
    type: unitType.name || 'Kho Tiêu chuẩn',
    size: unitType.size ? `${unitType.size} ${unitType.sizeUnit || 'm²'}` : '3m²',
    floor: unit.floor || 'Tầng 1',
    zone: unit.zone || 'Khu A',
    features: unit.condition || 'Khóa Smart Lock IoT',
    status: unit.status === 'AVAILABLE' ? 'vacant' : unit.status === 'OCCUPIED' ? 'occupied' : 'maintenance',
  };
}

/**
 * Service API for Flow 2 (Check-in & Handover)
 */
export const handoversApi = {
  /**
   * Check backend connection / health
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Gọi nhẹ endpoint public hoặc login test
      await api.get('/storage-units?limit=1', { timeoutMs: 3000 });
      return true;
    } catch (err: any) {
      if (err instanceof ApiError && err.status > 0) {
        // Có HTTP response từ backend (dù 401 hay 403) nghĩa là backend đang ONLINE
        return true;
      }
      return false;
    }
  },

  /**
   * Staff login
   */
  async loginStaff(email: string, password: string): Promise<{ token: string; user: StaffUser }> {
    const res = await api.post('/auth/login', { email, password });
    if (res?.accessToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
      return { token: res.accessToken, user: res.user };
    }
    throw new Error('Đăng nhập thất bại: Không nhận được token');
  },

  /**
   * Get current stored staff user
   */
  getStoredUser(): StaffUser | null {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem('user');
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  },

  /**
   * Staff logout
   */
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Fetch check-in reservations queue (Trang A)
   */
  async fetchCheckInQueue(params?: {
    status?: string;
    facilityId?: number;
    search?: string;
    phone?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: CheckInAppointment[]; total: number }> {
    const query = new URLSearchParams();
    query.set('page', String(params?.page || 1));
    query.set('limit', String(params?.limit || 50));
    if (params?.status && params.status !== 'all') {
      const beStatus = params.status === 'completed' ? 'COMPLETED' : 'PENDING';
      query.set('status', beStatus);
    }
    if (params?.facilityId) query.set('facilityId', String(params.facilityId));
    if (params?.search) query.set('search', params.search);
    if (params?.phone) query.set('phone', params.phone);

    const res = await api.get(`/reservations?${query.toString()}`);
    const rawList = Array.isArray(res) ? res : (res?.data || []);
    const total = res?.total || rawList.length;

    const items = rawList.map(normalizeReservation);
    return { items, total };
  },

  /**
   * Fetch single reservation detail prepared for check-in (Trang B)
   */
  async fetchReservationForCheckIn(reservationId: number): Promise<CheckInAppointment> {
    const res = await api.get(`/handovers/reservations/${reservationId}`);
    return normalizeReservation(res);
  },

  /**
   * Fetch available storage units for reassignment (Trang B dropdown)
   */
  async fetchAvailableUnits(facilityId?: number): Promise<AvailableUnit[]> {
    const query = new URLSearchParams();
    query.set('status', 'AVAILABLE');
    if (facilityId) query.set('facilityId', String(facilityId));

    const res = await api.get(`/storage-units?${query.toString()}`);
    const rawList = Array.isArray(res) ? res : (res?.data || []);
    return rawList.map(normalizeStorageUnit);
  },

  /**
   * Perform Check-in and Handover (Trang B -> Trang C)
   */
  async performCheckIn(payload: {
    reservationId: number;
    condition: string;
    notes?: string;
    photos?: string[];
  }): Promise<BackendCheckInResponse> {
    const body = {
      reservationId: Number(payload.reservationId),
      condition: payload.condition || 'Kho sạch sẽ, khóa thông minh hoạt động tốt, đã bàn giao mã',
      notes: payload.notes || 'Đã bàn giao mã PIN và hướng dẫn khách sử dụng kho',
      photos: payload.photos || [],
    };
    return await api.post<BackendCheckInResponse>('/handovers/check-in', body);
  },
};
