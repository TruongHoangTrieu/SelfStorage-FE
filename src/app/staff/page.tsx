'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowLeft,
  LayoutDashboard,
  ArrowUpRight,
  MapPin,
  LifeBuoy,
  Settings,
  Inbox,
  Wifi,
  WifiOff,
  RefreshCw,
  LogIn,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Import Types & Mock Data
import { CheckInAppointment, AvailableUnit, StaffTab, FlowStep, StaffUser } from './types';
import { INITIAL_APPOINTMENTS, INITIAL_AVAILABLE_UNITS } from './mockData';
import { handoversApi } from '../../lib/api/handovers';

// Import Sub-Components
import Sidebar from './components/Sidebar';
import CheckInQueue from './components/CheckInQueue';
import HandoverProcess from './components/HandoverProcess';
import HandoverSuccess from './components/HandoverSuccess';
import ContractModal from './components/ContractModal';
import PrintModal from './components/PrintModal';
import StaffLoginModal from './components/StaffLoginModal';

export default function StaffPortalPage() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<StaffTab>('queue');
  const [flowStep, setFlowStep] = useState<FlowStep>('queue');

  // Backend Connection & Auth State
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [usingLiveApi, setUsingLiveApi] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper hiển thị thông báo nhanh
  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Cuộc hẹn đang được xử lý
  const currentAppointment = useMemo(() => {
    return appointments.find(a => a.id === selectedAppointmentId) || appointments[0];
  }, [appointments, selectedAppointmentId]);

  // Đếm số lượng đơn đang chờ cho badge sidebar
  const pendingCount = useMemo(() => {
    return appointments.filter(a => a.status !== 'completed').length;
  }, [appointments]);

  // Hàm tải dữ liệu từ Backend API
  const loadBackendData = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const isOnline = await handoversApi.checkHealth();
      setIsBackendOnline(isOnline);

      if (isOnline) {
        // Lấy queue đơn đặt chỗ từ Backend API
        const queueRes = await handoversApi.fetchCheckInQueue();
        if (queueRes.items && queueRes.items.length > 0) {
          setAppointments(queueRes.items);
          setSelectedAppointmentId(queueRes.items[0].id);
          setUsingLiveApi(true);
        } else {
          // Backend trả về mảng rỗng -> giữ mock data hoặc hiển thị trống
          setUsingLiveApi(true);
        }

        // Lấy danh sách ô kho trống khả dụng từ Backend API
        const unitsRes = await handoversApi.fetchAvailableUnits();
        if (unitsRes && unitsRes.length > 0) {
          setAvailableUnits(unitsRes);
        }
      } else {
        setUsingLiveApi(false);
      }
    } catch (err: any) {
      setIsBackendOnline(false);
      setUsingLiveApi(false);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  // Khởi tạo kiểm tra kết nối & auth khi load trang
  useEffect(() => {
    const stored = handoversApi.getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
    loadBackendData();
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
    handleSelectAppointment(apt);

    // Cập nhật trạng thái sang in_progress
    setAppointments(prev => prev.map(item =>
      item.id === apt.id ? { ...item, status: 'in_progress' } : item
    ));
    setFlowStep('handover');
    triggerToast(`Đã bắt đầu làm thủ tục nhận kho cho: ${apt.customerName}`);

    // Nếu đơn có rawId từ backend, thử fetch thêm thông tin chi tiết
    if (apt.rawId && isBackendOnline) {
      try {
        const detail = await handoversApi.fetchReservationForCheckIn(apt.rawId);
        setAppointments(prev => prev.map(item => item.id === apt.id ? { ...item, ...detail } : item));
      } catch (err: any) {
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

        setAppointments(prev => prev.map(item => {
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
        }));

        // Cập nhật trạng thái ô kho thành occupied
        setAvailableUnits(prev => prev.map(u =>
          u.code === finalUnit ? { ...u, status: 'occupied' } : u
        ));

        setCustomPin(backendAccessCode);
        setFlowStep('success');
        triggerToast(`Bàn giao thành công ô kho ${finalUnit}! Mã HĐ: ${backendContractCode || 'Mới'}`);
        return;
      } catch (err: any) {
        triggerToast(`Lỗi gọi API Backend: ${err.message || 'Thất bại'}. Lưu vào dữ liệu tạm.`);
      } finally {
        setIsSubmittingCheckIn(false);
      }
    }

    // Fallback: Hoàn tất cục bộ (nếu backend offline hoặc dùng mock data)
    setAppointments(prev => prev.map(item => {
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
    }));

    setAvailableUnits(prev => prev.map(u =>
      u.code === finalUnit ? { ...u, status: 'occupied' } : u
    ));

    setFlowStep('success');
    triggerToast(`Bàn giao thành công ô kho ${finalUnit}!`);
  };

  // Action 3: In tài liệu tại quầy
  const handleExecuteNativePrint = () => {
    setIsPrintModalOpen(false);
    triggerToast('Đang gửi lệnh in Hợp đồng & Phiếu bàn giao tới Máy in quầy lễ tân #01...');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Logout handler
  const handleLogout = () => {
    handoversApi.logout();
    setCurrentUser(null);
    triggerToast('Đã đăng xuất tài khoản nhân viên');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans antialiased selection:bg-[#4f39f6]/20 selection:text-[#4f39f6]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-800 animate-slide-up-fade">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4f39f6] animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* 1. THANH ĐIỀU HƯỚNG BÊN (SIDEBAR) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'queue') setFlowStep('queue');
        }}
        pendingCount={pendingCount}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#4f39f6]/10 text-[#4f39f6]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {flowStep === 'queue' && 'Hàng đợi Nhận kho trong ngày'}
                {flowStep === 'handover' && 'Xác thực khách hàng & Thủ tục Bàn giao ô kho'}
                {flowStep === 'success' && 'Hoàn tất bàn giao kho'}
              </h1>
              <p className="text-xs text-slate-500">
                Hôm nay, 26 Tháng 09, 2026 • Mục tiêu: Bàn giao ô kho nhanh chóng, chính xác
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Staff Auth Button */}
            {!currentUser && (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-lg shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Đăng nhập Staff
              </button>
            )}

            {flowStep !== 'queue' && (
              <button
                onClick={() => setFlowStep('queue')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Về Hàng đợi
              </button>
            )}

            <div className="h-6 w-px bg-slate-200" />

            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-[#4f39f6] font-medium px-2 py-1"
            >
              Cổng Khách Hàng ↗
            </Link>
          </div>
        </header>

        {/* Dynamic Pages / Views */}
        <main className="flex-1 p-8">
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
                triggerToast(`Đã gửi SMS & Email mã khóa cho khách: ${currentAppointment.phone}`);
              }}
              onBackToQueue={() => setFlowStep('queue')}
            />
          )}

          {/* Các tab tác vụ phụ khác trên Sidebar */}
          {activeTab !== 'queue' && flowStep === 'queue' && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#4f39f6]/10 text-[#4f39f6] flex items-center justify-center mx-auto">
                {activeTab === 'dashboard' && <LayoutDashboard className="w-7 h-7" />}
                {activeTab === 'checkout' && <ArrowUpRight className="w-7 h-7" />}
                {activeTab === 'facility' && <MapPin className="w-7 h-7" />}
                {activeTab === 'support' && <LifeBuoy className="w-7 h-7" />}
                {activeTab === 'settings' && <Settings className="w-7 h-7" />}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === 'dashboard' && 'Bảng Điều Khiển Tổng Quan Cơ Sở'}
                {activeTab === 'checkout' && 'Quản Lý Trả Kho & Thanh Lý Hợp Đồng'}
                {activeTab === 'facility' && 'Sơ Đồ Mặt Bằng & Trạng Thái Ô Kho 24/7'}
                {activeTab === 'support' && 'Tiếp Nhận Hỗ Trợ & Xử Lý Sự Cố Khách Hàng'}
                {activeTab === 'settings' && 'Cài Đặt Cổng Nhân Viên Cơ Sở'}
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Bạn đang ở chế độ xem tác vụ phụ trợ. Vui lòng chuyển sang <strong>Hàng đợi nhận kho</strong> để tiếp tục thao tác Luồng 2 (Check-in & Handover).
              </p>
              <button
                onClick={() => { setActiveTab('queue'); setFlowStep('queue'); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-md shadow-[#4f39f6]/25 transition-all"
              >
                <Inbox className="w-4 h-4" />
                Vào Hàng đợi Nhận kho ngay
              </button>
            </div>
          )}
        </main>
      </div>

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
          triggerToast(`Đăng nhập thành công: ${user.fullName} (${user.role})`);
          loadBackendData();
        }}
      />
    </div>
  );
}
