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
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { useNotifications } from '@/lib/useNotifications';

// Import Types & Mock Data
import { CheckInAppointment, AvailableUnit, StaffTab, FlowStep, StaffUser } from './types';
import { handoversApi } from '../../lib/api/handovers';
import { renewalsApi } from '@/lib/api/renewals';
import { approvalRequestsService } from './services/approvalRequests';

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
import FacilityLayoutView from './components/FacilityLayoutView';
import StaffSupportTicketsView from './components/StaffSupportTicketsView';
import StaffRenewalsOverdueView from './components/StaffRenewalsOverdueView';
import StaffOverviewDashboard from './components/StaffOverviewDashboard';
import RentalPaymentModal from './components/RentalPaymentModal';

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
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const [rentalPaymentApt, setRentalPaymentApt] = useState<CheckInAppointment | null>(null);

  // Hook quản lý thông báo cho Staff
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(currentUser?.id);

  // Sync tab with URL query parameter (?tab=support, etc.)
  const syncTabFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as StaffTab | null;
    if (tabParam) {
      const validTabs: StaffTab[] = [
        'queue',
        'dashboard',
        'checkout',
        'facility',
        'support',
        'settings',
        'profile',
        'unit_types',
      ];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
        if (tabParam === 'queue') setFlowStep('queue');
      }
    }
  }, []);

  useEffect(() => {
    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    window.addEventListener('manager-tab-change', syncTabFromUrl);
    window.addEventListener('custom-tab-change', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
      window.removeEventListener('manager-tab-change', syncTabFromUrl);
      window.removeEventListener('custom-tab-change', syncTabFromUrl);
    };
  }, [syncTabFromUrl]);

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    setIsNotifOpen(false);

    const notifType = String(notif.type || '').toUpperCase();
    const entityType = String(notif.entityType || '').toUpperCase();
    const entityId = notif.entityId;
    const text = `${notif.title || ''} ${notif.body || ''}`.toLowerCase();

    let targetTab: StaffTab = 'dashboard';
    let extraQuery = '';

    if (
      notifType === 'SUPPORT' ||
      entityType === 'SUPPORT_REQUEST' ||
      text.includes('hỗ trợ') ||
      text.includes('sự cố') ||
      text.includes('khiếu nại')
    ) {
      targetTab = 'support';
      if (entityId) extraQuery = `&ticketId=${entityId}`;
    } else if (
      notifType === 'RENEWAL' ||
      notifType === 'OVERDUE' ||
      text.includes('gia hạn') ||
      text.includes('quá hạn')
    ) {
      targetTab = 'checkout';
    } else if (
      notifType === 'RESERVATION' ||
      notifType === 'HANDOVER' ||
      text.includes('nhận kho') ||
      text.includes('bàn giao') ||
      text.includes('đặt chỗ')
    ) {
      targetTab = 'queue';
      setFlowStep('queue');
    } else if (notifType === 'FACILITY' || text.includes('cơ sở') || text.includes('mặt bằng')) {
      targetTab = 'facility';
    } else {
      targetTab = 'queue';
      setFlowStep('queue');
    }

    setActiveTab(targetTab);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/staff?tab=${targetTab}${extraQuery}`);
      window.dispatchEvent(new Event('manager-tab-change'));
      window.dispatchEvent(new Event('custom-tab-change'));
    }
  };

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
  const loadBackendData = useCallback(async (showToast = false, facilityIdOverride?: string | number) => {
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
          const enhanced = queueRes.items.map((item) => approvalRequestsService.attachToAppointment(item));
          setAppointments(enhanced);
          setSelectedAppointmentId(enhanced[0].id);
          setUsingLiveApi(true);
          const facName = storedUser?.assignedFacility?.name || 'cơ sở';
          if (showToast) toast.success(`Đã cập nhật ${enhanced.length} đơn nhận kho của ${facName}.`);
        } else {
          setAppointments([]);
          setSelectedAppointmentId('');
          setUsingLiveApi(true);
          if (showToast) toast.info('Cơ sở hiện chưa có đơn nhận kho mới.');
        }

        // Lấy danh sách ô kho trống khả dụng của đúng cơ sở này
        const unitsRes = await handoversApi.fetchAvailableUnits(staffFacilityId);
        setAvailableUnits(unitsRes || []);

        // Lấy số lượng yêu cầu gia hạn đang chờ duyệt
        try {
          const renRes = await renewalsApi.getRenewals({
            facilityId: staffFacilityId ? String(staffFacilityId) : undefined,
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

  // Khởi tạo kiểm tra kết nối & auth khi load trang
  useEffect(() => {
    setIsMounted(true);
    const stored = handoversApi.getStoredUser();

    if (!stored) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?redirect=/staff');
      }
      return;
    }

    if (stored.role === 'STORAGE_CUSTOMER') {
      toast.error('Tài khoản Khách hàng không có quyền truy cập Cổng Nhân Viên.');
      if (typeof window !== 'undefined') {
        window.location.replace('/dashboard');
      }
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

  // Lắng nghe cập nhật phê duyệt từ localStorage (Cross-tab sync giữa Staff & Manager)
  useEffect(() => {
    const unsubscribe = approvalRequestsService.subscribe(() => {
      setAppointments((prev) =>
        prev.map((item) => approvalRequestsService.attachToAppointment(item))
      );
    });
    return () => unsubscribe();
  }, []);

  // Tắt dropdown thông báo khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  // Âm thanh chuông báo Web Audio API (không cần tải file mp3)
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12); // G6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Bỏ qua lỗi audio policy
    }
  };

  // Lắng nghe WebSocket thời gian thực (Đơn check-in mới, đặt cọc thành công, tự động làm mới hàng đợi)
  useEffect(() => {
    if (!currentUser) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') || localStorage.getItem('access_token')
        : null;
    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Staff connected to Real-Time WebSocket Gateway');
      if (currentUser.facilityId) {
        socket.emit('join_facility', String(currentUser.facilityId));
      }
    });

    const handleQueueUpdate = (data: any) => {
      console.log('⚡ Received real-time queue update event:', data);
      playNotificationChime();
      toast.info(data?.title || 'Hàng đợi Check-in vừa cập nhật!', {
        description: data?.body || 'Dữ liệu hàng đợi đã được tự động làm mới.',
        duration: 4500,
      });
      // Tự động reload danh sách hàng đợi thời gian thực mà không cần F5
      loadBackendData(false, currentUser.facilityId);
    };

    socket.on('checkin_queue_updated', handleQueueUpdate);
    socket.on('facility_event', handleQueueUpdate);
    socket.on('notification', (notif: any) => {
      playNotificationChime();
      if (notif.type === 'RESERVATION' || notif.type === 'PAYMENT' || notif.type === 'HANDOVER') {
        loadBackendData(false, currentUser.facilityId);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, loadBackendData]);

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

  // Action: Dời lịch hẹn khi khách trễ hoặc bận (Reschedule)
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

      // Cập nhật local appointment state
      const dateObj = new Date(newDateIso);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const startDateStr = `${day}/${month}/${year}`;

      const now = new Date();
      let dateDisplay = `${day}/${month}/${year}`;
      if (dateObj.toDateString() === now.toDateString()) {
        dateDisplay = 'Hôm nay';
      } else {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        if (dateObj.toDateString() === tom.toDateString()) {
          dateDisplay = `Ngày mai (${day}/${month})`;
        }
      }

      const hour = dateObj.getHours();
      const timeCategory: 'morning' | 'afternoon' = hour < 12 ? 'morning' : 'afternoon';

      setAppointments((prev) =>
        prev.map((item) =>
          item.id === apt.id
            ? {
                ...item,
                status: 'confirmed',
                appointmentDateRaw: newDateIso,
                slotTime: newSlotTime,
                startDate: startDateStr,
                dateDisplay,
                timeCategory,
                specialNotes: notes ? `Dời hẹn: ${notes}` : item.specialNotes,
              }
            : item
        )
      );

      toast.success(
        `Đã dời lịch hẹn của khách ${apt.customerName} sang ${dateDisplay} (${newSlotTime}) thành công!`
      );
    } catch (err: any) {
      console.error('Error rescheduling appointment:', err);
      toast.error(err?.message || 'Không thể dời lịch hẹn. Vui lòng thử lại.');
      throw err;
    }
  };

  // Action: Nhân viên (Staff) gửi yêu cầu xin mở lại đơn quá hạn tới Quản lý cơ sở
  const handleRequestApproval = async (apt: CheckInAppointment, reason: string) => {
    const staffName = currentUser?.fullName || 'Nhân viên lễ tân';
    const record = approvalRequestsService.submitRequest(apt, staffName, reason);

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === apt.id
          ? {
              ...item,
              managerApprovalStatus: 'pending',
              managerApprovalRequestedBy: record.requestedBy,
              managerApprovalRequestedAt: record.requestedAt,
              managerApprovalRequestReason: record.reason,
              managerApprovalFacilityName: record.facilityName,
            }
          : item
      )
    );

    const facilityDisplay = apt.facilityName || currentUser?.assignedFacility?.name || 'cơ sở';
    toast.success(
      `Đã gửi yêu cầu xin mở lại đơn ${apt.id} tới Quản lý cơ sở (${facilityDisplay}) thành công. Vui lòng chờ Quản lý phê duyệt!`
    );
  };

  // Action: Quản lý phê duyệt mở lại đơn quá hạn (> 24 giờ) - Hiệu lực cố định đến hết ngày hôm nay (23:59)
  const handleManagerReopen = async (
    apt: CheckInAppointment,
    reason: string,
    managerName: string
  ) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const nowTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Hạn hiệu lực cố định: hết ngày hôm nay (23:59:59)
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const expiryIso = endOfDay.toISOString();

    // Lưu vào Service để đồng bộ
    approvalRequestsService.approveRequest(apt.id, managerName, reason, expiryIso);

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === apt.id
          ? {
              ...item,
              status: 'confirmed',
              appointmentDateRaw: nowIso,
              slotTime: `${nowTime} (Đã duyệt)`,
              dateDisplay: 'Hôm nay',
              timeCategory: now.getHours() < 12 ? 'morning' : 'afternoon',
              managerApprovalStatus: 'approved',
              managerApprovedAt: nowIso,
              managerApprovedExpiry: expiryIso,
              managerApproverName: managerName,
              managerApprovalReason: reason,
              isApprovalExpired: false,
              unitAutoReleased: false,
              specialNotes: item.specialNotes
                ? `${item.specialNotes} | [Quản lý duyệt mở lại - Hạn hết ngày]: ${reason} (Duyệt: ${managerName})`
                : `[Quản lý duyệt mở lại - Hạn hết ngày]: ${reason} (Duyệt: ${managerName})`,
            }
          : item
      )
    );

    toast.success(
      `Đã phê duyệt mở lại đơn ${apt.id} (hiệu lực đến hết hôm nay 23:59)! Ô kho ${apt.assignedUnit} sẽ tự động giải phóng nếu không nhận trong ngày.`
    );
  };

  // Action: Quản lý từ chối mở lại đơn quá hạn
  const handleManagerReject = async (apt: CheckInAppointment, reason: string) => {
    const managerName = currentUser?.fullName || 'Quản lý cơ sở';
    approvalRequestsService.rejectRequest(apt.id, managerName, reason);

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === apt.id
          ? {
              ...item,
              managerApprovalStatus: 'rejected',
              managerApprovalRejectReason: reason,
              managerApproverName: managerName,
            }
          : item
      )
    );

    toast.info(`Quản lý đã từ chối yêu cầu mở lại đơn ${apt.id}.`);
  };

  // Tự động kiểm tra các đơn đã được duyệt mở lại nhưng hết hạn cuối ngày (sau 23:59) -> Tự động giải phóng ô kho
  useEffect(() => {
    const now = new Date();
    const releasedUnitCodes: string[] = [];

    setAppointments((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (
          item.managerApprovedExpiry &&
          item.status !== 'completed' &&
          item.status !== 'cancelled' &&
          !item.isApprovalExpired
        ) {
          const expiryDate = new Date(item.managerApprovedExpiry);
          if (now > expiryDate) {
            changed = true;
            releasedUnitCodes.push(item.assignedUnit);
            return {
              ...item,
              status: 'expired' as const,
              isApprovalExpired: true,
              unitAutoReleased: true,
              cancelReason: 'Hết hạn phê duyệt cuối ngày (Quá hạn 23:59) - Hệ thống đã tự động giải phóng ô kho',
            };
          }
        }
        return item;
      });
      return changed ? next : prev;
    });

    if (releasedUnitCodes.length > 0) {
      // Đưa các ô kho đã quá hạn duyệt về lại trạng thái Khả dụng (Vacant)
      setAvailableUnits((prevUnits) =>
        prevUnits.map((u) =>
          releasedUnitCodes.includes(u.code) ? { ...u, status: 'vacant' } : u
        )
      );
      toast.warning(
        `Đã tự động giải phóng ${releasedUnitCodes.length} ô kho (${releasedUnitCodes.join(', ')}) do đơn mở lại hết hạn cuối ngày!`
      );
    }
  }, [appointments.length]);

  // Action: Báo vắng mặt / Hủy giữ chỗ và giải phóng ô kho (No-show / Cancel)
  const handleCancelOrNoShow = async (
    apt: CheckInAppointment,
    reason: string,
    depositHandling: 'forfeit' = 'forfeit'
  ) => {
    try {
      if (isBackendOnline && apt.rawId) {
        await handoversApi.cancelReservation(apt.rawId, reason);
      }

      // Cập nhật trạng thái sang cancelled & giải phóng ô kho
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

      // Giải phóng ô kho trên danh sách khả dụng
      setAvailableUnits((prev) =>
        prev.map((u) => (u.code === apt.assignedUnit ? { ...u, status: 'vacant' } : u))
      );

      toast.success(
        `Đã hủy lịch hẹn ${apt.id}, khấu trừ 100% cọc về hệ thống và giải phóng ô kho ${apt.assignedUnit} về trạng thái Khả dụng!`
      );
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      toast.error(err?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại.');
      throw err;
    }
  };

  // Action 2: [ Hoàn tất bàn giao ]
  const handleCompleteHandover = async (
    photos?: string[],
    identityData?: {
      identityNumber?: string;
      identityType?: string;
      isIdentityVerified?: boolean;
      identityAddress?: string;
      identityFrontUrl?: string;
      identityBackUrl?: string;
    },
  ) => {
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
          photos: photos || [],
          identityNumber: identityData?.identityNumber,
          identityType: identityData?.identityType,
          identityAddress: identityData?.identityAddress,
          identityFrontUrl: identityData?.identityFrontUrl,
          identityBackUrl: identityData?.identityBackUrl,
          isIdentityVerified: identityData?.isIdentityVerified,
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

  // Logout handler: dọn dẹp sạch phiên làm việc và chuyển ngay sang trang đăng nhập
  const handleLogout = async () => {
    try {
      await handoversApi.logout();
    } catch (err) {
      console.warn('Staff logout notice:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        sessionStorage.clear();
      }
      setCurrentUser(null);
      toast.success('Đã đăng xuất tài khoản thành công');
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
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

  // Chờ hydration và kiểm tra phiên đăng nhập: giữ giao diện đồng nhất SSR/CSR
  if (!isMounted || !currentUser) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  return (
    <div className="h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased overflow-hidden selection:bg-blue-600/20 selection:text-blue-600">
      
      {/* 1. TOP HEADER (Fixed Full-Width Header Matching /dashboard) */}
      <header className="h-18 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-40 shadow-2xs">
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
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50/70 border border-blue-200 text-blue-900">
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

          {/* Notification Bell with Badge & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2.5 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Thông báo vận hành"
              aria-label="Thông báo vận hành"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-84 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-slide-up-fade">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thông Báo Vận Hành ({unreadCount})</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Chưa có thông báo nào
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 hover:border-blue-300 hover:shadow-xs group ${
                          notif.isRead
                            ? 'bg-slate-50/60 border-slate-100 opacity-75'
                            : 'bg-blue-50/50 border-blue-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 text-[11px]">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleDateString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                          {notif.body}
                        </p>
                        <div className="flex items-center justify-end pt-0.5">
                          <span className="text-[10px] font-semibold text-blue-600 group-hover:underline flex items-center gap-0.5">
                            <span>Xem chi tiết</span>
                            <span>&rarr;</span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Staff Sidebar (Light YouTube Style matching /dashboard) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'queue') setFlowStep('queue');
            setIsMobileSidebarOpen(false);
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

            {/* Manager Switcher Notice (nếu tài khoản là Quản lý đang vào quầy Staff) */}
            {currentUser && ['FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN'].includes((currentUser.role || '').toUpperCase()) && (
              <div className="mb-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl border border-indigo-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 text-indigo-950 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-indigo-900">Tài khoản Quản lý:</span> Bạn đang xem <strong>Giao diện Quầy Tiếp Đón Nhân Viên</strong>. Để phân công ca trực, thiết lập loại kho và duyệt bảng giá, vui lòng chuyển sang Cổng Quản Lý.
                  </div>
                </div>
                <Link
                  href="/manager"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shrink-0 self-start sm:self-auto shadow-2xs"
                >
                  <span>Mở Cổng Quản Lý Cơ Sở</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            )}
            
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
                onReschedule={handleReschedule}
                onCancelOrNoShow={handleCancelOrNoShow}
                onManagerReopen={handleManagerReopen}
                onRequestApproval={handleRequestApproval}
                onManagerReject={handleManagerReject}
                currentUser={currentUser}
                onOpenRentalPayment={(apt) => setRentalPaymentApt(apt)}
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
                onOpenRentalPayment={() => setRentalPaymentApt(currentAppointment)}
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
                onOpenRentalPayment={() => setRentalPaymentApt(currentAppointment)}
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
                currentFacilityId={currentUser?.facilityId || currentUser?.assignedFacility?.id}
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

            {/* TAB BẢNG ĐIỀU KHIỂN TỔNG QUAN */}
            {activeTab === 'dashboard' && flowStep === 'queue' && (
              <StaffOverviewDashboard
                facilityName={currentUser?.assignedFacility?.name || 'Chi nhánh Landmark 81'}
                onNavigateTab={(t) => {
                  setActiveTab(t);
                  setFlowStep('queue');
                }}
                pendingCheckInsCount={pendingCount}
              />
            )}

            {/* TAB SƠ ĐỒ MẶT BẰNG & TRẠNG THÁI Ô KHO 24/7 (FLOW 5) */}
            {activeTab === 'facility' && flowStep === 'queue' && (
              <FacilityLayoutView 
                facilityId={currentUser?.facilityId || currentUser?.assignedFacility?.id || ''} 
                userRole={currentUser?.role}
              />
            )}

            {/* TAB GIA HẠN HỢP ĐỒNG & XỬ LÝ QUÁ HẠN (FLOW 6) */}
            {activeTab === 'checkout' && flowStep === 'queue' && (
              <StaffRenewalsOverdueView facilityId={currentUser?.facilityId || currentUser?.assignedFacility?.id || ''} />
            )}

            {/* TAB TIẾP NHẬN HỖ TRỢ & XỬ LÝ SỰ CỐ (FLOW 7) */}
            {activeTab === 'support' && flowStep === 'queue' && (
              <StaffSupportTicketsView facilityId={currentUser?.facilityId || currentUser?.assignedFacility?.id || ''} />
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

      {/* MODAL 4: TẠO ĐƠN & THU TIỀN THUÊ KHO CHO KHÁCH (VIETQR / TIỀN MẶT) */}
      <RentalPaymentModal
        isOpen={!!rentalPaymentApt}
        onClose={() => setRentalPaymentApt(null)}
        appointment={rentalPaymentApt}
        onPaymentSuccess={(summary, paymentCode) => {
          if (rentalPaymentApt) {
            setAppointments((prev) =>
              prev.map((item) =>
                item.id === rentalPaymentApt.id
                  ? {
                      ...item,
                      rentalStatus: 'paid',
                      specialNotes: paymentCode
                        ? `Đã thanh toán tiền thuê (${paymentCode})`
                        : item.specialNotes,
                    }
                  : item
              )
            );
            toast.success(
              `Đã xác nhận thu tiền thuê cho đơn ${rentalPaymentApt.id} của khách ${rentalPaymentApt.customerName}!`
            );
          }
        }}
      />
    </div>
  );
}
