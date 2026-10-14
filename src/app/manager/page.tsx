'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  ArrowLeft,
  LayoutDashboard,
  ArrowUpRight,
  MapPin,
  LifeBuoy,
  Settings,
  Inbox,
  RefreshCw,
  LogIn,
  LogOut,
  Building2,
  Menu,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Boxes,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

// Import Types & APIs
import { CheckInAppointment, AvailableUnit, FlowStep, StaffUser } from '../staff/types';
import { ManagerTab } from './types';
import { handoversApi } from '@/lib/api/handovers';
import { renewalsApi } from '@/lib/api/renewals';

// Import Sub-Components
import ManagerSidebar from './components/ManagerSidebar';
import ManagerOverviewDashboard from './components/ManagerOverviewDashboard';
import CheckInQueue, { checkAppointmentEligibility } from '../staff/components/CheckInQueue';
import HandoverProcess from '../staff/components/HandoverProcess';
import HandoverSuccess from '../staff/components/HandoverSuccess';
import ContractModal from '../staff/components/ContractModal';
import PrintModal from '../staff/components/PrintModal';
import StaffProfileView from '../staff/components/StaffProfileView';
import UnitTypesPricingManager from '../staff/components/UnitTypesPricingManager';
import FacilityLayoutView from '../staff/components/FacilityLayoutView';
import StaffSupportTicketsView from '../staff/components/StaffSupportTicketsView';
import StaffRenewalsOverdueView from '../staff/components/StaffRenewalsOverdueView';
import StaffLoginModal from '../staff/components/StaffLoginModal';

