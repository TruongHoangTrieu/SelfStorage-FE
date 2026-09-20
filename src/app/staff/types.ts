export interface CheckInAppointment {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  idCard: string;
  slotTime: string; // "08:30 SA", "09:00 SA", v.v.
  timeCategory: 'morning' | 'afternoon';
  unitType: string;
  unitSize: string;
  assignedUnit: string;
  preferredFloor: string;
  status: 'pending' | 'arrived' | 'in_progress' | 'completed';
  depositStatus: 'paid' | 'unpaid';
  depositAmount: string;
  monthlyRent: string;
  startDate: string;
  durationMonths: number;
  purpose: string;
  specialNotes?: string;
  accessPin?: string;
  rfidCard?: string;
  completedAt?: string;
}

export interface AvailableUnit {
  id: string;
  code: string;
  type: string;
  size: string;
  floor: string;
  zone: string;
  features: string;
  status: 'vacant' | 'occupied' | 'maintenance';
}

export type StaffTab = 'queue' | 'dashboard' | 'checkout' | 'facility' | 'support' | 'settings';
export type FlowStep = 'queue' | 'handover' | 'success';
