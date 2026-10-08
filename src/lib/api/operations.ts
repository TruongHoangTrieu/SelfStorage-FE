import { api } from '../api';

export interface PolicyItem {
  id: number;
  facilityId?: number | null;
  policyType: string; // 'CANCELLATION' | 'OVERDUE' | 'DEPOSIT' | 'PRICING'
  name: string;
  description?: string;
  value: any; // JSON or primitive
  valueType: string; // 'JSON' | 'NUMBER' | 'STRING'
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: string;
  facility?: {
    id: number;
    name: string;
    code: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeTypeItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  defaultAmount: number;
  amountType: string; // 'FIXED' | 'PERCENTAGE'
  appliesTo: string; // 'GENERAL' | 'CHECKOUT' | 'LATE'
  status: string;
  createdAt?: string;
}

export interface ExtraChargeItem {
  id: number;
  contractId?: number | null;
  reservationId?: number | null;
  feeTypeId: number;
  amount: number;
  reason: string;
  status: string;
  feeType?: FeeTypeItem;
  creator?: {
    id: number;
    fullName: string;
    email?: string;
  };
  createdAt?: string;
}

export interface DiscountItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startDate: string;
  endDate?: string | null;
  maxUsage?: number | null;
  status: string;
  createdAt?: string;
}

export interface PaymentItem {
  id: number;
  paymentCode: string;
  reservationId?: number | null;
  contractId?: number | null;
  customerId: number;
  amount: number;
  paymentType: 'DEPOSIT' | 'RENTAL' | 'EXTRA_CHARGE' | 'REFUND';
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'VNPAY' | 'MOMO' | 'PAYOS' | 'OTHER';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  transferContent?: string;
  paymentDate?: string;
  transactionRef?: string;
  notes?: string;
  createdAt?: string;
  customer?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
  };
  reservation?: any;
  contract?: any;
}