export default function ManagerPortalPage() {
  const router = useRouter();

  // Navigation & Sub-views State (Manager defaults to 'dashboard')
  const [activeTab, setActiveTab] = useState<ManagerTab>('dashboard');
  const [flowStep, setFlowStep] = useState<FlowStep>('queue');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  // Hydration & Auth State
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [usingLiveApi, setUsingLiveApi] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingRenewalsCount, setPendingRenewalsCount] = useState(0);

  // Appointments & Units State
  const [appointments, setAppointments] = useState<CheckInAppointment[]>([]);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');

  // Handover Operations State (if Manager executes check-in)
  const [selectedUnitCode, setSelectedUnitCode] = useState<string>('');
  const [customPin, setCustomPin] = useState<string>('');
  const [customRfid, setCustomRfid] = useState<string>('');
  const [handoverCondition, setHandoverCondition] = useState('Kho sạch sẽ, không hư hỏng, khóa cửa hoạt động tốt');
  const [handoverNotes, setHandoverNotes] = useState('Quản lý trực tiếp bàn giao mã PIN và hướng dẫn khách sử dụng');
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Modals & Feedback State
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Cuộc hẹn đang được xử lý
  const currentAppointment = useMemo(() => {
    return appointments.find((a) => a.id === selectedAppointmentId) || appointments[0];
  }, [appointments, selectedAppointmentId]);

  // Đếm số lượng đơn đang chờ
  const pendingCount = useMemo(() => {
    return appointments.filter((a) => a.status !== 'completed').length;
  }, [appointments]);

  // Helper avatar initials
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'QL';
  };

  // Hàm tải dữ liệu từ Backend API
  const loadBackendData = useCallback(async (showToast = false, facilityIdOverride?: string | number) => {
    setIsLoadingQueue(true);
    setIsRefreshing(true);
    try {
      const isOnline = await handoversApi.checkHealth();
      setIsBackendOnline(isOnline);

      const storedUser = handoversApi.getStoredUser();
      const managerFacilityId = facilityIdOverride !== undefined ? facilityIdOverride : storedUser?.facilityId;

      if (isOnline) {
        // Lấy queue đơn đặt chỗ từ Backend API
        const queueRes = await handoversApi.fetchCheckInQueue({
          facilityId: managerFacilityId,
        });
        if (queueRes.items && queueRes.items.length > 0) {
          setAppointments(queueRes.items);
          setSelectedAppointmentId(queueRes.items[0].id);
          setUsingLiveApi(true);
          const facName = storedUser?.assignedFacility?.name || 'cơ sở';
          if (showToast) toast.success(`Đã cập nhật ${queueRes.items.length} đơn nhận kho của ${facName}.`);
        } else {
          setAppointments([]);
          setSelectedAppointmentId('');
          setUsingLiveApi(true);
          if (showToast) toast.info('Cơ sở hiện chưa có đơn nhận kho mới.');
        }

        // Lấy danh sách ô kho trống khả dụng
        const unitsRes = await handoversApi.fetchAvailableUnits(managerFacilityId);
        setAvailableUnits(unitsRes || []);

        // Lấy số lượng yêu cầu gia hạn đang chờ duyệt
        try {
          const renRes = await renewalsApi.getRenewals({
            facilityId: managerFacilityId ? String(managerFacilityId) : undefined,
            status: 'PENDING',
          });
          const renItems = Array.isArray(renRes) ? renRes : (renRes as any)?.data || [];
          setPendingRenewalsCount(renItems.filter((r: any) => r.status === 'PENDING').length);
        } catch {
          // Bỏ qua lỗi phụ nếu chưa có dữ liệu gia hạn
        }
      } else {
        setUsingLiveApi(false);
        setAppointments([]);
        if (showToast) toast.info('Không thể kết nối đến máy chủ.');
      }
    } catch {
      setIsBackendOnline(false);
      setUsingLiveApi(false);
      setAppointments([]);
    } finally {
      setIsLoadingQueue(false);
      setIsRefreshing(false);
    }
  }, []);

  // Khởi tạo kiểm tra kết nối & quyền truy cập Role Quản Lý
  useEffect(() => {
    setIsMounted(true);
    const stored = handoversApi.getStoredUser();

    if (!stored) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?redirect=/manager');
      }
      return;
    }

    const roleName = (stored.role || '').toUpperCase();

    // 1. Nếu là Khách hàng -> Chuyển về Dashboard
    if (roleName === 'STORAGE_CUSTOMER') {
      toast.error('Tài khoản Khách hàng không có quyền truy cập Cổng Quản Lý.');
      if (typeof window !== 'undefined') {
        window.location.replace('/dashboard');
      }
      return;
    }

    // 2. Nếu là Nhân viên thuần (không phải Manager hay Admin) -> Chuyển về Cổng Nhân Viên /staff
    const isManagerOrAdmin = 
      roleName === 'FACILITY_MANAGER' ||
      roleName === 'BUSINESS_OPERATIONS_MANAGER' ||
      roleName === 'MANAGER' ||
      roleName === 'SYSTEM_ADMINISTRATOR' ||
      roleName === 'ADMIN' ||
      roleName.includes('MANAGER') ||
      roleName.includes('ADMIN');

    if (!isManagerOrAdmin) {
      toast.warning('Tài khoản Nhân viên không có quyền truy cập Cổng Quản Lý. Đã chuyển về Cổng Nhân Viên.');
      if (typeof window !== 'undefined') {
        window.location.replace('/staff');
      }
      return;
    }

    setCurrentUser(stored);
    loadBackendData(false, stored.facilityId);

    // Kiểm tra query param tab (e.g. /manager?tab=facility)
    const checkTabQuery = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab') as ManagerTab;
        if (
          tabParam &&
          ['dashboard', 'facility', 'unit_types', 'checkout', 'queue', 'support', 'profile'].includes(tabParam)
        ) {
          setActiveTab(tabParam);
          if (tabParam === 'queue') setFlowStep('queue');
        }
      }
    };
    checkTabQuery();
    window.addEventListener('popstate', checkTabQuery);
    return () => window.removeEventListener('popstate', checkTabQuery);
  }, [loadBackendData]);

  // Đồng bộ ô kho & mã pin khi chọn một cuộc hẹn
  const handleSelectAppointment = (appointment: CheckInAppointment) => {
    setSelectedAppointmentId(appointment.id);
    setSelectedUnitCode(appointment.assignedUnit);
    setCustomPin(appointment.accessPin || Math.floor(100000 + Math.random() * 900000).toString());
    setCustomRfid(appointment.rfidCard || `RFID-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Action: Bắt đầu nhận kho
  const handleStartCheckIn = async (apt: CheckInAppointment) => {
    const eligibility = checkAppointmentEligibility(apt);
    if (!eligibility.allowed) {
      toast.warning(eligibility.reason || 'Chưa tới thời gian nhận kho (chỉ mở trước giờ hẹn 1 tiếng).');
      return;
    }

    handleSelectAppointment(apt);
    setAppointments((prev) =>
      prev.map((item) => (item.id === apt.id ? { ...item, status: 'in_progress' } : item)),
    );
    setFlowStep('handover');
    toast.info(`Quản lý tiếp nhận bàn giao cho khách: ${apt.customerName}`);
  };

  // Action: Hoàn tất nhận kho
  const handleCompleteHandover = async () => {
    if (!selectedUnitCode) {
      toast.error('Vui lòng chọn ô kho được cấp cho khách.');
      return;
    }
    if (!customPin || customPin.length < 4) {
      toast.error('Vui lòng nhập mã PIN bảo mật tối thiểu 4 số.');
      return;
    }

    setIsSubmittingCheckIn(true);
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const finalUnit = selectedUnitCode || currentAppointment.assignedUnit;

    try {
      if (currentAppointment.rawId && isBackendOnline) {
        const response = await handoversApi.performCheckIn({
          reservationId: currentAppointment.rawId,
          condition: handoverCondition,
          notes: handoverNotes,
        });

        const backendAccessCode = response.contractItems?.[0]?.accessCode || customPin;
        const backendContractCode = response.contract?.contractCode;

        setAppointments((prev) =>
          prev.map((item) =>
            item.id === currentAppointment.id
              ? {
                  ...item,
                  status: 'completed',
                  assignedUnit: finalUnit,
                  accessPin: backendAccessCode,
                  contractCode: backendContractCode,
                  rfidCard: customRfid,
                  completedAt: nowTime,
                }
              : item,
          ),
        );

        setAvailableUnits((prev) =>
          prev.map((u) => (u.code === finalUnit ? { ...u, status: 'occupied' } : u)),
        );

        setCustomPin(backendAccessCode);
        setFlowStep('success');
        toast.success(`Bàn giao thành công ô kho ${finalUnit}!`);
        return;
      } else {
        toast.success(`Đã hoàn tất bàn giao ô kho ${finalUnit}`);
        setAppointments((prev) =>
          prev.map((item) =>
            item.id === selectedAppointmentId
              ? {
                  ...item,
                  status: 'completed',
                  assignedUnit: finalUnit,
                  accessPin: customPin,
                  rfidCard: customRfid,
                  completedAt: nowTime,
                }
              : item,
          ),
        );
        setFlowStep('success');
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi hoàn tất bàn giao.');
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const handleReschedule = async (
    apt: CheckInAppointment,
    newDateIso: string,
    newSlotTime: string,
    notes?: string
  ) => {
    try {
      if (isBackendOnline && apt.rawId) {
        await handoversApi.rescheduleReservation(apt.rawId, newDateIso, notes);
      }

      const dateObj = new Date(newDateIso);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const startDateStr = `${day}/${month}/${year}`;

      const now = new Date();
      let dateDisplay = `${day}/${month}/${year}`;
      if (dateObj.toDateString() === now.toDateString()) {
        dateDisplay = 'Hôm nay';
      }

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === apt.id
            ? {
                ...item,
                appointmentDateRaw: newDateIso,
                slotTime: newSlotTime,
                startDate: startDateStr,
                dateDisplay,
                specialNotes: notes ? `Dời hẹn: ${notes}` : item.specialNotes,
              }
            : item
        )
      );

      toast.success(`Đã dời lịch hẹn của khách ${apt.customerName} sang ${dateDisplay} (${newSlotTime}).`);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể dời lịch hẹn.');
      throw err;
    }
  };

  const handleCancelOrNoShow = async (
    apt: CheckInAppointment,
    reason: string,
    depositHandling: 'forfeit' = 'forfeit'
  ) => {
    try {
      if (isBackendOnline && apt.rawId) {
        await handoversApi.cancelReservation(apt.rawId, reason);
      }

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === apt.id
            ? {
                ...item,
                status: 'cancelled',
                cancelReason: `${reason} (Khấu trừ 100% tiền cọc về hệ thống)`,
              }
            : item
        )
      );

      setAvailableUnits((prev) =>
        prev.map((u) => (u.code === apt.assignedUnit ? { ...u, status: 'vacant' } : u))
      );

      toast.success(`Đã hủy lịch hẹn ${apt.id} và giải phóng ô kho.`);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể hủy lịch hẹn.');
      throw err;
    }
  };

  const handleExecuteNativePrint = () => {
    setIsPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleLogout = async () => {
    try {
      handoversApi.logout();
      setCurrentUser(null);
      toast.success('Đã đăng xuất tài khoản Quản lý.');
      if (typeof window !== 'undefined') {
        window.location.href = '/login?redirect=/manager';
      }
    } catch {
      window.location.href = '/login';
    }
  };

  if (!isMounted) return null;

  const currentTabLabel = {
    dashboard: 'Bảng Điều Khiển Tổng Quan',
    facility: 'Sơ Đồ Cơ Sở & Phân Công Nhân Sự',
    unit_types: 'Quản Lý Loại Kho & Bảng Giá',
    checkout: 'Phê Duyệt Gia Hạn & Xử Lý Quá Hạn',
    queue: 'Giám Sát Quầy Nhận Kho',
    support: 'Giám Sát Xử Lý Sự Cố & Khiếu Nại',
    profile: 'Hồ Sơ Quản Lý & Bảo Mật',
    settings: 'Cài Đặt Cổng Chi Nhánh',
  }[activeTab];

  return (
    <div className="h-screen bg-slate-50/60 font-sans text-slate-800 antialiased flex flex-col overflow-hidden">
      {/* 1. TOP EXECUTIVE HEADER */}
      <header className="h-18 bg-white border-b border-slate-200 shrink-0 z-40 flex items-center justify-between px-3 sm:px-6 shadow-2xs">
        {/* Left: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
            title="Đóng / mở thanh điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/manager" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-lg tracking-tight text-slate-900 block leading-tight">
                SmartStorage
              </span>
              <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest block">
                Cổng Quản Lý Cơ Sở
              </span>
            </div>
          </Link>

          {/* Breadcrumb separator */}
          <div className="hidden md:flex items-center gap-2 pl-4 ml-3 border-l border-slate-200 text-xs font-semibold text-slate-500">
            <span className="text-slate-400">Quản Lý</span>
            <span>/</span>
            <span className="text-indigo-900 font-bold">{currentTabLabel}</span>
          </div>
        </div>

        {/* Right: Actions, Counter Switcher & Manager Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick link to Counter view */}
          <Link
            href="/staff"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            title="Mở giao diện quầy nhân viên để kiểm tra trực tiếp"
          >
            <span>Quầy Nhân Viên</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadBackendData(true, currentUser?.facilityId)}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu hệ thống"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          {/* Manager Avatar Pill */}
          {currentUser && (
            <div
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {getInitials(currentUser.fullName, currentUser.email)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 max-w-[120px] truncate leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-indigo-700 font-extrabold uppercase">
                  {currentUser.role === 'BUSINESS_OPERATIONS_MANAGER' ? 'Quản lý chuỗi' : 'Quản lý chi nhánh'}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Manager Dedicated Sidebar */}
        <ManagerSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'queue') setFlowStep('queue');
          }}
          pendingCount={pendingCount}
          pendingRenewalsCount={pendingRenewalsCount}
          currentUser={currentUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          isOpen={isMobileSidebarOpen}
          onToggle={handleToggleSidebar}
        />

        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-30 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* TAB 1: BẢNG ĐIỀU KHIỂN TỔNG QUAN QUẢN LÝ (DEFAULT) */}
            {activeTab === 'dashboard' && (
              <ManagerOverviewDashboard
                facilityName={currentUser?.assignedFacility?.name || 'Chi nhánh Landmark 81'}
                facilityId={currentUser?.facilityId}
                managerName={currentUser?.fullName}
                managerRole={currentUser?.role}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  if (tab === 'queue') setFlowStep('queue');
                }}
                pendingCheckInsCount={pendingCount}
                pendingRenewalsCount={pendingRenewalsCount}
              />
            )}

            {/* TAB 2: SƠ ĐỒ MẶT BẰNG & PHÂN CÔNG NHÂN SỰ */}
            {activeTab === 'facility' && (
              <FacilityLayoutView
                facilityId={currentUser?.facilityId || currentUser?.assignedFacility?.id || ''}
                userRole={currentUser?.role || 'FACILITY_MANAGER'}
              />
            )}

            {/* TAB 3: QUẢN LÝ LOẠI KHO & BẢNG GIÁ (CHỈ MỞ CHO MANAGER & ADMIN) */}
            {activeTab === 'unit_types' && (
              <UnitTypesPricingManager
                currentFacilityId={currentUser?.facilityId}
                currentUser={currentUser}
              />
            )}

            {/* TAB 4: PHÊ DUYỆT GIA HẠN & XỬ LÝ QUÁ HẠN (CRON SCAN & MIỄN GIẢM PHẠT) */}
            {activeTab === 'checkout' && (
              <StaffRenewalsOverdueView
                facilityId={currentUser?.facilityId || currentUser?.assignedFacility?.id || ''}
              />
            )}

            {/* TAB 5: GIÁM SÁT TIẾP NHẬN BÀN GIAO TẠI QUẦY */}
            {activeTab === 'queue' && flowStep === 'queue' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-indigo-900 font-semibold">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span>
                      Đang xem <strong>Hàng đợi nhận kho tại quầy</strong> dưới quyền Quản Lý. Bạn có thể giám sát hoặc trực tiếp hỗ trợ nhân viên thực hiện thủ tục bàn giao.
                    </span>
                  </div>
                  <Link
                    href="/staff"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shrink-0 self-start sm:self-auto shadow-2xs"
                  >
                    <span>Mở Quầy Tiếp Đón</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <CheckInQueue
                  appointments={appointments}
                  onStartCheckIn={handleStartCheckIn}
                  selectedAppointmentId={selectedAppointmentId}
                  onReschedule={handleReschedule}
                  onCancelOrNoShow={handleCancelOrNoShow}
                />
              </div>
            )}

            {/* FLOW BÀN GIAO (NẾU QUẢN LÝ THỰC HIỆN CHECK-IN) */}
            {activeTab === 'queue' && flowStep === 'handover' && (
              <HandoverProcess
                appointment={currentAppointment}
                availableUnits={availableUnits}
                selectedUnitCode={selectedUnitCode}
                onChangeUnitCode={setSelectedUnitCode}
                customPin={customPin}
                onChangeCustomPin={setCustomPin}
                customRfid={customRfid}
                onChangeCustomRfid={setCustomRfid}
                condition={handoverCondition}
                onChangeCondition={setHandoverCondition}
                notes={handoverNotes}
                onChangeNotes={setHandoverNotes}
                isSubmitting={isSubmittingCheckIn}
                staffName={currentUser?.fullName || 'Quản lý cơ sở'}
                onBackToQueue={() => setFlowStep('queue')}
                onOpenContractModal={() => setIsContractModalOpen(true)}
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
                onCompleteHandover={handleCompleteHandover}
              />
            )}

            {activeTab === 'queue' && flowStep === 'success' && (
              <HandoverSuccess
                appointment={currentAppointment}
                assignedUnit={selectedUnitCode}
                customPin={customPin}
                customRfid={customRfid}
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
                onSendNotification={() => {
                  toast.success(`Đã gửi SMS & Email mã khóa cho khách: ${currentAppointment.phone}`);
                }}
                onBackToQueue={() => setFlowStep('queue')}
              />
            )}

            {/* TAB 6: GIÁM SÁT SỰ CỐ & HỖ TRỢ KỸ THUẬT */}
            {activeTab === 'support' && (
              <StaffSupportTicketsView
                facilityId={currentUser?.facilityId || currentUser?.assignedFacility?.id || ''}
              />
            )}

            {/* TAB 7: HỒ SƠ QUẢN LÝ & BẢO MẬT */}
            {activeTab === 'profile' && (
              <StaffProfileView
                currentUser={currentUser}
                onUserUpdated={(updated) => setCurrentUser(updated)}
                onLogout={handleLogout}
              />
            )}
          </main>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        appointment={currentAppointment}
        assignedUnit={selectedUnitCode}
        onPrint={() => setIsPrintModalOpen(true)}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        appointment={currentAppointment}
        assignedUnit={selectedUnitCode}
        customPin={customPin}
        onConfirmPrint={handleExecuteNativePrint}
      />

      <StaffLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          toast.success(`Đăng nhập thành công: ${user.fullName} (${user.role})`);
          loadBackendData(true, user.facilityId);
        }}
      />
    </div>
  );
}
