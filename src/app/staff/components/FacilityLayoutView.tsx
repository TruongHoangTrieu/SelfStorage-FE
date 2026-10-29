'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Layers,
  Search,
  RefreshCw,
  Building2,
  Shield,
  User,
  UserCheck,
  UserPlus,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  UserX,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Trash2,
  Eye,
  Star,
  Info,
  ShieldCheck,
  Loader2,
  Boxes,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  facilitiesApi,
  FacilityItem,
  StorageLayoutResponse,
  StorageFloorLayout,
  StorageUnitLayoutItem,
} from '@/lib/api/facilities';
import { handoversApi } from '@/lib/api/handovers';

interface FacilityLayoutViewProps {
  facilityId?: string | number;
  userRole?: string;
  initialSubTab?: 'layout' | 'staff' | 'photos';
}

const STAFF_CANDIDATES = [
  { id: '6ac4e8ad2edd770fa05d7267', name: 'Nguyễn Văn Staff (Trụ sở Thủ Đức)', email: 'staff@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8ae2edd770fa05d726a', name: 'Trần Văn Thủ Đức (NV Võ Nguyên Giáp)', email: 'staff.thuduc@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8ad2edd770fa05d7266', name: 'Phạm Thị Quản Lý (Quản lý Thủ Đức)', email: 'manager@selfstorage.vn', role: 'FACILITY_MANAGER' },
  { id: '6ac4e8ae2edd770fa05d726b', name: 'Lê Hoàng Nam (NV Chi nhánh Quận 1)', email: 'staff.quan1@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8ae2edd770fa05d726c', name: 'Đặng Quốc Bảo (NV Chi nhánh Quận 7)', email: 'staff.quan7@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8af2edd770fa05d726d', name: 'Vũ Minh Anh (NV Chi nhánh Bình Thạnh)', email: 'staff.binhthanh@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8af2edd770fa05d726e', name: 'Huỳnh Gia Huy (NV Chi nhánh Quận 6)', email: 'staff.quan6@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8af2edd770fa05d726f', name: 'Ngô Tấn Tài (NV Chi nhánh An Phú)', email: 'staff.anphu@selfstorage.vn', role: 'FACILITY_STAFF' },
];

const POSITION_OPTIONS = [
  'Nhân viên vận hành kho',
  'Quản lý cơ sở kho',
  'Nhân viên an ninh & Giám sát 24/7',
  'Kỹ thuật viên bảo trì khóa & hạ tầng',
  'Lễ tân tiếp đón & Bàn giao kho',
];

export const UNIT_SLOT_CONFIGS = [
  {
    slot: 1,
    type: 'Kho nhỏ',
    area: '4.9 m²',
    volume: '12.5 m³',
    title: 'Kho nhỏ 4.9 m² (12.5 m³)',
    sub: 'Ô kho mini cá nhân, hành lý & vật dụng nhỏ',
    fallback: 'https://res.cloudinary.com/micb9okr/image/upload/v1792946232/selfstorage/storage_units/unit_sto1.png',
  },
  {
    slot: 2,
    type: 'Kho trung bình',
    area: '9.0 m²',
    volume: '22.5 m³',
    title: 'Kho trung bình 9.0 m² (22.5 m³)',
    sub: 'Ô kho gia đình, chuyển nhà & đồ nội thất',
    fallback: 'https://res.cloudinary.com/micb9okr/image/upload/v1792946236/selfstorage/storage_units/unit_sto2.png',
  },
  {
    slot: 3,
    type: 'Kho lớn',
    area: '14.5 m²',
    volume: '36.3 m³',
    title: 'Kho lớn 14.5 m² (36.3 m³)',
    sub: 'Kho doanh nghiệp, lưu kho hàng & thiết bị',
    fallback: 'https://res.cloudinary.com/micb9okr/image/upload/v1792946240/selfstorage/storage_units/unit_sto3.png',
  },
];