export const operationsApi = {
  // ==================== POLICIES ====================
  async getPolicies(policyType?: string, facilityId?: number): Promise<PolicyItem[]> {
    try {
      const params = new URLSearchParams();
      if (policyType) params.append('policyType', policyType);
      if (facilityId) params.append('facilityId', String(facilityId));
      const res = await api.get(`/operations/policies?${params.toString()}`);
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.warn('Could not fetch policies from backend, returning mock', e);
      return [
        {
          id: 1,
          policyType: 'CANCELLATION',
          name: 'Chính sách hoàn cọc tiêu chuẩn',
          description: 'Hoàn 100% nếu báo trước 3 ngày, hoàn 50% trước 1 ngày',
          value: { refund_100_days: 3, refund_50_days: 1 },
          valueType: 'JSON',
          effectiveFrom: '2026-01-01',
          status: 'ACTIVE',
        },
        {
          id: 2,
          policyType: 'OVERDUE',
          name: 'Thời gian ân hạn và phạt quá hạn',
          description: 'Ân hạn 7 ngày trước khi khóa mã PIN, phạt 1.5%/ngày',
          value: { grace_period_days: 7, daily_fine_rate: 1.5 },
          valueType: 'JSON',
          effectiveFrom: '2026-01-01',
          status: 'ACTIVE',
        },
        {
          id: 3,
          policyType: 'DEPOSIT',
          name: 'Tỷ lệ cọc giữ chỗ và cọc bảo đảm',
          description: 'Cọc giữ chỗ 25% giá thuê, cọc bảo đảm hoàn lại 1.0 tháng',
          value: { reservation_deposit_percent: 25, security_deposit_months: 1 },
          valueType: 'JSON',
          effectiveFrom: '2026-01-01',
          status: 'ACTIVE',
        },
      ];
    }
  },

  async createPolicy(payload: {
    policyType: string;
    name: string;
    description?: string;
    value: any;
    valueType?: string;
    effectiveFrom: string;
    effectiveTo?: string;
    facilityId?: number;
  }): Promise<PolicyItem> {
    return await api.post('/operations/policies', payload);
  },

  // ==================== FEE TYPES ====================
  async getFeeTypes(): Promise<FeeTypeItem[]> {
    try {
      const res = await api.get('/operations/fee-types');
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.warn('Could not fetch fee-types, returning mock', e);
      return [
        {
          id: 1,
          name: 'Phí vệ sinh kho bãi',
          code: 'CLEANING_FEE',
          description: 'Thu khi trả kho bẩn hoặc để lại rác thải công nghiệp',
          defaultAmount: 200000,
          amountType: 'FIXED',
          appliesTo: 'CHECKOUT',
          status: 'ACTIVE',
        },
        {
          id: 2,
          name: 'Phí cấp lại thẻ từ RFID / Đổi chìa',
          code: 'LOST_CARD_FEE',
          description: 'Cấp thẻ từ mới khi khách làm mất thẻ gốc',
          defaultAmount: 150000,
          amountType: 'FIXED',
          appliesTo: 'GENERAL',
          status: 'ACTIVE',
        },
        {
          id: 3,
          name: 'Phí bốc xếp & kéo hàng ngoài giờ',
          code: 'OVERTIME_PORTER',
          description: 'Hỗ trợ bốc xếp hàng hóa sau 21h00',
          defaultAmount: 300000,
          amountType: 'FIXED',
          appliesTo: 'GENERAL',
          status: 'ACTIVE',
        },
        {
          id: 4,
          name: 'Phí lưu kho quá hạn (Theo ngày)',
          code: 'OVERDUE_STORAGE_FEE',
          description: 'Phụ phí phát sinh mỗi ngày khi chưa dọn kho sau khi hết hạn HĐ',
          defaultAmount: 100000,
          amountType: 'FIXED',
          appliesTo: 'LATE',
          status: 'ACTIVE',
        },
      ];
    }
  },

  async createFeeType(payload: {
    name: string;
    code: string;
    description?: string;
    defaultAmount: number;
    amountType?: string;
    appliesTo?: string;
  }): Promise<FeeTypeItem> {
    return await api.post('/operations/fee-types', payload);
  },

  // ==================== EXTRA CHARGES ====================
  async getExtraCharges(contractId?: number, reservationId?: number): Promise<ExtraChargeItem[]> {
    try {
      const params = new URLSearchParams();
      if (contractId) params.append('contractId', String(contractId));
      if (reservationId) params.append('reservationId', String(reservationId));
      const res = await api.get(`/operations/extra-charges?${params.toString()}`);
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.warn('Could not fetch extra charges, returning mock', e);
      return [
        {
          id: 1,
          contractId: 1,
          feeTypeId: 1,
          amount: 200000,
          reason: 'Phụ thu dọn dẹp vệ sinh kho bãi khi trả kho',
          status: 'PAID',
          feeType: {
            id: 1,
            name: 'Phí vệ sinh kho bãi',
            code: 'CLEANING_FEE',
            defaultAmount: 200000,
            amountType: 'FIXED',
            appliesTo: 'CHECKOUT',
            status: 'ACTIVE',
          },
          createdAt: '2026-09-28T10:00:00Z',
        },
      ];
    }
  },

  async createExtraCharge(payload: {
    contractId?: number;
    reservationId?: number;
    feeTypeId: number;
    amount: number;
    reason: string;
  }): Promise<ExtraChargeItem> {
    return await api.post('/operations/extra-charges', payload);
  },

  // ==================== DISCOUNTS & VOUCHERS ====================
  async getDiscounts(): Promise<DiscountItem[]> {
    try {
      const res = await api.get('/operations/discounts');
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.warn('Could not fetch discounts, returning mock', e);
      return [
        {
          id: 1,
          code: 'WELCOME2026',
          name: 'Ưu đãi thành viên mới 10%',
          description: 'Giảm 10% tiền thuê tháng đầu tiên cho khách hàng mới',
          discountType: 'PERCENTAGE',
          value: 10,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          maxUsage: 500,
          status: 'ACTIVE',
        },
        {
          id: 2,
          code: 'LONGTERM15',
          name: 'Khách hàng thuê dài hạn 12 tháng',
          description: 'Giảm 15% tổng giá trị khi thuê từ 1 năm trở lên',
          discountType: 'PERCENTAGE',
          value: 15,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          maxUsage: 200,
          status: 'ACTIVE',
        },
        {
          id: 3,
          code: 'VOUCHER500K',
          name: 'Phiếu giảm trực tiếp 500.000 đ',
          description: 'Áp dụng cho ngăn kho diện tích trên 10m²',
          discountType: 'FIXED_AMOUNT',
          value: 500000,
          startDate: '2026-05-01',
          endDate: '2026-11-30',
          maxUsage: 100,
          status: 'ACTIVE',
        },
      ];
    }
  },

  async createDiscount(payload: {
    code: string;
    name: string;
    description?: string;
    discountType?: string;
    value: number;
    startDate: string;
    endDate?: string;
    maxUsage?: number;
  }): Promise<DiscountItem> {
    return await api.post('/operations/discounts', payload);
  },

  async validateDiscount(code: string): Promise<any> {
    return await api.get(`/operations/discounts/validate/${code.toUpperCase()}`);
  },

  // ==================== PAYMENTS & REVENUE LEDGER ====================
  async getAllPayments(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentType?: string;
    paymentMethod?: string;
    search?: string;
  }): Promise<{ payments: PaymentItem[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.status) params.append('status', filters.status);
      if (filters?.paymentType) params.append('paymentType', filters.paymentType);
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters?.search) params.append('search', filters.search);

      const res = await api.get(`/payments?${params.toString()}`);
      const rawList = Array.isArray(res) ? res : (res?.data || []);
      const enrichedList: PaymentItem[] = rawList.map((p: any) => {
        const custId = p.customer?.id || p.contract?.customerId || p.reservation?.customerId || p.customerId;
        const cust = p.customer || p.contract?.customer || p.reservation?.customer || (
          custId === 11
            ? { id: 11, fullName: 'Nguyễn Văn Khách Hàng', email: 'customer@selfstorage.vn', phone: '0912345678' }
            : custId === 2
            ? { id: 2, fullName: 'Nguyen Van Customer', email: 'customer@test.com', phone: '0901234567' }
            : { id: custId || 1, fullName: `Khách hàng #${custId || 1}`, email: 'customer@selfstorage.vn', phone: '' }
        );

        return {
          id: p.id,
          paymentCode: p.paymentCode,
          customerId: custId,
          amount: Number(p.amount || 0),
          paymentType: p.paymentType,
          paymentMethod: p.paymentMethod,
          status: p.status,
          transferContent: p.transactionReference || p.paymentCode,
          paymentDate: p.paidAt ? new Date(p.paidAt).toLocaleDateString('vi-VN') : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'),
          createdAt: p.createdAt,
          customer: cust,
          contract: p.contract,
          reservation: p.reservation,
        };
      });

      return {
        payments: enrichedList,
        total: res?.total || (res?.pagination?.total ?? enrichedList.length),
      };
    } catch (e) {
      console.warn('Could not fetch payments from backend, returning mock', e);
      return {
        payments: [
          {
            id: 101,
            paymentCode: 'PAY-20260920-001',
            customerId: 1,
            amount: 500000,
            paymentType: 'DEPOSIT',
            paymentMethod: 'BANK_TRANSFER',
            status: 'SUCCESS',
            transferContent: 'SSDEP RSV-20260918-001',
            paymentDate: '2026-09-20T08:30:00Z',
            customer: { id: 1, fullName: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0901234567' },
          },
          {
            id: 102,
            paymentCode: 'PAY-20260921-002',
            customerId: 2,
            amount: 1800000,
            paymentType: 'RENTAL',
            paymentMethod: 'VNPAY',
            status: 'SUCCESS',
            transferContent: 'SSRENT CON-20260921-A104',
            paymentDate: '2026-09-21T09:15:00Z',
            customer: { id: 2, fullName: 'Trần Thị Mai', email: 'mai.tran@gmail.com', phone: '0912345678' },
          },
          {
            id: 103,
            paymentCode: 'PAY-20260925-003',
            customerId: 3,
            amount: 2500000,
            paymentType: 'RENTAL',
            paymentMethod: 'BANK_TRANSFER',
            status: 'SUCCESS',
            transferContent: 'SSRENT CON-20260925-B205',
            paymentDate: '2026-09-25T14:40:00Z',
            customer: { id: 3, fullName: 'Lê Hoàng Nam', email: 'nam.le@gmail.com', phone: '0987654321' },
          },
          {
            id: 104,
            paymentCode: 'PAY-20261001-004',
            customerId: 4,
            amount: 200000,
            paymentType: 'EXTRA_CHARGE',
            paymentMethod: 'MOMO',
            status: 'SUCCESS',
            transferContent: 'SSFEE CLEANING-A104',
            paymentDate: '2026-10-01T11:00:00Z',
            customer: { id: 4, fullName: 'Phạm Minh Đức', email: 'duc.pham@gmail.com', phone: '0933221100' },
          },
          {
            id: 105,
            paymentCode: 'PAY-20261005-005',
            customerId: 5,
            amount: 4800000,
            paymentType: 'RENTAL',
            paymentMethod: 'PAYOS',
            status: 'PENDING',
            transferContent: 'SSRENT CON-20261005-C302',
            paymentDate: '2026-10-05T16:20:00Z',
            customer: { id: 5, fullName: 'Đỗ Quốc Hùng', email: 'hung.do@gmail.com', phone: '0977889900' },
          },
        ],
        total: 5,
      };
    }
  },
};
