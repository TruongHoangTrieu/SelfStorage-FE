import { api } from '../api';

export interface StorageUnitLayoutItem {
  id: string;
  unitNumber: string;
  floor: number | string;
  zone?: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE';
  unitType?: {
    id: string;
    name: string;
    code: string;
    size: number;
    sizeUnit: string;
  };
  currentContract?: {
    id: string;
    status: string;
    customer?: {
      fullName: string;
      phone?: string;
    };
  };
}

export interface StorageFloorLayout {
  floor: string | number;
  total: number;
  occupied: number;
  available: number;
  reserved: number;
  maintenance: number;
  units: StorageUnitLayoutItem[];
}

export interface StorageLayoutResponse {
  facility: {
    id: string;
    name: string;
    code: string;
    address: string;
    totalFloors?: number;
  };
  totalUnits: number;
  occupancyRate: number;
  statusCount: {
    AVAILABLE: number;
    RESERVED: number;
    OCCUPIED: number;
    UNDER_MAINTENANCE: number;
    OUT_OF_SERVICE: number;
  };
  floors: StorageFloorLayout[];
}

export interface FacilityStaffAssignment {
  id: string;
  facilityId: string;
  userId: string;
  roleInFacility: string;
  shift?: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
  };
}

export interface FacilityItem {
  id: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  operatingHours?: string;
  isActive: boolean;
  totalFloors?: number;
  storageUnitsCount?: number;
}

export const facilitiesApi = {
  // Lấy danh sách tất cả cơ sở
  getFacilities: async () => {
    return api.get<FacilityItem[]>('/facilities');
  },

  getFacilityById: async (id: string) => {
    return api.get<FacilityItem>(`/facilities/${id}`);
  },

  // Flow 5: Lấy sơ đồ mặt bằng kho 24/7 theo tầng
  getStorageLayout: async (facilityId: string) => {
    return api.get<StorageLayoutResponse>(`/facilities/${facilityId}/storage-layout`);
  },

  // Flow 5: Danh sách nhân viên tại cơ sở
  getStaffByFacility: async (facilityId: string, includeEnded = false) => {
    return api.get<FacilityStaffAssignment[]>(`/facilities/${facilityId}/staff?includeEnded=${includeEnded}`);
  },

  // Flow 5: Phân công nhân viên vào cơ sở
  assignStaff: async (
    facilityId: string,
    dto: {
      userId: string;
      roleInFacility?: string;
      shift?: string;
      startDate?: string;
      notes?: string;
    }
  ) => {
    return api.post<FacilityStaffAssignment>(`/facilities/${facilityId}/staff`, dto);
  },

  // Flow 5: Kết thúc phân công nhân viên
  endStaffAssignment: async (
    assignmentId: string,
    dto?: { endDate?: string; reason?: string }
  ) => {
    return api.patch<FacilityStaffAssignment>(`/facilities/staff-assignments/${assignmentId}/end`, dto || {});
  },

  // Flow 5: Hỗ trợ tại cơ sở
  getFacilitySupportRequests: async (
    facilityId: string,
    params?: { status?: string; priority?: string }
  ) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.priority) q.append('priority', params.priority);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<any[]>(`/facilities/${facilityId}/support-requests${qs}`);
  },
};
