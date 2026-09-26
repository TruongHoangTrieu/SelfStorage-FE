import { api, ApiError } from '../api';
import { CustomerUnit, CustomerUser, PaymentRecord, SupportTicket } from '../../app/dashboard/types';

/**
 * Normalizes backend RentalContract items to frontend CustomerUnit[]
 */
export function normalizeCustomerContract(contract: any): CustomerUnit[] {
  if (!contract || !Array.isArray(contract.contractItems)) return [];

  const startDate = contract.startDate ? new Date(contract.startDate) : new Date();
  const endDate = contract.endDate ? new Date(contract.endDate) : new Date();
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let uiStatus: CustomerUnit['status'] = 'active';
  let uiStatusLabel = 'Đang hoạt động';

  if (contract.status === 'TERMINATED' || contract.status === 'EXPIRED') {
    uiStatus = 'overdue';
    uiStatusLabel = 'Hết hạn';
  } else if (daysRemaining <= 7) {
    uiStatus = 'expiring';
    uiStatusLabel = `Sắp hết hạn (${daysRemaining} ngày)`;
  }

  // Calculate next billing date: 1 month from today or endDate
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextBillingDate = nextMonth.toLocaleDateString('vi-VN');

  return contract.contractItems.map((item: any) => {
    const unit = item.unit || {};
    const unitType = unit.unitType || {};
    const facility = unit.facility || contract.facility || {};

    const rentalPriceNum = item.rentalPrice ? Number(item.rentalPrice) : 1800000;
    const depositNum = item.depositAmount ? Number(item.depositAmount) : 0;

    const dimensions = unitType.length && unitType.width && unitType.height
      ? `${unitType.length}m x ${unitType.width}m x ${unitType.height}m`
      : '3.0m x 3.0m x 2.8m';

    const area = unitType.size
      ? `${unitType.size} ${unitType.sizeUnit || 'm²'}`
      : '9.0 m²';

    // Map any nested support requests
    const supportTickets: SupportTicket[] = Array.isArray(item.supportRequests)
      ? item.supportRequests.map((sr: any) => ({
          id: sr.ticketCode || `TK-${sr.id}`,
          title: sr.subject || 'Yêu cầu hỗ trợ',
          unitCode: unit.unitNumber ? `Ô ${unit.unitNumber}` : 'Ô kho',
          category: sr.category || 'Hỗ trợ kỹ thuật',
          createdAt: sr.createdAt ? new Date(sr.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
          status: (sr.status === 'RESOLVED' || sr.status === 'CLOSED') ? 'resolved' : sr.status === 'IN_PROGRESS' ? 'in_progress' : 'open',
          lastReply: sr.resolutionNotes || 'Đang được kỹ thuật viên tiếp nhận xử lý.',
        }))
      : [];

    return {
      id: String(item.id),
      unitNumber: unit.unitNumber ? `Ô ${unit.unitNumber}` : `Ô #${item.unitId || item.id}`,
      unitType: unitType.name || 'Kho Cá nhân Tiêu chuẩn',
      size: `${area} ${unitType.climateControlled ? 'Có điều hòa nhiệt độ' : 'Thông gió tự nhiên'}`,
      dimensions,
      area,
      facilityId: facility.id || unit.facilityId || 1,
      facilityName: facility.name || 'Cơ sở Landmark 81 - Chi nhánh Bình Thạnh',
      facilityAddress: facility.address || 'Khu B, Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh, TP.HCM',
      zone: unit.zone || 'Khu A',
      floor: unit.floor || 'Tầng 1 (Kế thang máy)',
      status: uiStatus,
      statusLabel: uiStatusLabel,
      daysRemaining,
      nextBillingDate,
      monthlyRent: `${new Intl.NumberFormat('vi-VN').format(rentalPriceNum)} đ/tháng`,
      monthlyRentNum: rentalPriceNum,
      contractStartDate: startDate.toLocaleDateString('vi-VN'),
      contractEndDate: endDate.toLocaleDateString('vi-VN'),
      contractId: contract.contractCode || `HĐ-${contract.id}`,
      totalPaid: `${new Intl.NumberFormat('vi-VN').format(rentalPriceNum + depositNum)} đ`,
      currentBalance: '0 đ (Đã thanh toán đủ)',
      temperature: unitType.climateControlled ? '22°C (Mát mẻ)' : '28°C (Thông thoáng)',
      humidity: unitType.climateControlled ? '50% (Tối ưu chống ẩm)' : '65%',
      mainPin: item.accessCode || '******',
      rfidCard: `RFID-${9900 + item.id}`,
      isClimateControlled: unitType.climateControlled ?? true,
      guestPasses: [],
      paymentHistory: [],
      supportTickets,
      rawContractId: contract.id,
      rawContractItemId: item.id,
      rawUnitId: unit.id || item.unitId,
    };
  });
}

/**
 * Normalizes backend Payment to UI PaymentRecord
 */
export function normalizePayment(p: any): PaymentRecord {
  const amountNum = p.amount ? Number(p.amount) : 0;
  return {
    id: String(p.id),
    invoiceNumber: p.paymentCode || `INV-${p.id}`,
    date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('vi-VN') : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'),
    amount: `${new Intl.NumberFormat('vi-VN').format(amountNum)} đ`,
    period: p.paymentType === 'DEPOSIT' ? 'Tiền đặt cọc giữ chỗ' : 'Kỳ tiền thuê kho',
    method: p.paymentMethod || 'Chuyển khoản SePay / VietQR',
    status: p.status === 'SUCCESS' ? 'paid' : p.status === 'FAILED' ? 'overdue' : 'pending',
  };
}

/**
 * Normalizes backend SupportRequest to UI SupportTicket
 */
export function normalizeSupportRequest(sr: any): SupportTicket {
  const item = sr.contractItem || {};
  const unit = item.unit || {};
  return {
    id: sr.ticketCode || `TK-${sr.id}`,
    title: sr.subject || 'Yêu cầu hỗ trợ',
    unitCode: unit.unitNumber ? `Ô ${unit.unitNumber}` : 'Ô kho',
    category: sr.category || 'Khác',
    createdAt: sr.createdAt ? new Date(sr.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
    status: (sr.status === 'RESOLVED' || sr.status === 'CLOSED') ? 'resolved' : sr.status === 'IN_PROGRESS' ? 'in_progress' : 'open',
    lastReply: sr.resolutionNotes || 'Đã ghi nhận, kỹ thuật viên cơ sở đang xử lý.',
  };
}

/**
 * API Service for Luồng 3: Rented Storage Unit Management
 */
export const customerUnitsApi = {
  /**
   * Health check to detect if backend is online
   */
  async checkHealth(): Promise<boolean> {
    try {
      await api.get('/storage-units?limit=1', { timeoutMs: 3000 });
      return true;
    } catch (err: any) {
      if (err instanceof ApiError && err.status > 0) {
        // Backend replied with HTTP status (even 401/403) -> backend is ONLINE
        return true;
      }
      return false;
    }
  },

  /**
   * Customer login
   */
  async loginCustomer(email: string, password: string): Promise<{ token: string; user: CustomerUser }> {
    const res = await api.post('/auth/login', { email, password });
    if (res?.accessToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('customer_user', JSON.stringify(res.user));
      }
      return { token: res.accessToken, user: res.user };
    }
    throw new Error('Đăng nhập thất bại: Không nhận được token từ máy chủ');
  },

  /**
   * Get currently stored customer user
   */
  getStoredCustomer(): CustomerUser | null {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem('customer_user') || localStorage.getItem('user');
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  },

  /**
   * Logout customer
   */
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('customer_user');
    }
  },

  /**
   * Fetch customer's active contracts and units (GET /contracts/my-contracts)
   */
  async fetchMyContracts(): Promise<CustomerUnit[]> {
    const res = await api.get('/contracts/my-contracts');
    const contracts = Array.isArray(res) ? res : (res?.data || []);
    return contracts.flatMap(normalizeCustomerContract);
  },

  /**
   * Get smart lock info for a specific unit (GET /contracts/:contractId/units/:unitId/smart-lock)
   */
  async getSmartLockInfo(contractId: number, unitId: number): Promise<{
    accessCode: string;
    accessCodeStatus: string;
    lockType: string;
    lockModel: string;
  }> {
    return await api.get(`/contracts/${contractId}/units/${unitId}/smart-lock`);
  },

  /**
   * Customer changes Smart Lock PIN (POST /contracts/:contractId/units/:unitId/smart-lock/change-pin)
   */
  async changeSmartLockPin(contractId: number, unitId: number, newPin: string): Promise<{
    message: string;
    unitId: number;
    accessCode: string;
  }> {
    return await api.post(`/contracts/${contractId}/units/${unitId}/smart-lock/change-pin`, {
      newPin,
    });
  },

  /**
   * Fetch customer's payments history (GET /payments)
   */
  async fetchPayments(): Promise<PaymentRecord[]> {
    try {
      const res = await api.get('/payments?limit=50');
      const list = Array.isArray(res) ? res : (res?.data || []);
      return list.map(normalizePayment);
    } catch (e) {
      console.warn('Could not fetch /payments, returning empty', e);
      return [];
    }
  },

  /**
   * Fetch customer's support requests (GET /support/requests)
   */
  async fetchSupportRequests(): Promise<SupportTicket[]> {
    try {
      const res = await api.get('/support/requests?limit=50');
      const list = Array.isArray(res) ? res : (res?.data || []);
      return list.map(normalizeSupportRequest);
    } catch (e) {
      console.warn('Could not fetch /support/requests, returning empty', e);
      return [];
    }
  },

  /**
   * Create a new support ticket / incident report (POST /support/requests)
   */
  async createSupportRequest(payload: {
    facilityId: number;
    contractItemId?: number;
    category: string;
    subject: string;
    description: string;
    priority?: string;
    photos?: string[];
  }): Promise<SupportTicket> {
    const res = await api.post('/support/requests', payload);
    return normalizeSupportRequest(res);
  },
};
