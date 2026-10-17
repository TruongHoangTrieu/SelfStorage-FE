'use client';

import { CheckInAppointment } from '../types';

export interface ApprovalRequestRecord {
  reservationId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  reason: string;
  facilityName?: string;
  facilityId?: string | number;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  expiryIso?: string;
}

const STORAGE_KEY = 'selfstorage_manager_approval_requests';
const EVENT_NAME = 'selfstorage:approval-request-updated';

export const approvalRequestsService = {
  getAll(): Record<string, ApprovalRequestRecord> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  get(reservationId: string): ApprovalRequestRecord | null {
    const all = this.getAll();
    return all[reservationId] || null;
  },

  submitRequest(
    appointment: CheckInAppointment,
    requestedBy: string,
    reason: string
  ): ApprovalRequestRecord {
    const all = this.getAll();
    const record: ApprovalRequestRecord = {
      reservationId: appointment.id,
      status: 'pending',
      requestedBy,
      requestedAt: new Date().toISOString(),
      reason,
      facilityName: appointment.facilityName || 'Trụ Sở Cơ Sở',
      facilityId: appointment.facilityId,
    };
    all[appointment.id] = record;
    this.saveAll(all);
    return record;
  },

  approveRequest(
    appointmentId: string,
    managerName: string,
    reviewNotes: string,
    expiryIso: string
  ): ApprovalRequestRecord | null {
    const all = this.getAll();
    const existing = all[appointmentId] || {
      reservationId: appointmentId,
      status: 'pending' as const,
      requestedBy: 'Nhân viên lễ tân',
      requestedAt: new Date().toISOString(),
      reason: 'Yêu cầu mở lại',
    };

    const updated: ApprovalRequestRecord = {
      ...existing,
      status: 'approved',
      reviewedBy: managerName,
      reviewedAt: new Date().toISOString(),
      reviewNotes,
      expiryIso,
    };

    all[appointmentId] = updated;
    this.saveAll(all);
    return updated;
  },

  rejectRequest(
    appointmentId: string,
    managerName: string,
    rejectNotes: string
  ): ApprovalRequestRecord | null {
    const all = this.getAll();
    const existing = all[appointmentId] || {
      reservationId: appointmentId,
      status: 'pending' as const,
      requestedBy: 'Nhân viên lễ tân',
      requestedAt: new Date().toISOString(),
      reason: 'Yêu cầu mở lại',
    };

    const updated: ApprovalRequestRecord = {
      ...existing,
      status: 'rejected',
      reviewedBy: managerName,
      reviewedAt: new Date().toISOString(),
      reviewNotes: rejectNotes,
    };

    all[appointmentId] = updated;
    this.saveAll(all);
    return updated;
  },

  attachToAppointment(apt: CheckInAppointment): CheckInAppointment {
    const record = this.get(apt.id);
    if (!record) return apt;

    if (record.status === 'pending') {
      return {
        ...apt,
        managerApprovalStatus: 'pending',
        managerApprovalRequestedBy: record.requestedBy,
        managerApprovalRequestedAt: record.requestedAt,
        managerApprovalRequestReason: record.reason,
        managerApprovalFacilityName: record.facilityName,
      };
    }

    if (record.status === 'approved') {
      const now = new Date();
      const expiry = record.expiryIso ? new Date(record.expiryIso) : null;
      const isExpired = expiry ? now > expiry : false;

      return {
        ...apt,
        managerApprovalStatus: 'approved',
        managerApprovedAt: record.reviewedAt,
        managerApprovedExpiry: record.expiryIso,
        managerApproverName: record.reviewedBy,
        managerApprovalReason: record.reviewNotes,
        isApprovalExpired: isExpired,
      };
    }

    if (record.status === 'rejected') {
      return {
        ...apt,
        managerApprovalStatus: 'rejected',
        managerApprovalRejectReason: record.reviewNotes,
        managerApproverName: record.reviewedBy,
      };
    }

    return apt;
  },

  saveAll(all: Record<string, ApprovalRequestRecord>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch {
      // Storage full or disabled
    }
  },

  subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) callback();
    };
    const handleCustom = () => callback();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_NAME, handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_NAME, handleCustom);
    };
  },
};
