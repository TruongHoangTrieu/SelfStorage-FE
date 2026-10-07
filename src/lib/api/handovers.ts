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

  // Parse appointment date & time theo chuẩn múi giờ Việt Nam (Asia/Ho_Chi_Minh / GMT+7)
  let slotTime = '09:00 - 10:00';
  let timeCategory: 'morning' | 'afternoon' = 'morning';
  let startDate = '20/09/2026';
  let dateDisplay = 'Hôm nay';

  if (item.appointmentDate) {
    try {
      const dateObj = new Date(item.appointmentDate);

      // Định dạng theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const parts = fmt.formatToParts(dateObj);
      const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

      const day = getPart('day');
      const month = getPart('month');
      const year = getPart('year');
      const hourStr = getPart('hour');
      const minStr = getPart('minute');
      const hourNum = parseInt(hourStr, 10);

      // Phân loại sáng (08:00 - 12:00) / chiều (13:00 - 18:00)
      timeCategory = hourNum < 12 ? 'morning' : 'afternoon';

      // Khung giờ chuẩn Việt Nam (24h): "08:00 - 09:00", "13:00 - 14:00"
      const endHourNum = (hourNum + 1) % 24;
      const endHourStr = endHourNum.toString().padStart(2, '0');
      slotTime = `${hourStr}:${minStr} - ${endHourStr}:${minStr}`;
      startDate = `${day}/${month}/${year}`;

      // So sánh ngày hẹn với ngày hôm nay & ngày mai (theo giờ Việt Nam)
      const nowVnParts = fmt.formatToParts(new Date());
      const getNowPart = (type: string) => nowVnParts.find((p) => p.type === type)?.value || '';
      const nowDay = getNowPart('day');
      const nowMonth = getNowPart('month');
      const nowYear = getNowPart('year');

      const apptDateKey = `${year}-${month}-${day}`;
      const nowDateKey = `${nowYear}-${nowMonth}-${nowDay}`;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomVnParts = fmt.formatToParts(tomorrow);
      const getTomPart = (type: string) => tomVnParts.find((p) => p.type === type)?.value || '';
      const tomDateKey = `${getTomPart('year')}-${getTomPart('month')}-${getTomPart('day')}`;

      if (apptDateKey === nowDateKey) {
        dateDisplay = 'Hôm nay';
      } else if (apptDateKey === tomDateKey) {
        dateDisplay = `Ngày mai (${day}/${month})`;
      } else {
        dateDisplay = `${day}/${month}/${year}`;
      }
    } catch {
      // fallback
    }
  }

  // Map backend status to UI status
  let uiStatus: CheckInAppointment['status'] = 'pending';
  const rawStatus = (item.status || '').toUpperCase();
  if (rawStatus === 'COMPLETED') {
    uiStatus = 'completed';
  } else if (rawStatus === 'CONFIRMED') {
    uiStatus = 'confirmed';
  } else if (rawStatus === 'ARRIVED') {
    uiStatus = 'arrived';
  } else if (rawStatus === 'IN_PROGRESS' || rawStatus === 'PROCESSING') {
    uiStatus = 'in_progress';
  } else if (rawStatus === 'CANCELLED') {
    uiStatus = 'cancelled';
  } else if (rawStatus === 'EXPIRED') {
    uiStatus = 'expired';
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
    facilityAddress: item.facility?.address || 'Khu B, Bình Thạnh',
    customerName: item.customer?.fullName || 'Khách hàng',
    phone: item.customer?.phone || '0900 000 000',
    email: item.customer?.email || 'customer@selfstorage.com',
    idCard: item.customer?.idCard || '079095012345',
    slotTime,
    dateDisplay,
    appointmentDateRaw: item.appointmentDate,
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
    cancelReason: item.cancelReason || item.cancellationReason || (rawStatus === 'CANCELLED' ? item.notes : undefined),
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
      // Gọi nhẹ endpoint public kiểm tra backend hoạt động
      await api.get('/storage-units', { timeoutMs: 3000 });
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
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend staff logout notice:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  /**
   * Fetch check-in reservations queue (Trang A)
   */
  async fetchCheckInQueue(params?: {
    status?: string;
    facilityId?: number | string;
    search?: string;
    phone?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: CheckInAppointment[]; total: number }> {
    const query = new URLSearchParams();
    query.set('page', String(params?.page || 1));
    query.set('limit', String(params?.limit || 50));
    if (params?.status && params.status !== 'all') {
      if (params.status === 'completed') {
        query.set('status', 'COMPLETED');
      } else if (params.status === 'cancelled') {
        query.set('status', 'CANCELLED');
      } else {
        query.set('status', 'PENDING');
      }
    }
    if (params?.facilityId) query.set('facilityId', String(params.facilityId));
    if (params?.search) query.set('search', params.search);
    if (params?.phone) query.set('phone', params.phone);

    const res = await api.get(`/reservations?${query.toString()}`);
    const rawList = Array.isArray(res) ? res : (res?.data || []);

    const items = rawList.map(normalizeReservation);
    return { items, total: items.length };
  },

  /**
   * Dời lịch hẹn nhận kho (Reschedule)
   */
  async rescheduleReservation(
    reservationId: string | number,
    newAppointmentDate: string,
    notes?: string
  ): Promise<any> {
    const rawId = typeof reservationId === 'string' && reservationId.startsWith('RSV-')
      ? reservationId.replace('RSV-', '')
      : reservationId;

    return await api.patch(`/reservations/${rawId}`, {
      appointmentDate: newAppointmentDate,
      notes: notes || undefined,
    });
  },

  /**
   * Báo vắng mặt / Hủy đơn và giải phóng ô kho (No-show / Cancel)
   */
  async cancelReservation(
    reservationId: string | number,
    reason: string
  ): Promise<any> {
    const rawId = typeof reservationId === 'string' && reservationId.startsWith('RSV-')
      ? reservationId.replace('RSV-', '')
      : reservationId;

    return await api.post(`/reservations/${rawId}/cancel`, {
      reason: reason || 'Khách không đến (No-show) quá thời hạn quy định',
    });
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
  async fetchAvailableUnits(facilityId?: number | string): Promise<AvailableUnit[]> {
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
    reservationId: number | string;
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
