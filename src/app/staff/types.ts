export interface CheckInAppointment {
  id: string; // Mã hiển thị (ví dụ "RSV-20260918-A1B2C3" hoặc "SS-BK-2026-8910")
  rawId?: number; // ID số nguyên trong database Backend (dùng gọi API /handovers/check-in)
  facilityId?: number;
  facilityName?: string;
  facilityAddress?: string;
  customerName: string;
  phone: string;
  email: string;
  idCard: string;
  slotTime: string; // "08:30 SA", "09:00 SA", v.v.
  dateDisplay?: string; // "Hôm nay", "Ngày mai (05/10)", hoặc "05/10/2026"
  appointmentDateRaw?: string; // ISO date string from BE
  timeCategory: 'morning' | 'afternoon';
  unitType: string;
  unitTypeId?: number;
  unitSize: string;
  unitId?: number; // ID ô kho vật lý trong database
  assignedUnit: string;
  preferredFloor: string;
  status: 'pending' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  depositStatus: 'paid' | 'unpaid';
  depositAmount: string;
  monthlyRent: string;
  startDate: string;
  durationMonths: number;
  purpose: string;
  specialNotes?: string;
  accessPin?: string;
  rfidCard?: string;
  contractCode?: string; // Mã hợp đồng sinh ra từ Backend (CON-...)
  completedAt?: string;
}

export interface AvailableUnit {
  id: string;
  rawId?: number;
  code: string;
  type: string;
  size: string;
  floor: string;
  zone: string;
  features: string;
  status: 'vacant' | 'occupied' | 'maintenance';
}

export interface StaffUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  facilityId?: number;
  facilityName?: string;
  assignedFacility?: {
    id: number;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export type StaffTab = 'queue' | 'dashboard' | 'checkout' | 'facility' | 'support' | 'settings' | 'profile' | 'unit_types';
export type FlowStep = 'queue' | 'handover' | 'success';
