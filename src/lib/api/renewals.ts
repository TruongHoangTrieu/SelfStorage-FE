import { api } from '../api';

export interface RenewalRecord {
  id: string;
  contractId: string;
  customerId: string;
  requestedMonths: number;
  currentEndDate: string;
  proposedEndDate: string;
  calculatedAmount: number;
  discountRate: number;
  finalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  contract?: {
    id: string;
    contractCode?: string;
    status: string;
    customer?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string;
    };
    contractItems?: Array<{
      unit?: {
        unitNumber: string;
        facility?: {
          name: string;
          code?: string;
        };
      };
    }>;
  };
}

export interface OverdueRecord {
  id: string;
  contractId: string;
  customerId?: string;
  daysOverdue?: number;
  overdueDays?: number;
  overdueFee: number;
  liquidationThresholdDays?: number;
  dailyFinePercent?: number;
  liquidationStatus?: 'REQUESTED' | 'COMPLETED' | null;
  liquidationRequestedAt?: string;
  liquidationNotes?: string;
  liquidationCondition?: string;
  liquidationPhotos?: string[];
  liquidationNewPin?: string;
  liquidationForfeitedDeposit?: number;
  liquidationRemainingDebt?: number;
  status: 'OPEN' | 'RESOLVED' | 'WAIVED';
  notes?: string;
  resolvedAt?: string;
  waivedAt?: string;
  createdAt: string;
  updatedAt: string;
  contract?: {
    id: string;
    contractCode?: string;
    endDate: string;
    status: string;
    customer?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string;
    };
    contractItems?: Array<{
      id?: string;
      accessCode?: string;
      accessCodeStatus?: string;
      depositAmount?: number;
      rentalPrice?: number;
      unit?: {
        id: string;
        unitNumber: string;
        status: string;
        unitType?: {
          id: string;
          name: string;
          size?: number;
        };
        facility?: {
          id: string;
          name: string;
        };
      };
    }>;
  };
}

export const renewalsApi = {
  // Khách hàng / Nhân viên gửi yêu cầu gia hạn
  requestRenewal: async (dto: { contractId: string; months: number; notes?: string }) => {
    return api.post<RenewalRecord>('/renewals/request', dto);
  },

  // Danh sách yêu cầu gia hạn
  getRenewals: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    contractId?: string;
    facilityId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.status) q.append('status', params.status);
    if (params?.contractId) q.append('contractId', params.contractId);
    if (params?.facilityId) q.append('facilityId', params.facilityId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<{ data: RenewalRecord[]; total: number; page: number; limit: number; totalPages: number } | RenewalRecord[]>(`/renewals${qs}`);
  },

  getRenewalById: async (id: string) => {
    return api.get<RenewalRecord>(`/renewals/${id}`);
  },

  // Hủy yêu cầu (khách hàng)
  cancelRenewal: async (id: string) => {
    return api.patch<RenewalRecord>(`/renewals/${id}/cancel`);
  },

  // Phê duyệt gia hạn (Staff / Manager)
  approveRenewal: async (id: string, dto?: { notes?: string }) => {
    return api.patch<RenewalRecord>(`/renewals/${id}/approve`, dto || {});
  },

  // Từ chối gia hạn (Staff / Manager)
  rejectRenewal: async (id: string, dto: { reason?: string }) => {
    return api.patch<RenewalRecord>(`/renewals/${id}/reject`, dto);
  },

  // Kích hoạt quét quá hạn tức thì (Cron Job Trigger)
  scanOverdue: async () => {
    return api.post<{ processed: number; newlyOverdue: number; lockedUnits: number; message: string }>('/renewals/overdue/scan');
  },

  // Danh sách hợp đồng quá hạn
  getOverdueRecords: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    facilityId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.status) q.append('status', params.status);
    if (params?.facilityId) q.append('facilityId', params.facilityId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<{ data: OverdueRecord[]; total: number; page: number; limit: number; totalPages: number } | OverdueRecord[]>(`/renewals/overdue/records${qs}`);
  },

  // Giải quyết quá hạn (đã thu phí phạt / khôi phục quyền truy cập PIN)
  resolveOverdue: async (id: string, dto?: { notes?: string; extendMonths?: number }) => {
    return api.patch<OverdueRecord>(`/renewals/overdue/records/${id}/resolve`, dto || {});
  },

  // Miễn giảm phí phạt quá hạn (Manager / Admin)
  waiveOverdue: async (id: string, notes?: string) => {
    return api.patch<OverdueRecord>(`/renewals/overdue/records/${id}/waive`, { notes });
  },

  // Manager yêu cầu Staff chi nhánh thanh lý kho quá hạn (khóa PIN khách ngay)
  requestLiquidation: async (id: string, notes?: string) => {
    return api.post<{ message: string; overdueRecord: OverdueRecord }>(
      `/renewals/overdue/records/${id}/request-liquidation`,
      { notes },
    );
  },

  // Danh sách đơn thanh lý kho quá hạn cho Staff / Manager chi nhánh
  getLiquidations: async (params?: { facilityId?: string }) => {
    const q = new URLSearchParams();
    if (params?.facilityId) q.append('facilityId', params.facilityId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<OverdueRecord[]>(`/renewals/overdue/liquidations${qs}`);
  },

  // Staff hoàn tất quy trình thanh lý kho quá hạn
  completeLiquidation: async (
    id: string,
    dto: {
      condition: string;
      notes?: string;
      photos?: string[];
      newAccessCode: string;
      unitCondition?: 'AVAILABLE' | 'UNDER_MAINTENANCE';
    },
  ) => {
    return api.post<{
      message: string;
      overdueRecord: OverdueRecord;
      forfeitedDeposit: number;
      overdueFine: number;
      remainingDebt: number;
    }>(`/renewals/overdue/records/${id}/complete-liquidation`, dto);
  },
};
