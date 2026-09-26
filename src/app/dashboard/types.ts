export interface GuestPass {
  id: string;
  guestName: string;
  pin: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expired';
  purpose: string;
}

export interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: string;
  period: string;
  method: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface SupportTicket {
  id: string;
  title: string;
  unitCode: string;
  category: string;
  createdAt: string;
  status: 'open' | 'in_progress' | 'resolved';
  lastReply: string;
}

export interface CustomerUnit {
  id: string;
  unitNumber: string; // ví dụ: "Ô A-104"
  unitType: string;
  size: string; // ví dụ: "10x10 Có điều hòa nhiệt độ"
  dimensions: string; // "3m x 3m x 2.8m"
  area: string; // "9.0 m²"
  facilityName: string;
  facilityAddress: string;
  zone: string; // "Khu A"
  floor: string; // "Tầng 1"
  status: 'active' | 'expiring' | 'overdue';
  statusLabel: string;
  daysRemaining: number;
  nextBillingDate: string;
  monthlyRent: string;
  monthlyRentNum: number;
  contractStartDate: string;
  contractEndDate: string;
  contractId: string;
  totalPaid: string;
  currentBalance: string; // "0 đ" hoặc "2.500.000 đ" nếu nợ
  temperature: string;
  humidity: string;
  mainPin: string;
  rfidCard: string;
  isClimateControlled: boolean;
  guestPasses: GuestPass[];
  paymentHistory: PaymentRecord[];
  supportTickets: SupportTicket[];
  facilityId?: number;
  rawContractId?: number;
  rawContractItemId?: number;
  rawUnitId?: number;
}

export interface CustomerUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  idCard?: string;
}

export type CustomerTab = 'my_units' | 'billing' | 'access' | 'documents' | 'support' | 'profile';