export default function FacilityLayoutView({ facilityId, userRole, initialSubTab = 'layout' }: FacilityLayoutViewProps) {
  // Check permission: Manager or Admin gets staff assignment tab, Staff only gets floor plan
  const storedUser = typeof window !== 'undefined' ? handoversApi.getStoredUser() : null;
  const effectiveRole = userRole || storedUser?.role || '';
  const isManager = ['FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN'].includes(
    String(effectiveRole).toUpperCase()
  );
  const isGlobalManager = ['BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN'].includes(
    String(effectiveRole).toUpperCase()
  );

  const [activeSubTab, setActiveSubTab] = useState<'layout' | 'staff' | 'photos'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [facilitiesList, setFacilitiesList] = useState<FacilityItem[]>([]);
  const [activeFacilityId, setActiveFacilityId] = useState<string>(String(facilityId || ''));
  const [layout, setLayout] = useState<StorageLayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string | number>(1);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnitLayoutItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Staff management state (only for Manager)
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(POSITION_OPTIONS[0]);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Photos management state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [setAsPrimary, setSetAsPrimary] = useState(true);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);

  // Dedicated state for 3 storage unit gallery slots (1: Kho nhỏ, 2: Kho trung bình, 3: Kho lớn)
  const [unitSlotFiles, setUnitSlotFiles] = useState<{ [slot: number]: File | null }>({});
  const [unitSlotPreviews, setUnitSlotPreviews] = useState<{ [slot: number]: string | null }>({});
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [resettingSlot, setResettingSlot] = useState<number | null>(null);

  // Facility & Scope resolution
  const currentFacility = useMemo(() => {
    return facilitiesList.find((f) => String(f.id) === String(activeFacilityId)) || facilitiesList[0] || null;
  }, [facilitiesList, activeFacilityId]);

  const managerAssignedFacilityId = String(facilityId || storedUser?.facilityId || '');

  // Is current user allowed to edit photos / staff of the active facility?
  const canEditCurrentFacility = isGlobalManager || (
    Boolean(managerAssignedFacilityId) && (
      managerAssignedFacilityId === String(activeFacilityId) ||
      Boolean(currentFacility && currentFacility.code === managerAssignedFacilityId)
    )
  );

  // Load facilities list once on mount
  useEffect(() => {
    let isMounted = true;
    facilitiesApi.getFacilities()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : ((res as any)?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          setFacilitiesList(list);
          if (!activeFacilityId || activeFacilityId === '1' || !list.some((f) => String(f.id) === String(activeFacilityId))) {
            const matched = facilityId ? list.find((f) => String(f.id) === String(facilityId) || f.code === String(facilityId)) : null;
            const targetId = String(matched ? matched.id : list[0].id);
            setActiveFacilityId(targetId);
            loadLayout(targetId);
            if (isManager) loadStaff(targetId);
            return;
          }
        }
        if (activeFacilityId) {
          loadLayout(activeFacilityId);
          if (isManager) loadStaff(activeFacilityId);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch facilities list:', err);
        loadLayout(activeFacilityId || '1');
        if (isManager) loadStaff(activeFacilityId || '1');
      });

    return () => {
      isMounted = false;
    };
  }, [facilityId, isManager]);

  const loadLayout = async (targetId?: string) => {
    const fid = targetId || activeFacilityId || '1';
    setLoading(true);
    try {
      const data = await facilitiesApi.getStorageLayout(String(fid));
      if (data && (data.floors || (data as any).summary)) {
        const rawSummary = (data as any).summary || (data as any).statusCount || {};
        const totalUnits = (data as any).totalUnits ?? rawSummary.totalUnits ?? 0;
        const rawOcc = (data as any).occupancyRate ?? rawSummary.occupancyRate ?? 0;
        const occupancyRate =
          typeof rawOcc === 'string'
            ? parseFloat(rawOcc.replace('%', '')) || 0
            : Number(rawOcc) || 0;

        const statusCount = {
          AVAILABLE: rawSummary.AVAILABLE ?? (data as any).statusCount?.AVAILABLE ?? 0,
          RESERVED: rawSummary.RESERVED ?? (data as any).statusCount?.RESERVED ?? 0,
          OCCUPIED: rawSummary.OCCUPIED ?? (data as any).statusCount?.OCCUPIED ?? 0,
          UNDER_MAINTENANCE: rawSummary.UNDER_MAINTENANCE ?? (data as any).statusCount?.UNDER_MAINTENANCE ?? 0,
          OUT_OF_SERVICE: rawSummary.OUT_OF_SERVICE ?? (data as any).statusCount?.OUT_OF_SERVICE ?? 0,
        };

        const rawFloors: StorageFloorLayout[] = ((data as any).floors || []).map((f: any) => ({
          floor: f.floor,
          total: f.total ?? f.unitCount ?? (f.units?.length || 0),
          occupied: f.occupied ?? (f.units?.filter((u: any) => u.status === 'OCCUPIED').length || 0),
          available: f.available ?? (f.units?.filter((u: any) => u.status === 'AVAILABLE').length || 0),
          reserved: f.reserved ?? (f.units?.filter((u: any) => u.status === 'RESERVED').length || 0),
          maintenance: f.maintenance ?? (f.units?.filter((u: any) => u.status === 'UNDER_MAINTENANCE').length || 0),
          units: f.units || [],
        }));

        // Gộp các tầng trùng tên (ví dụ: 1 và "Tầng 1", 2 và "Tầng 2") thành 1 tầng duy nhất
        const mergedFloorMap = new Map<string, StorageFloorLayout>();
        rawFloors.forEach((f) => {
          const cleanKey = String(f.floor)
            .replace(/^tầng\s*/i, '')
            .trim();
          const normFloor = /^\d+$/.test(cleanKey) ? Number(cleanKey) : cleanKey;
          const mapKey = String(normFloor).toLowerCase();

          if (mergedFloorMap.has(mapKey)) {
            const existing = mergedFloorMap.get(mapKey)!;
            const existingUnitIds = new Set(existing.units.map((u) => String(u.id || u.unitNumber)));
            const newUnits = (f.units || []).filter((u) => !existingUnitIds.has(String(u.id || u.unitNumber)));
            const combinedUnits = [...existing.units, ...newUnits];
            existing.units = combinedUnits;
            existing.total = combinedUnits.length || existing.total + f.total;
            existing.occupied = combinedUnits.filter((u) => u.status === 'OCCUPIED').length;
            existing.available = combinedUnits.filter((u) => u.status === 'AVAILABLE').length;
            existing.reserved = combinedUnits.filter((u) => u.status === 'RESERVED').length;
            existing.maintenance = combinedUnits.filter((u) => u.status === 'UNDER_MAINTENANCE').length;
          } else {
            mergedFloorMap.set(mapKey, {
              ...f,
              floor: normFloor,
            });
          }
        });

        const floors: StorageFloorLayout[] = Array.from(mergedFloorMap.values()).sort((a, b) =>
          String(a.floor).localeCompare(String(b.floor), undefined, { numeric: true })
        );

        setLayout({
          facility: data.facility || {
            id: String(fid),
            name: 'Kho Tự Quản Thông Minh 24/7',
            code: 'SS-FAC',
            address: 'Hệ thống kho tự quản thông minh',
          },
          totalUnits,
          occupancyRate,
          statusCount,
          floors,
        });

        if (floors.length > 0) {
          setSelectedFloor(floors[0].floor);
        }
      } else {
        throw new Error('No layout data received');
      }
    } catch (e) {
      console.warn('Could not load storage layout from API, using fallback data:', e);
      const mockFloors: StorageFloorLayout[] = [
        {
          floor: 1,
          total: 20,
          occupied: 14,
          available: 4,
          reserved: 1,
          maintenance: 1,
          units: Array.from({ length: 20 }).map((_, i) => {
            const num = 101 + i;
            const code = `A-${num}`;
            let st: StorageUnitLayoutItem['status'] = 'OCCUPIED';
            if (i === 3 || i === 8 || i === 15 || i === 18) st = 'AVAILABLE';
            else if (i === 6) st = 'RESERVED';
            else if (i === 12) st = 'UNDER_MAINTENANCE';

            return {
              id: `u-${num}`,
              unitNumber: code,
              floor: 1,
              zone: i < 10 ? 'Zone A' : 'Zone B',
              status: st,
              unitType: {
                id: 'ut-1',
                name: i % 2 === 0 ? 'Kho Tiêu Chuẩn 5m²' : 'Kho Điều Hòa 9m²',
                code: 'STD-5M',
                size: i % 2 === 0 ? 5 : 9,
                sizeUnit: 'm²',
              },
              currentContract: st === 'OCCUPIED' ? {
                id: `CON-${num}`,
                status: 'ACTIVE',
                customer: { fullName: `Khách hàng ${i + 1}`, phone: '0908123456' },
              } : undefined,
            };
          }),
        },
        {
          floor: 2,
          total: 16,
          occupied: 11,
          available: 3,
          reserved: 2,
          maintenance: 0,
          units: Array.from({ length: 16 }).map((_, i) => {
            const num = 201 + i;
            const code = `B-${num}`;
            let st: StorageUnitLayoutItem['status'] = 'OCCUPIED';
            if (i === 2 || i === 7 || i === 14) st = 'AVAILABLE';
            else if (i === 4 || i === 10) st = 'RESERVED';

            return {
              id: `u-${num}`,
              unitNumber: code,
              floor: 2,
              zone: 'Zone C',
              status: st,
              unitType: {
                id: 'ut-2',
                name: 'Kho Mini 3m²',
                code: 'MINI-3M',
                size: 3,
                sizeUnit: 'm²',
              },
              currentContract: st === 'OCCUPIED' ? {
                id: `CON-${num}`,
                status: 'ACTIVE',
                customer: { fullName: `Doanh nghiệp ${i + 1}`, phone: '0912345678' },
              } : undefined,
            };
          }),
        },
      ];

      setLayout({
        facility: {
          id: String(fid),
          name: 'Kho Tự Quản Trụ Sở Chính Võ Nguyên Giáp',
          code: 'SS-HCM-HQ',
          address: 'Xa Lộ Hà Nội / Võ Nguyên Giáp, TP. Thủ Đức, TP. HCM',
          totalFloors: 2,
        },
        totalUnits: 36,
        occupancyRate: 69.4,
        statusCount: {
          AVAILABLE: 7,
          RESERVED: 3,
          OCCUPIED: 25,
          UNDER_MAINTENANCE: 1,
          OUT_OF_SERVICE: 0,
        },
        floors: mockFloors,
      });
      setSelectedFloor(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async (targetId?: string) => {
    const fid = targetId || activeFacilityId;
    if (!fid) return;
    setLoadingStaff(true);
    try {
      const res = await facilitiesApi.getStaffByFacility(String(fid), true);
      setStaffList(res.staff || []);
    } catch (err) {
      console.warn('Could not load staff for facility:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleFacilityChange = (newFacilityId: string) => {
    setActiveFacilityId(newFacilityId);
    setSelectedUnit(null);
    loadLayout(newFacilityId);
    if (isManager) loadStaff(newFacilityId);
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      toast.error('Vui lòng chọn nhân viên cần phân công');
      return;
    }
    setIsSubmittingAssign(true);
    try {
      await facilitiesApi.assignStaff(activeFacilityId, {
        userId: selectedCandidateId,
        position: selectedPosition,
      });
      toast.success('Phân công nhân viên vào cơ sở thành công!');
      setIsAssignModalOpen(false);
      setSelectedCandidateId('');
      loadStaff(activeFacilityId);
    } catch (err: any) {
      toast.error(err.message || 'Không thể phân công nhân viên');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleEndAssignment = async (assignmentId: string, staffName: string) => {
    if (!confirm(`Bạn có chắc muốn kết thúc phân công của nhân viên "${staffName}" tại cơ sở này?`)) {
      return;
    }
    try {
      await facilitiesApi.endStaffAssignment(assignmentId);
      toast.success(`Đã kết thúc phân công nhân viên ${staffName}`);
      loadStaff(activeFacilityId);
    } catch (err: any) {
      toast.error(err.message || 'Không thể kết thúc phân công');
    }
  };

  // Photo handlers
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng tệp không được vượt quá 10MB');
      return;
    }

    setSelectedPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);
  };

  const handleClearSelectedPhoto = () => {
    setSelectedPhotoFile(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhotoFile || !activeFacilityId) {
      toast.error('Vui lòng chọn hình ảnh trước khi tải lên');
      return;
    }

    if (!canEditCurrentFacility) {
      toast.error('Bạn chỉ có quyền cập nhật hình ảnh của chi nhánh bạn được phân công phụ trách!');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await facilitiesApi.uploadFacilityImage(
        activeFacilityId,
        selectedPhotoFile,
        setAsPrimary,
      );
      toast.success(res.message || 'Tải ảnh lên Cloudinary và cập nhật cơ sở thành công!');
      handleClearSelectedPhoto();

      // Tải lại danh sách cơ sở để cập nhật hình ảnh mới ngay lập tức
      const freshList = await facilitiesApi.getFacilities();
      const list = Array.isArray(freshList) ? freshList : ((freshList as any)?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setFacilitiesList(list);
      }
    } catch (err: any) {
      toast.error(err.message || 'Tải ảnh lên Cloudinary thất bại');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSetPrimaryPhoto = async (targetUrl: string) => {
    if (!activeFacilityId || !currentFacility) return;
    if (!canEditCurrentFacility) {
      toast.error('Bạn chỉ có quyền cập nhật hình ảnh của chi nhánh bạn được phân công phụ trách!');
      return;
    }

    setIsUpdatingImages(true);
    try {
      const curImages = Array.isArray(currentFacility.images) ? [...currentFacility.images] : [];
      const remaining = curImages.filter((u) => u !== targetUrl);
      const updated = [targetUrl, ...remaining];
      await facilitiesApi.updateFacilityImages(activeFacilityId, updated);
      toast.success('Đã đặt làm ảnh đại diện chính của cơ sở!');

      const freshList = await facilitiesApi.getFacilities();
      const list = Array.isArray(freshList) ? freshList : ((freshList as any)?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setFacilitiesList(list);
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật ảnh chính');
    } finally {
      setIsUpdatingImages(false);
    }
  };

  const handleDeletePhoto = async (targetUrl: string) => {
    if (!activeFacilityId || !currentFacility) return;
    if (!canEditCurrentFacility) {
      toast.error('Bạn chỉ có quyền cập nhật hình ảnh của chi nhánh bạn được phân công phụ trách!');
      return;
    }

    const curImages = Array.isArray(currentFacility.images) ? [...currentFacility.images] : [];
    if (curImages.length <= 1) {
      toast.error('Cơ sở kho cần duy trì tối thiểu 1 hình ảnh đại diện!');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn gỡ bỏ hình ảnh này khỏi cơ sở kho?')) {
      return;
    }

    setIsUpdatingImages(true);
    try {
      const updated = curImages.filter((u) => u !== targetUrl);
      await facilitiesApi.updateFacilityImages(activeFacilityId, updated);
      toast.success('Đã gỡ bỏ hình ảnh khỏi cơ sở kho');

      const freshList = await facilitiesApi.getFacilities();
      const list = Array.isArray(freshList) ? freshList : ((freshList as any)?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setFacilitiesList(list);
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể gỡ bỏ ảnh');
    } finally {
      setIsUpdatingImages(false);
    }
  };

  const handleUnitSlotFileChange = (slot: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng tệp không được vượt quá 10MB');
      return;
    }

    setUnitSlotFiles((prev) => ({ ...prev, [slot]: file }));
    const objectUrl = URL.createObjectURL(file);
    setUnitSlotPreviews((prev) => ({ ...prev, [slot]: objectUrl }));
  };

  const handleClearUnitSlotFile = (slot: number) => {
    const prevUrl = unitSlotPreviews[slot];
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    setUnitSlotPreviews((prev) => ({ ...prev, [slot]: null }));
    setUnitSlotFiles((prev) => ({ ...prev, [slot]: null }));
  };

  const handleUploadUnitSlotPhoto = async (slot: number, title: string) => {
    const file = unitSlotFiles[slot];
    if (!file || !activeFacilityId) {
      toast.error('Vui lòng chọn hình ảnh trước khi tải lên');
      return;
    }

    if (!canEditCurrentFacility) {
      toast.error('Bạn chỉ có quyền cập nhật hình ảnh của chi nhánh bạn được phân công phụ trách!');
      return;
    }

    setUploadingSlot(slot);
    try {
      const res = await facilitiesApi.uploadFacilityImage(
        activeFacilityId,
        file,
        false,
        slot,
      );
      toast.success(res.message || `Đã tải và cập nhật ảnh ${title} lên Cloudinary thành công!`);
      handleClearUnitSlotFile(slot);

      const freshList = await facilitiesApi.getFacilities();
      const list = Array.isArray(freshList) ? freshList : ((freshList as any)?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setFacilitiesList(list);
      }
    } catch (err: any) {
      toast.error(err.message || `Tải ảnh ${title} lên Cloudinary thất bại`);
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleResetUnitSlotToDefault = async (slot: number, defaultUrl: string, title: string) => {
    if (!activeFacilityId || !currentFacility) return;
    if (!canEditCurrentFacility) {
      toast.error('Bạn chỉ có quyền cập nhật hình ảnh của chi nhánh bạn được phân công phụ trách!');
      return;
    }

    setResettingSlot(slot);
    try {
      const curImages = Array.isArray(currentFacility.images) ? [...currentFacility.images] : [];
      while (curImages.length <= slot) {
        curImages.push('');
      }
      curImages[slot] = defaultUrl;
      await facilitiesApi.updateFacilityImages(activeFacilityId, curImages);
      toast.success(`Đã khôi phục ảnh mặc định cho ${title}!`);

      const freshList = await facilitiesApi.getFacilities();
      const list = Array.isArray(freshList) ? freshList : ((freshList as any)?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        setFacilitiesList(list);
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể khôi phục ảnh');
    } finally {
      setResettingSlot(null);
    }
  };

  const activeFloorData = (layout?.floors || []).find((f) => String(f.floor) === String(selectedFloor));

  const filteredUnits = (activeFloorData?.units || []).filter((u) => {
    const matchSearch =
      u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.unitType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.currentContract?.customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === 'ALL') return true;
    return u.status === statusFilter;
  });

  const getStatusColor = (status: StorageUnitLayoutItem['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100/70';
      case 'OCCUPIED':
        return 'bg-slate-100 border-slate-300 text-slate-800 hover:border-slate-500 hover:bg-slate-200/60';
      case 'RESERVED':
        return 'bg-amber-50 border-amber-300 text-amber-800 hover:border-amber-500 hover:bg-amber-100/70';
      case 'UNDER_MAINTENANCE':
        return 'bg-rose-50 border-rose-300 text-rose-800 hover:border-rose-500 hover:bg-rose-100/70';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getStatusBadge = (status: StorageUnitLayoutItem['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Trống</span>;
      case 'OCCUPIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">Đang thuê</span>;
      case 'RESERVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Đã đặt</span>;
      case 'UNDER_MAINTENANCE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Bảo trì</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto">
      {/* Top Banner & KPI Metrics (Matching /staff proportions & padding) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Sơ Đồ Mặt Bằng &amp; Ô Kho 24/7
                  </h2>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Status
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {layout?.facility?.name || 'Cơ sở Kho Tự Quản'} • {layout?.facility?.address || 'Địa chỉ đang tải'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            {/* Facility Selector: Global Manager can choose any branch; Branch Manager is locked to their branch */}
            {isGlobalManager ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-1.5 shadow-2xs">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Cơ sở:</span>
                <select
                  value={activeFacilityId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setActiveFacilityId(nextId);
                    loadLayout(nextId);
                    if (isManager) loadStaff(nextId);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  {facilitiesList.map((fac) => (
                    <option key={String(fac.id)} value={String(fac.id)}>
                      {fac.name} ({fac.code})
                    </option>
                  ))}
                </select>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 hidden md:inline">
                  Toàn Chuỗi
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl px-3 py-2 text-xs font-bold text-indigo-950 shadow-2xs">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Chi nhánh: {currentFacility?.name || 'Được phân công'}</span>
                <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                loadLayout(activeFacilityId);
                if (isManager) loadStaff(activeFacilityId);
              }}
              disabled={loading || (isManager && loadingStaff)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Cập nhật</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row (Generous spacing & metrics typography matching /staff) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tổng Số Ô Kho</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">{layout?.totalUnits ?? 0} ô</div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 shadow-2xs">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Tỷ Lệ Lấp Đầy</span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-900 mt-1.5">
              {typeof layout?.occupancyRate === 'number' ? layout.occupancyRate.toFixed(1) : layout?.occupancyRate ?? 0}%
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Phòng Trống Khả Dụng</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1.5">
              {layout?.statusCount?.AVAILABLE ?? 0} ô
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Đã Giữ Chỗ (Reserved)</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1.5">
              {layout?.statusCount?.RESERVED ?? 0} ô
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-2xs">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Đang Bảo Trì</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-900 mt-1.5">
              {layout?.statusCount?.UNDER_MAINTENANCE ?? 0} ô
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: ONLY rendered for Manager & Admin */}
      {isManager && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('layout')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'layout'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Sơ Đồ Mặt Bằng & Ô Kho 24/7</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'staff'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Phân Công Nhân Sự Cơ Sở ({staffList.filter((s) => !s.endedAt).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('photos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'photos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span>Hình Ảnh Cơ Sở</span>
          </button>
        </div>
      )}

      {/* FLOOR PLAN GRID: Always visible for Staff, and visible for Manager when activeSubTab === 'layout' */}
      {(!isManager || activeSubTab === 'layout') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Floor Tabs & Unit Grid */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 flex flex-col">
            {/* Controls: Floor selector + Filters (Single horizontal row) */}
            <div className="flex flex-nowrap items-center justify-between gap-3 pb-4 border-b border-slate-100 overflow-x-auto">
              {/* Floor tabs - Clean single-line label without duplicated "Tầng" */}
              <div className="flex items-center gap-2 shrink-0">
                {(layout?.floors || []).map((f) => {
                  const rawFloor = String(f.floor).trim();
                  const floorLabel = rawFloor.toLowerCase().startsWith('tầng')
                    ? rawFloor
                    : `Tầng ${rawFloor}`;
                  return (
                    <button
                      key={String(f.floor)}
                      type="button"
                      onClick={() => setSelectedFloor(f.floor)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        String(selectedFloor) === String(f.floor)
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <span>{floorLabel}</span>
                      <span className="text-[11px] opacity-85">({f.total ?? f.units?.length ?? 0} ô)</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Filter & Search */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm mã ô / khách thuê..."
                    className="pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-44"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="AVAILABLE">Trống khả dụng</option>
                  <option value="OCCUPIED">Đang thuê</option>
                  <option value="RESERVED">Đã giữ chỗ</option>
                  <option value="UNDER_MAINTENANCE">Đang bảo trì</option>
                </select>
              </div>
            </div>

            {/* Unit Grid */}
            <div className="flex-1 py-5">
              {loading ? (
                <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                  <span>Đang tải sơ đồ mặt bằng kho 24/7...</span>
                </div>
              ) : filteredUnits.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Không tìm thấy ngăn kho phù hợp với điều kiện tìm kiếm
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredUnits.map((u) => {
                    const isSelected = selectedUnit?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUnit(u)}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between h-28 relative ${getStatusColor(
                          u.status
                        )} ${isSelected ? 'ring-2 ring-indigo-600 shadow-md scale-102' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-mono font-black text-sm tracking-tight">{u.unitNumber}</span>
                          {getStatusBadge(u.status)}
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold line-clamp-1">{u.unitType?.name || 'Kho Tiêu Chuẩn'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {u.unitType?.size} {u.unitType?.sizeUnit || 'm²'} • {u.zone || 'Khu A'}
                          </p>
                        </div>

                        {u.currentContract?.customer && (
                          <div className="text-[10px] text-slate-600 font-medium truncate pt-1 border-t border-slate-200/50 flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            <span>{u.currentContract.customer.fullName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right 4 Cols: Unit Detail Drawer */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 flex flex-col h-[640px] overflow-y-auto">
            {selectedUnit ? (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Thông Tin Chi Tiết Ô Kho
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Ô {selectedUnit.unitNumber}</h3>
                    <p className="text-xs text-slate-500">
                      {String(selectedUnit.floor).toLowerCase().startsWith('tầng') ? selectedUnit.floor : `Tầng ${selectedUnit.floor}`} • {selectedUnit.zone || 'Khu A'}
                    </p>
                  </div>
                  {getStatusBadge(selectedUnit.status)}
                </div>

                {/* Specs */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Loại ngăn kho:</span>
                    <span className="font-semibold text-slate-900">{selectedUnit.unitType?.name || 'Tiêu chuẩn'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Diện tích quy chuẩn:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedUnit.unitType?.size} {selectedUnit.unitType?.sizeUnit || 'm²'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Trạng thái khóa số:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Đã kết nối Smart Lock 24/7
                    </span>
                  </div>
                </div>

                {/* Tenant details if occupied */}
                {selectedUnit.currentContract ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Khách Hàng Đang Thuê
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedUnit.currentContract.customer?.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      SĐT: {selectedUnit.currentContract.customer?.phone || 'Chưa cập nhật'}
                    </p>
                    <p className="text-[11px] text-indigo-600 font-mono font-semibold">
                      Mã HĐ: #{selectedUnit.currentContract.id}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                    <strong>Ô kho đang trống:</strong> Sẵn sàng bàn giao cho các lượt khách đặt chỗ mới (Check-in Luồng 2).
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => toast.success(`Đã sao chép mã kho ${selectedUnit.unitNumber}`)}
                    className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Sao Chép Mã Ô Kho
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info(`Đang yêu cầu kiểm tra hiện trạng ngăn ${selectedUnit.unitNumber}`)}
                    className="w-full py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
                  >
                    Ghi Nhận Kiểm Tra Kỹ Thuật
                  </button>
                </div>
              </div>
            ) : (
              <div className="m-auto text-center p-8 text-slate-400 text-xs">
                Bấm vào bất kỳ ô kho nào trên sơ đồ mặt bằng để xem thông số chi tiết
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB PHÂN CÔNG NHÂN SỰ: Only for Manager & Admin when activeSubTab === 'staff' */}
      {isManager && activeSubTab === 'staff' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Quản Lý Phân Công &amp; Ca Trực Nhân Sự
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  Quyền Quản Lý
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Cơ sở: <strong className="text-slate-800">{layout?.facility?.name || 'Cơ sở hiện tại'}</strong> • Giám sát đội ngũ vận hành kho và kỹ thuật viên trực tại điểm.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Phân Công Nhân Viên Mới</span>
            </button>
          </div>

          {loadingStaff ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Đang tải danh sách nhân sự tại cơ sở...</span>
            </div>
          ) : staffList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Chưa có nhân sự nào được phân công tại cơ sở này. Bấm nút <strong>"+ Phân Công Nhân Viên Mới"</strong> để chỉ định nhân sự.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {staffList.map((assignment) => {
                const isEnded = Boolean(assignment.endedAt);
                const user = assignment.user || {};
                return (
                  <div
                    key={assignment.id}
                    className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                      isEnded
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200/80 hover:border-indigo-400 hover:shadow-xs shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-sm">
                            {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'NV'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {user.fullName || 'Nhân viên'}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {user.role?.name || user.role || 'STAFF'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isEnded
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isEnded ? 'Đã kết thúc' : 'Đang trực'}
                        </span>
                      </div>

                      {/* Info details */}
                      <div className="py-3 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {assignment.position || 'Nhân viên vận hành'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{user.email || 'Chưa có email'}</span>
                        </div>

                        {user.phone && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1 border-t border-slate-100">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Từ ngày: {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    {!isEnded && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleEndAssignment(assignment.id, user.fullName || 'nhân viên')}
                          className="w-full py-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Kết thúc phân công / Điều chuyển</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Phân công nhân viên mới */}
          {isAssignModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-slide-up-fade">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Phân Công Nhân Sự Cơ Sở
                      </h4>
                      <p className="text-xs text-slate-500">
                        {layout?.facility?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAssignStaff} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Chọn Nhân Viên:
                    </label>
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">-- Chọn nhân viên từ hệ thống --</option>
                      {STAFF_CANDIDATES.map((cand) => (
                        <option key={cand.id} value={cand.id}>
                          {cand.name} ({cand.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Vị Trí / Ca Trực Tại Cơ Sở:
                    </label>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-hidden cursor-pointer"
                    >
                      {POSITION_OPTIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Nhân viên được phân công sẽ có quyền tiếp nhận hồ sơ Check-in, xử lý gia hạn hợp đồng và phản hồi hỗ trợ khách hàng tại cơ sở này.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAssign}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingAssign ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <span>Xác Nhận Phân Công</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB QUẢN LÝ HÌNH ẢNH CƠ SỞ: Cho Manager, Admin và Giám đốc vận hành */}
      {isManager && activeSubTab === 'photos' && (
        <div className="space-y-6">
          {/* Header Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Quản Lý Hình Ảnh Cơ Sở
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Cơ sở đang chọn: <strong className="text-slate-800">{currentFacility?.name || layout?.facility?.name}</strong> ({currentFacility?.code || layout?.facility?.code}) • {currentFacility?.address || layout?.facility?.address}
                </p>
              </div>
            </div>

            {/* THANH CHUYỂN ĐỔI LINH HOẠT 6 CHI NHÁNH CHO ADMIN & GIÁM ĐỐC VẬN HÀNH */}
            {isGlobalManager ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
                      Thanh Chọn Chuyển Đổi Chi Nhánh (Toàn Bộ 6 Chi Nhánh)
                    </span>
                  </div>
                  
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {facilitiesList.map((fac) => {
                    const isSelected = String(fac.id) === String(activeFacilityId);
                    return (
                      <button
                        key={String(fac.id)}
                        type="button"
                        onClick={() => handleFacilityChange(String(fac.id))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-md ring-2 ring-indigo-500/30'
                            : 'bg-white border-slate-200/90 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {fac.code}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                        </div>
                        <p className={`text-xs font-bold line-clamp-1 mt-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {fac.name.replace(/^Kho\s+Tự\s+Quản\s+/i, '')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3 text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Chi nhánh phụ trách: <strong className="text-slate-900">{currentFacility?.name}</strong> ({currentFacility?.code})
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                  Cố định theo phân công
                </span>
              </div>
            )}

            {/* Warning if branch manager tries to edit another branch */}
            {!canEditCurrentFacility && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Quyền hạn bị giới hạn theo chi nhánh</strong>
                  Bạn đang xem cơ sở <strong>{currentFacility?.name}</strong>. Theo chính sách phân quyền bảo mật, Quản lý chi nhánh chỉ được phép tải và thay đổi hình ảnh của cơ sở do mình trực tiếp phụ trách. Để quản trị ảnh, vui lòng chuyển về chi nhánh được phân công hoặc liên hệ Giám đốc vận hành.
                </div>
              </div>
            )}

            {/* Primary Banner Hero Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Ảnh Toàn Cảnh / Mặt Tiền Cơ Sở (Banner chính)
                  </span>
                </div>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100 group">
                  {currentFacility?.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentFacility.images[0]}
                      alt={currentFacility.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="w-10 h-10 stroke-1" />
                      <span className="text-xs">Cơ sở chưa có ảnh đại diện</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                      Ảnh Bìa Đang Dùng
                    </span>
                  </div>

                  {currentFacility?.images?.[0] && (
                    <div className="absolute bottom-3 right-3">
                      <a
                        href={currentFacility.images[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/90 hover:bg-white text-slate-800 backdrop-blur-md shadow-xs flex items-center gap-1.5 transition"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Xem ảnh gốc</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Form Box */}
              <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Tải Ảnh Cơ Sở Mới
                    </h4>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                  disabled={!canEditCurrentFacility || isUploadingPhoto}
                />

                {/* Dropzone / Preview */}
                {photoPreviewUrl ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-indigo-200 shadow-xs bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleClearSelectedPhoto}
                        disabled={isUploadingPhoto}
                        className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md transition cursor-pointer"
                      >
                        Hủy chọn
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="truncate max-w-[200px] font-semibold">{selectedPhotoFile?.name}</span>
                      <span>{selectedPhotoFile ? `${(selectedPhotoFile.size / 1024 / 1024).toFixed(2)} MB` : ''}</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (canEditCurrentFacility && !isUploadingPhoto) {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 transition ${
                      canEditCurrentFacility && !isUploadingPhoto
                        ? 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/30 cursor-pointer'
                        : 'border-slate-200 bg-slate-100/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Bấm vào đây để chọn ảnh cơ sở
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Định dạng JPG, PNG, WEBP (Tối đa 10MB)
                      </span>
                    </div>
                  </div>
                )}

                {/* Options & Action button */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setAsPrimary}
                      onChange={(e) => setSetAsPrimary(e.target.checked)}
                      disabled={!canEditCurrentFacility || isUploadingPhoto}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Đặt làm ảnh đại diện chính ngay khi tải lên</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleUploadPhoto}
                    disabled={!selectedPhotoFile || !canEditCurrentFacility || isUploadingPhoto}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Xác Nhận Tải Ảnh Lên</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BỘ 3 ẢNH LOẠI NGĂN KHO TRẢI ĐỀU (KHO NHỎ - TRUNG BÌNH - LỚN) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Bộ 3 Ảnh Minh Họa Ngăn Kho (Kho Nhỏ • Kho Trung Bình • Kho Lớn)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ba ảnh này được trải đều ngay bên dưới ảnh chính của cơ sở trên trang khách hàng. Quản lý có thể tải ảnh chụp thực tế cho từng loại ô kho hoặc khôi phục về ảnh mẫu chuẩn STO.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {UNIT_SLOT_CONFIGS.map((slotCfg) => {
                const customImg = currentFacility?.images?.[slotCfg.slot];
                const hasCustom =
                  customImg &&
                  typeof customImg === 'string' &&
                  customImg.trim() !== '' &&
                  !customImg.includes('photo-1586528116311-ad8dd3c8310d') &&
                  !customImg.includes('photo-1587293852726-70cdb56c2866') &&
                  !customImg.includes('photo-1553413077-190dd305871c') &&
                  !customImg.includes('photo-1563986768609') &&
                  !customImg.includes('photo-1600585154526') &&
                  !customImg.includes('photo-1507089947368') &&
                  !customImg.includes('photo-1486406146926') &&
                  !customImg.includes('photo-1503387762');

                const displayImg = hasCustom ? customImg : slotCfg.fallback;
                const preview = unitSlotPreviews[slotCfg.slot];
                const isUploadingThis = uploadingSlot === slotCfg.slot;
                const isResettingThis = resettingSlot === slotCfg.slot;

                return (
                  <div
                    key={slotCfg.slot}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-slate-300 transition-all group"
                  >
                    {/* Slot Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-200">
                            Vị trí #{slotCfg.slot}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{slotCfg.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{slotCfg.sub}</p>
                      </div>

                      {hasCustom ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Ảnh thực tế</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          Ảnh mẫu STO
                        </span>
                      )}
                    </div>

                    {/* Image Preview */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview || displayImg}
                        alt={slotCfg.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                      />
                      {preview && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          Xem trước tệp mới
                        </div>
                      )}
                      {!preview && (
                        <div className="absolute bottom-2 right-2">
                          <a
                            href={displayImg}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-md bg-white/90 hover:bg-white text-slate-700 shadow-xs flex items-center justify-center transition"
                            title="Xem ảnh gốc"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* File Controls */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      {preview ? (
                        <div className="space-y-2">
                          <div className="text-[11px] text-slate-600 flex items-center justify-between">
                            <span className="truncate max-w-[160px] font-semibold">{unitSlotFiles[slotCfg.slot]?.name}</span>
                            <button
                              type="button"
                              onClick={() => handleClearUnitSlotFile(slotCfg.slot)}
                              disabled={isUploadingThis}
                              className="text-rose-600 hover:underline cursor-pointer font-bold text-[10px]"
                            >
                              Hủy chọn
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUploadUnitSlotPhoto(slotCfg.slot, slotCfg.title)}
                            disabled={isUploadingThis || !canEditCurrentFacility}
                            className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            {isUploadingThis ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang tải lên ...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Xác nhận tải ảnh này</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label
                            className={`flex-1 py-2 px-3 rounded-xl border border-dashed text-xs font-bold text-center transition flex items-center justify-center gap-1.5 ${
                              canEditCurrentFacility
                                ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-700 cursor-pointer'
                                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Tải ảnh mới</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/jpg"
                              disabled={!canEditCurrentFacility || isUploadingThis}
                              onChange={(e) => handleUnitSlotFileChange(slotCfg.slot, e)}
                              className="hidden"
                            />
                          </label>

                          {hasCustom && canEditCurrentFacility && (
                            <button
                              type="button"
                              onClick={() => handleResetUnitSlotToDefault(slotCfg.slot, slotCfg.fallback, slotCfg.title)}
                              disabled={isResettingThis}
                              className="py-2 px-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                              title="Khôi phục lại ảnh mẫu chuẩn STO"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-400" />
                              <span>Mặc định</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gallery of all facility photos */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Tất Cả Hình Ảnh Cơ Sở ({currentFacility?.images?.length || 0} ảnh)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý danh sách hình ảnh thực tế của cơ sở để hiển thị đồng bộ trên hệ thống.
                </p>
              </div>

              {canEditCurrentFacility && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Thêm ảnh mới</span>
                </button>
              )}
            </div>

            {(!currentFacility?.images || currentFacility.images.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có ảnh nào được lưu trữ cho cơ sở này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentFacility.images.map((imgUrl, idx) => {
                  const isPrimaryImage = idx === 0;
                  return (
                    <div
                      key={imgUrl}
                      className={`group rounded-2xl overflow-hidden border transition-all flex flex-col justify-between bg-white shadow-2xs ${
                        isPrimaryImage
                          ? 'border-indigo-400 ring-2 ring-indigo-500/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`${currentFacility.name} photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          {isPrimaryImage ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-indigo-600 text-white shadow-xs flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" />
                              Ảnh Đại Diện Chính
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/70 backdrop-blur-md text-white">
                              Ảnh phụ #{idx + 1}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2.5 right-2.5">
                          <a
                            href={imgUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-md bg-white/90 hover:bg-white text-slate-700 shadow-xs flex items-center justify-center transition"
                            title="Mở liên kết ảnh gốc Cloudinary"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                        {isPrimaryImage ? (
                          <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đang là ảnh đại diện
                          </span>
                        ) : canEditCurrentFacility ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryPhoto(imgUrl)}
                            disabled={isUpdatingImages}
                            className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Đặt làm ảnh chính</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Ảnh phụ</span>
                        )}

                        {canEditCurrentFacility && (
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(imgUrl)}
                            disabled={isUpdatingImages || (currentFacility?.images?.length ?? 0) <= 1}
                            className="text-xs font-bold text-slate-400 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition ml-auto"
                            title="Gỡ ảnh này khỏi cơ sở"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Gỡ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          
        </div>
      )}
    </div>
  );
}
