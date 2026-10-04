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
} from 'lucide-react';
import { toast } from 'sonner';

// Import Types & Mock Data
import { CheckInAppointment, AvailableUnit, StaffTab, FlowStep, StaffUser } from './types';
import { INITIAL_APPOINTMENTS, INITIAL_AVAILABLE_UNITS } from './mockData';
import { handoversApi } from '../../lib/api/handovers';

// Import Sub-Components
import Sidebar from './components/Sidebar';
import CheckInQueue, { checkAppointmentEligibility } from './components/CheckInQueue';
import HandoverProcess from './components/HandoverProcess';
import HandoverSuccess from './components/HandoverSuccess';
import ContractModal from './components/ContractModal';
import PrintModal from './components/PrintModal';
import StaffLoginModal from './components/StaffLoginModal';
import StaffProfileView from './components/StaffProfileView';
import UnitTypesPricingManager from './components/UnitTypesPricingManager';

export default function StaffPortalPage() {
  const router = useRouter();

  // Navigation & Sub-views State
  const [activeTab, setActiveTab] = useState<StaffTab>('queue');
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

  // Backend Connection & Auth State
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [usingLiveApi, setUsingLiveApi] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Appointments & Units State
  const [appointments, setAppointments] = useState<CheckInAppointment[]>(INITIAL_APPOINTMENTS);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>(INITIAL_AVAILABLE_UNITS);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('SS-BK-2026-8910');

  // Handover Operations State (Trang B)
  const [selectedUnitCode, setSelectedUnitCode] = useState<string>('');
  const [customPin, setCustomPin] = useState<string>('');
  const [customRfid, setCustomRfid] = useState<string>('');
  const [handoverCondition, setHandoverCondition] = useState('Kho sạch sẽ, không hư hỏng, khóa cửa hoạt động tốt');
  const [handoverNotes, setHandoverNotes] = useState('Đã bàn giao mã PIN và hướng dẫn khách sử dụng cửa');
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Modals & Feedback State
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Cuộc hẹn đang được xử lý
  const currentAppointment = useMemo(() => {
    return appointments.find((a) => a.id === selectedAppointmentId) || appointments[0];
  }, [appointments, selectedAppointmentId]);

  // Đếm số lượng đơn đang chờ cho badge sidebar
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
    return 'NV';
  };

  // Hàm tải dữ liệu từ Backend API theo phân công cơ sở của nhân viên
  const loadBackendData = useCallback(async (showToast = false, facilityIdOverride?: number) => {
    setIsLoadingQueue(true);
    setIsRefreshing(true);
    try {
      const isOnline = await handoversApi.checkHealth();
      setIsBackendOnline(isOnline);

      const storedUser = handoversApi.getStoredUser();
      const staffFacilityId = facilityIdOverride !== undefined ? facilityIdOverride : storedUser?.facilityId;

      if (isOnline) {
        // Lấy queue đơn đặt chỗ từ Backend API theo cơ sở được phân công của nhân viên
        const queueRes = await handoversApi.fetchCheckInQueue({
          facilityId: staffFacilityId,
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

        // Lấy danh sách ô kho trống khả dụng của đúng cơ sở này
        const unitsRes = await handoversApi.fetchAvailableUnits(staffFacilityId);
        if (unitsRes && unitsRes.length > 0) {
          setAvailableUnits(unitsRes);
        }
      } else {
        setUsingLiveApi(false);
        if (showToast) toast.info('Đang hoạt động ở chế độ dữ liệu mô phỏng.');
      }
    } catch {
      setIsBackendOnline(false);
      setUsingLiveApi(false);
    } finally {
      setIsLoadingQueue(false);
      setIsRefreshing(false);
    }
  }, []);

  // Khởi tạo kiểm tra kết nối & auth khi load trang
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const stored = handoversApi.getStoredUser();

    if (!token || !stored) {
      router.push('/login?redirect=/staff');
      return;
    }

    if (stored.role === 'STORAGE_CUSTOMER') {
      toast.error('Tài khoản Khách hàng không có quyền truy cập Cổng Nhân Viên.');
      router.push('/dashboard');
      return;
    }

    setCurrentUser(stored);
    loadBackendData(false, stored.facilityId);

    // Check for query param tab (e.g. /staff?tab=profile)
    const checkTabQuery = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab') as StaffTab;
        if (
          tabParam &&
          ['queue', 'dashboard', 'checkout', 'facility', 'support', 'settings', 'profile', 'unit_types'].includes(
            tabParam,
          )
        ) {
          const isManager = ['FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN'].includes(
            (stored?.role || '').toUpperCase()
          );
          if (tabParam === 'unit_types' && !isManager) {
            setActiveTab('queue');
            setFlowStep('queue');
            return;
          }
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

  // Action 1: [ Bắt đầu nhận kho ]
  const handleStartCheckIn = async (apt: CheckInAppointment) => {
    const eligibility = checkAppointmentEligibility(apt);
    if (!eligibility.allowed) {
      toast.warning(eligibility.reason || 'Chưa tới thời gian nhận kho (chỉ mở trước giờ hẹn 1 tiếng).');
      return;
    }

    handleSelectAppointment(apt);

    // Cập nhật trạng thái sang in_progress
    setAppointments((prev) =>
      prev.map((item) => (item.id === apt.id ? { ...item, status: 'in_progress' } : item)),
    );
    setFlowStep('handover');
    toast.info(`Bắt đầu làm thủ tục bàn giao cho khách: ${apt.customerName}`);

    // Nếu đơn có rawId từ backend, fetch thêm thông tin chi tiết
    if (apt.rawId && isBackendOnline) {
      try {
        const detail = await handoversApi.fetchReservationForCheckIn(apt.rawId);
        setAppointments((prev) =>
          prev.map((item) => (item.id === apt.id ? { ...item, ...detail } : item)),
        );
      } catch {
        // Dùng dữ liệu hiện tại
      }
    }
  };

  // Action 2: [ Hoàn tất bàn giao ]
  const handleCompleteHandover = async () => {
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const finalUnit = selectedUnitCode || currentAppointment.assignedUnit;

    // Nếu có backend online và có rawId
    if (isBackendOnline && currentAppointment.rawId) {
      setIsSubmittingCheckIn(true);
      try {
        const response = await handoversApi.performCheckIn({
          reservationId: currentAppointment.rawId,
          condition: handoverCondition,
          notes: handoverNotes,
        });

        // Lấy mã PIN Smart Lock và mã hợp đồng từ Backend response
        const backendAccessCode = response.contractItems?.[0]?.accessCode || customPin;
        const backendContractCode = response.contract?.contractCode;

        setAppointments((prev) =>
          prev.map((item) => {
            if (item.id === currentAppointment.id) {
              return {
                ...item,
                status: 'completed',
                assignedUnit: finalUnit,
                accessPin: backendAccessCode,
                contractCode: backendContractCode,
                rfidCard: customRfid,
                completedAt: nowTime,
              };
            }
            return item;
          }),
        );

        // Cập nhật trạng thái ô kho thành occupied
        setAvailableUnits((prev) =>
          prev.map((u) => (u.code === finalUnit ? { ...u, status: 'occupied' } : u)),
        );

        setCustomPin(backendAccessCode);
        setFlowStep('success');
        toast.success(`Bàn giao thành công ô kho ${finalUnit}! Mã HĐ: ${backendContractCode || 'Mới'}`);
        return;
      } catch (err: any) {
        toast.error(`Lỗi ghi nhận bàn giao: ${err.message || 'Thất bại'}.`);
      } finally {
        setIsSubmittingCheckIn(false);
      }
    }

    // Fallback: Hoàn tất cục bộ (nếu backend offline hoặc demo)
    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id === currentAppointment.id) {
          return {
            ...item,
            status: 'completed',
            assignedUnit: finalUnit,
            accessPin: customPin,
            rfidCard: customRfid,
            contractCode: `CON-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-LOCAL`,
            completedAt: nowTime,
          };
        }
        return item;
      }),
    );

    setAvailableUnits((prev) =>
      prev.map((u) => (u.code === finalUnit ? { ...u, status: 'occupied' } : u)),
    );

    setFlowStep('success');
    toast.success(`Bàn giao thành công ô kho ${finalUnit}!`);
  };

  // Action 3: In tài liệu tại quầy
  const handleExecuteNativePrint = () => {
    setIsPrintModalOpen(false);
    toast.info('Đang gửi lệnh in Hợp đồng & Phiếu bàn giao tới Máy in quầy lễ tân...');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await handoversApi.logout();
    } catch (err) {
      console.warn('Staff logout notice:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
      }
      setCurrentUser(null);
      toast.success('Đã đăng xuất tài khoản thành công');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const userRole = (currentUser?.role || '').toUpperCase();
  const canManagePricing = Boolean(
    currentUser && (
      userRole === 'FACILITY_MANAGER' ||
      userRole === 'BUSINESS_OPERATIONS_MANAGER' ||
      userRole === 'SYSTEM_ADMINISTRATOR' ||
      userRole === 'ADMIN'
    )
  );
  const staffRole = currentUser?.role ? currentUser.role.replace('FACILITY_', '') : 'STAFF';
  const rawFacilityName =
    currentUser?.assignedFacility?.name ||
    currentUser?.facilityName ||
    'Trụ Sở Chính Võ Nguyên Giáp';
  const facilityName = rawFacilityName.replace(/^Kho\s+Tự\s+Quản\s+/i, '').trim();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600/20 selection:text-blue-600">
      
      {/* 1. TOP HEADER (Fixed Full-Width Header Matching /dashboard) */}
      <header className="fixed top-0 inset-x-0 z-40 h-18 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
        {/* Left: Brand + Hamburger button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Thu gọn thanh điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo hệ thống chuẩn nhận diện thương hiệu */}
          <Link href="/" className="inline-flex items-center group py-1 pl-1" title="Về trang chủ SelfStorage">
            <img
              src="/logo.png"
              alt="SelfStorage Logo"
              className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-102"
            />
          </Link>

          {flowStep !== 'queue' && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {flowStep === 'handover' ? 'Đang thực hiện bàn giao' : 'Đã hoàn tất bàn giao'}
            </span>
          )}
        </div>

        {/* Right: Actions, Status & User Pill */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Facility Location Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="max-w-[180px] truncate">{facilityName}</span>
          </div>

          {/* Back to Queue shortcut if inside handover */}
          {flowStep !== 'queue' && (
            <button
              onClick={() => setFlowStep('queue')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Hàng Đợi</span>
            </button>
          )}

          {/* Staff Auth Button / Avatar Pill */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 text-left cursor-pointer group hover:opacity-85 transition-opacity"
                title="Hồ sơ & Đổi mật khẩu nhân viên"
              >
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 group-hover:scale-105 flex items-center justify-center font-bold text-white text-xs shadow-xs transition-transform"
                >
                  {getInitials(currentUser.fullName, currentUser.email)}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider">
                    {staffRole}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                title="Đăng xuất tài khoản nhân viên"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập Staff</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT (Starts below top header) */}
      <div className="flex pt-18 min-h-screen">
        {/* Staff Sidebar (Light YouTube Style matching /dashboard) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'queue') setFlowStep('queue');
            setIsMobileSidebarOpen(false);
          }}
          pendingCount={pendingCount}
          currentUser={currentUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          isOpen={isMobileSidebarOpen}
          onToggle={handleToggleSidebar}
        />

        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* 3. KHU VỰC NỘI DUNG CHÍNH (MAIN VIEW) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            
            {/* Banner Tiêu Đề Thanh Lịch Cho Hàng Đợi (Clean Header Card Matching Dashboard) */}
            {flowStep === 'queue' && activeTab === 'queue' && (
              <div className="mb-6 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Hàng Đợi Tiếp Nhận &amp; Bàn Giao Ô Kho
                      </h1>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                        Luồng 2 (Check-in)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Xác thực khách hàng theo khung giờ hẹn, kiểm tra tiền cọc và kích hoạt mã khóa Smart Lock tại quầy.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => loadBackendData(true)}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Đồng bộ đơn</span>
                  </button>
                </div>
              </div>
            )}

            {/* TRANG A: Hàng đợi Nhận kho trong ngày */}
            {flowStep === 'queue' && activeTab === 'queue' && (
              <CheckInQueue
                appointments={appointments}
                onStartCheckIn={handleStartCheckIn}
                selectedAppointmentId={selectedAppointmentId}
              />
            )}

            {/* TRANG B: Xác thực khách hàng & Thao tác Bàn giao (Màn hình chia đôi) */}
            {flowStep === 'handover' && (
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
                staffName={currentUser?.fullName || 'Nhân viên lễ tân'}
                onBackToQueue={() => setFlowStep('queue')}
                onOpenContractModal={() => setIsContractModalOpen(true)}
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
                onCompleteHandover={handleCompleteHandover}
              />
            )}

            {/* TRANG C: Hoàn tất Bàn giao */}
            {flowStep === 'success' && (
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

            {/* TRANG D: HỒ SƠ & ĐỔI MẬT KHẨU NHÂN VIÊN */}
            {activeTab === 'profile' && (
              <StaffProfileView
                currentUser={currentUser}
                onUserUpdated={(updated) => setCurrentUser(updated)}
                onLogout={handleLogout}
              />
            )}

            {/* TRANG E: QUẢN LÝ LOẠI KHO & BẢNG GIÁ THEO CƠ SỞ (Chỉ mở cho Manager & Admin) */}
            {activeTab === 'unit_types' && canManagePricing && (
              <UnitTypesPricingManager
                currentFacilityId={currentUser?.facilityId}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'unit_types' && !canManagePricing && (
              <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/90 p-8 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Mục Này Đã Được Ẩn
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Trang <strong>Quản lý loại kho &amp; Bảng giá</strong> đã được ẩn và chỉ dành riêng cho 3 vai trò: <strong>Facility Manager</strong>, <strong>Business Operations Manager</strong> và <strong>System Administrator</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('queue');
                    setFlowStep('queue');
                  }}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/25 transition cursor-pointer"
                >
                  Quay Lại Hàng Đợi Nhận Kho
                </button>
              </div>
            )}

            {/* CÁC TAB TÁC VỤ PHỤ TRỢ KHÁC */}
            {activeTab !== 'queue' && activeTab !== 'profile' && activeTab !== 'unit_types' && flowStep === 'queue' && (
              <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 p-10 text-center space-y-4 shadow-xs animate-slide-up-fade">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  {activeTab === 'dashboard' && <LayoutDashboard className="w-8 h-8" />}
                  {activeTab === 'checkout' && <ArrowUpRight className="w-8 h-8" />}
                  {activeTab === 'facility' && <MapPin className="w-8 h-8" />}
                  {activeTab === 'support' && <LifeBuoy className="w-8 h-8" />}
                  {activeTab === 'settings' && <Settings className="w-8 h-8" />}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {activeTab === 'dashboard' && 'Bảng Điều Khiển Tổng Quan Cơ Sở'}
                  {activeTab === 'checkout' && 'Quản Lý Trả Kho & Thanh Lý Hợp Đồng'}
                  {activeTab === 'facility' && 'Sơ Đồ Mặt Bằng & Trạng Thái Ô Kho 24/7'}
                  {activeTab === 'support' && 'Tiếp Nhận Hỗ Trợ & Xử Lý Sự Cố Khách Hàng'}
                  {activeTab === 'settings' && 'Cài Đặt Cổng Nhân Viên Cơ Sở'}
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Bạn đang ở chế độ xem tác vụ phụ trợ. Vui lòng chuyển sang <strong>Hàng đợi nhận kho</strong> để tiếp tục thao tác Luồng 2 (Check-in &amp; Handover).
                </p>
                <button
                  onClick={() => {
                    setActiveTab('queue');
                    setFlowStep('queue');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <Inbox className="w-4 h-4" />
                  <span>Vào Hàng Đợi Nhận Kho Ngay</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {/* MODAL 1: XEM TRƯỚC TOÀN VĂN HỢP ĐỒNG KỸ THUẬT SỐ */}
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        appointment={currentAppointment}
        assignedUnit={selectedUnitCode}
        onPrint={() => setIsPrintModalOpen(true)}
      />

      {/* MODAL 2: HỘP THOẠI GỬI LỆNH IN TÀI LIỆU QUẦY */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        appointment={currentAppointment}
        assignedUnit={selectedUnitCode}
        customPin={customPin}
        onConfirmPrint={handleExecuteNativePrint}
      />

      {/* MODAL 3: ĐĂNG NHẬP NHÂN VIÊN VỚI BACKEND JWT */}
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
