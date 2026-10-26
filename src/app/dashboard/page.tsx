'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  KeyRound,
  FileText,
  Headphones,
  User,
  ShieldCheck,
  Boxes,
  Sparkles,
  RefreshCw,
  LogIn,
  LogOut,
  Wifi,
  Home,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// Types & API
import { CustomerUnit, CustomerTab, GuestPass, SupportTicket, CustomerUser } from './types';
import { customerUnitsApi } from '@/lib/api/customerUnits';
import { renewalsApi } from '@/lib/api/renewals';

// Modular Components
import CustomerSidebar from './components/CustomerSidebar';
import MyUnitsGrid from './components/MyUnitsGrid';
import UnitDetailsView from './components/UnitDetailsView';
import GuestPassModal from './components/GuestPassModal';
import ExtendLeaseModal from './components/ExtendLeaseModal';
import UpgradeModal from './components/UpgradeModal';
import IncidentReportModal from './components/IncidentReportModal';
import ReturnUnitModal from './components/ReturnUnitModal';
import CustomerLoginModal from './components/CustomerLoginModal';
import CustomerProfileView from './components/CustomerProfileView';
import CustomerSupportView from './components/CustomerSupportView';
import CustomerAccessView from './components/CustomerAccessView';
import CustomerDocumentsView from './components/CustomerDocumentsView';
import CustomerBillingView from './components/CustomerBillingView';

export default function CustomerDashboardPage() {
  // Navigation & Sub-views State
  const [activeTab, setActiveTab] = useState<CustomerTab>('my_units');
  const [viewMode, setViewMode] = useState<'grid' | 'details'>('grid');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  };

  // Customer Units State
  const [units, setUnits] = useState<CustomerUnit[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  // Backend & Auth State
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals State
  const [activeModalUnit, setActiveModalUnit] = useState<CustomerUnit | null>(null);
  const [isGuestPassModalOpen, setIsGuestPassModalOpen] = useState(false);
  const [isExtendLeaseModalOpen, setIsExtendLeaseModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isReturnUnitModalOpen, setIsReturnUnitModalOpen] = useState(false);
  const [cancelReservationId, setCancelReservationId] = useState<number | null>(null);
  const [isCancellingReservation, setIsCancellingReservation] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    toast(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Main data loader function
  const loadContractsData = useCallback(async (showToast = false) => {
    setLoading(true);
    setIsRefreshing(true);

    try {
      const isOnline = await customerUnitsApi.checkHealth();
      setIsBackendOnline(isOnline);

      if (!isOnline) {
        setUnits([]);
        setSelectedUnitId('');
        setReservations([]);
        setIsLiveApi(false);
        if (showToast) triggerToast('Không thể kết nối đến máy chủ.');
        return;
      }

      // Backend is online: attempt to fetch real contracts and reservations
      try {
        const [contractsRes, reservationsRes] = await Promise.allSettled([
          customerUnitsApi.fetchMyContracts(),
          customerUnitsApi.fetchMyReservations(),
        ]);

        const liveUnits = contractsRes.status === 'fulfilled' ? contractsRes.value : [];
        const rawReservations = reservationsRes.status === 'fulfilled' ? reservationsRes.value : [];
        setReservations(rawReservations);

        if (liveUnits && liveUnits.length > 0) {
          // Also fetch payment history, support tickets, and pending renewals
          const [payments, tickets, renewalsRes] = await Promise.allSettled([
            customerUnitsApi.fetchPayments(),
            customerUnitsApi.fetchSupportRequests(),
            renewalsApi.getRenewals({ status: 'PENDING' }),
          ]);

          const realPayments = payments.status === 'fulfilled' ? payments.value : [];
          const realTickets = tickets.status === 'fulfilled' ? tickets.value : [];
          const pendingRenewalsRaw = renewalsRes.status === 'fulfilled' ? renewalsRes.value : [];
          const pendingRenewals = Array.isArray(pendingRenewalsRaw)
            ? pendingRenewalsRaw
            : (pendingRenewalsRaw as any)?.data || [];

          // Attach payments, tickets, and check pending renewals
          const enrichedUnits = liveUnits.map((u, idx) => {
            const hasPendingRen = pendingRenewals.some(
              (r: any) =>
                (String(r.contractId) === String(u.rawContractId) ||
                  String(r.contract?.id) === String(u.rawContractId)) &&
                r.status === 'PENDING'
            );

            const isCheckingOut = u.status === 'checkout_pending' || Boolean(u.checkoutRequest);

            // Thủ tục Trả kho (Checkout) luôn được ưu tiên cao nhất, hủy bỏ/ghi đè trạng thái chờ duyệt gia hạn
            const finalStatus = isCheckingOut ? 'checkout_pending' : u.status;
            const finalStatusLabel = isCheckingOut
              ? 'Đang xử lý trả kho'
              : hasPendingRen
              ? 'Chờ duyệt gia hạn'
              : u.statusLabel;

            return {
              ...u,
              status: finalStatus,
              statusLabel: finalStatusLabel,
              hasPendingRenewal: hasPendingRen,
              paymentHistory: idx === 0 ? realPayments : [],
              supportTickets: realTickets.filter((t) => t.unitCode.includes(u.unitNumber) || idx === 0),
            };
          });

          setUnits(enrichedUnits);
          setSelectedUnitId(enrichedUnits[0].id);
          setIsLiveApi(true);
          if (showToast) triggerToast(`Đã đồng bộ ${enrichedUnits.length} ô kho thành công.`);
        } else {
          // No active contracts returned: show real empty state
          setUnits([]);
          setSelectedUnitId('');
          setIsLiveApi(true);
          if (showToast) triggerToast('Đã đồng bộ dữ liệu ô kho.');
        }
      } catch (err: any) {
        console.warn('Could not fetch contracts (likely unauthenticated or 401):', err);
        setUnits([]);
        setSelectedUnitId('');
        setIsLiveApi(false);
        if (showToast) triggerToast('Đã làm mới dữ liệu ô kho.');
      }
    } catch (err) {
      console.error('Fatal load contracts error:', err);
      setUnits([]);
      setSelectedUnitId('');
      setIsLiveApi(false);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // On initial mount: restore stored user and load contracts
  useEffect(() => {
    const storedUser = customerUnitsApi.getStoredCustomer();
    if (storedUser) {
      setCustomerUser(storedUser);
    }
    loadContractsData();

    // Check for query param tab (e.g. /dashboard?tab=profile)
    const checkTabQuery = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab') as CustomerTab;
        if (tabParam && ['my_units', 'billing', 'access', 'documents', 'support', 'profile'].includes(tabParam)) {
          setActiveTab(tabParam);
        }
      }
    };
    checkTabQuery();
    window.addEventListener('popstate', checkTabQuery);
    window.addEventListener('custom-tab-change', checkTabQuery);
    return () => {
      window.removeEventListener('popstate', checkTabQuery);
      window.removeEventListener('custom-tab-change', checkTabQuery);
    };
  }, [loadContractsData]);

  // Handle Login success
  const handleLoginSuccess = (user: CustomerUser) => {
    setCustomerUser(user);
    triggerToast(`Đăng nhập thành công! Xin chào ${user.fullName || user.email}`);
    loadContractsData(true);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await customerUnitsApi.logout();
    } catch (e) {
      console.warn('Customer logout notice:', e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('customer_user');
        sessionStorage.clear();
      }
      setCustomerUser(null);
      triggerToast('Đã đăng xuất khỏi tài khoản thành công.');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  // Ô kho đang được chọn xem chi tiết (Trang B)
  const selectedUnit = useMemo(() => {
    return units.find(u => u.id === selectedUnitId) || units[0];
  }, [units, selectedUnitId]);

  // Ô kho đang thao tác modal
  const targetModalUnit = activeModalUnit || selectedUnit;

  // Handler: Xem chi tiết -> Trang B
  const handleSelectUnit = (unit: CustomerUnit) => {
    setSelectedUnitId(unit.id);
    setViewMode('details');
  };

  // Handler: Mở Modal Tạo mã khách
  const handleOpenGuestPass = (unit: CustomerUnit) => {
    setActiveModalUnit(unit);
    setIsGuestPassModalOpen(true);
  };

  // Handler: Mở Modal Gia hạn hợp đồng
  const handleOpenExtendLease = (unit: CustomerUnit) => {
    setActiveModalUnit(unit);
    setIsExtendLeaseModalOpen(true);
  };

  // Handler: Mở Modal Nâng/Hạ cấp ô kho
  const handleOpenUpgrade = (unit: CustomerUnit) => {
    setActiveModalUnit(unit);
    setIsUpgradeModalOpen(true);
  };

  // Handler: Mở Modal Báo cáo sự cố
  const handleOpenReportIncident = (unit: CustomerUnit) => {
    setActiveModalUnit(unit);
    setIsIncidentModalOpen(true);
  };

  // Handler: Mở Modal Xác nhận hủy đơn đặt giữ chỗ
  const handleCancelReservation = (resId: number) => {
    setCancelReservationId(resId);
  };

  // Handler: Xác nhận hủy đơn qua API
  const handleConfirmCancelReservation = async () => {
    if (!cancelReservationId) return;
    setIsCancellingReservation(true);
    try {
      await customerUnitsApi.cancelReservation(cancelReservationId, 'Khách hàng hủy trên Cổng khách hàng');
      toast.success('Đã hủy đơn đặt giữ chỗ thành công.');
      setCancelReservationId(null);
      await loadContractsData(false);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể hủy đơn đặt chỗ.');
    } finally {
      setIsCancellingReservation(false);
    }
  };

  // Callback: Thêm mã khách thành công
  const handleCreatedGuestPass = (newPass: GuestPass) => {
    setUnits(prev => prev.map(u => {
      if (u.id === targetModalUnit?.id) {
        return {
          ...u,
          guestPasses: [newPass, ...u.guestPasses],
        };
      }
      return u;
    }));
    triggerToast(`Đã tạo mã khách ${newPass.pin} thành công cho ${newPass.guestName}!`);
  };

  // Callback: Gia hạn hợp đồng & gửi yêu cầu đến nhân viên
  const handleConfirmExtend = async (
    months: number,
    newTotal: string,
    paymentMethod: string = 'vnpay',
    _rawAmount?: number
  ) => {
    try {
      if (targetModalUnit?.rawContractId) {
        await renewalsApi.requestRenewal({
          contractId: String(targetModalUnit.rawContractId),
          months,
          notes: `Khách hàng gửi yêu cầu gia hạn ${months} tháng (${newTotal}) qua phương thức ${paymentMethod.toUpperCase()}`,
        });
      }

      // Cập nhật trạng thái ô kho sang chờ duyệt gia hạn
      setUnits(prev => prev.map(u => {
        if (u.id === targetModalUnit?.id) {
          return {
            ...u,
            statusLabel: `Chờ duyệt gia hạn (+${months}T)`,
          };
        }
        return u;
      }));

      triggerToast(`Đã gửi yêu cầu gia hạn thêm ${months} tháng (${newTotal})! Vui lòng chờ nhân viên cơ sở phê duyệt.`);

      // Tải lại dữ liệu hợp đồng & cập nhật danh sách
      loadContractsData(false);
    } catch (err: any) {
      console.error('Lỗi khi gửi yêu cầu gia hạn:', err);
      triggerToast(err?.message || 'Không thể gửi yêu cầu gia hạn. Vui lòng thử lại sau.');
    }
  };

  // Callback: Gửi yêu cầu nâng cấp/hạ cấp thành công
  const handleConfirmUpgrade = (targetType: string) => {
    triggerToast(`Đã gửi yêu cầu chuyển sang "${targetType}" cho Ban Quản Lý!`);
  };

  // Callback: Gửi báo cáo sự cố thành công
  const handleSubmittedTicket = (newTicket: SupportTicket) => {
    setUnits(prev => prev.map(u => {
      if (u.id === targetModalUnit?.id) {
        return {
          ...u,
          supportTickets: [newTicket, ...u.supportTickets],
        };
      }
      return u;
    }));
    triggerToast(`Đã gửi phiếu hỗ trợ #${newTicket.id} cho ${targetModalUnit?.unitNumber}!`);
  };

  // Handler: Mở Modal Trả kho & Thanh lý hợp đồng
  const handleOpenReturnUnit = (unit: CustomerUnit) => {
    setActiveModalUnit(unit);
    setIsReturnUnitModalOpen(true);
  };

  // Callback: Xác nhận gửi yêu cầu trả kho
  const handleConfirmCheckout = async (payload: any) => {
    try {
      // 1. Nếu kho đang có yêu cầu gia hạn chờ duyệt, tự động hủy bỏ yêu cầu gia hạn để ưu tiên trả kho
      try {
        const renewalsRaw: any = await renewalsApi.getRenewals({ status: 'PENDING' }).catch(() => null);
        const list = Array.isArray(renewalsRaw) ? renewalsRaw : renewalsRaw?.data || [];
        const matchedRen = list.find(
          (r: any) => String(r.contractId) === String(payload.contractId) || String(r.contract?.id) === String(payload.contractId)
        );
        if (matchedRen?.id) {
          await renewalsApi.cancelRenewal(matchedRen.id).catch(() => {});
        }
      } catch (errRen) {
        console.warn('Could not auto-cancel pending renewal during checkout', errRen);
      }

      // 2. Gửi yêu cầu trả kho
      await customerUnitsApi.requestCheckout(payload);

      // 3. Cập nhật giao diện lập tức sang trạng thái Đang xử lý trả kho
      setUnits((prev) =>
        prev.map((u) => {
          if (String(u.rawContractId) === String(payload.contractId) || u.contractId === payload.contractCode) {
            return {
              ...u,
              status: 'checkout_pending',
              statusLabel: 'Đang xử lý trả kho',
              hasPendingRenewal: false,
              checkoutRequest: {
                ...payload,
                status: 'PENDING',
                statusLabel: 'Chờ nhân viên nghiệm thu ô kho',
              },
            };
          }
          return u;
        })
      );

      triggerToast(`Đã gửi yêu cầu trả kho cho ${payload.unitNumber}! Nhân viên cơ sở sẽ kiểm tra và liên hệ nghiệm thu.`);
      await loadContractsData(false);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi yêu cầu trả kho. Vui lòng thử lại.');
    }
  };

  // Callback: Hủy yêu cầu trả kho
  const handleCancelCheckoutRequest = async (unit: CustomerUnit) => {
    try {
      await customerUnitsApi.cancelCheckout(unit.rawContractId || unit.contractId);
      triggerToast(`Đã hủy yêu cầu trả kho cho ${unit.unitNumber}. Hợp đồng tiếp tục hoạt động bình thường.`);
      await loadContractsData(false);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể hủy yêu cầu trả kho.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600/20 selection:text-blue-600">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-800 animate-slide-up-fade">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 text-base">×</button>
        </div>
      )}

      {/* 1. TOP NAVBAR (YOUTUBE STYLE) - FULL WIDTH FIXED TOP */}
      <header className="fixed top-0 inset-x-0 h-18 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between shadow-2xs pr-4 sm:pr-6">
        <div className="flex items-center">
          {/* Nút Đóng / Mở Hamburger Menu căn chuẩn x=36px thẳng hàng tuyệt đối với các icon bên dưới */}
          <div className="w-[72px] h-18 flex items-center justify-center shrink-0">
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
              title="Mở / Thu gọn thanh điều hướng"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Logo hệ thống to rõ, nổi bật chuẩn nhận diện thương hiệu */}
          <Link href="/" className="inline-flex items-center group py-1 pl-1" title="Về trang chủ SelfStorage">
            <img
              src="/logo.png"
              alt="SelfStorage Logo"
              className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-102"
            />
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/20 transition-all uppercase tracking-wider active:scale-95"
          >
            <span>+ Thuê Thêm Kho</span>
          </Link>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Customer User Info / Login Modal Trigger */}
          {customerUser ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 text-left hover:opacity-85 transition cursor-pointer"
                title="Xem hồ sơ cá nhân"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs tracking-wider">
                  {customerUser.fullName ? customerUser.fullName.slice(0, 2).toUpperCase() : 'KH'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {customerUser.fullName || customerUser.email}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Khách thuê kho</div>
                </div>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-9 h-9 rounded-full hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                title="Đăng xuất"
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
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT (Starts below top header) */}
      <div className="flex pt-18 min-h-screen">
        {/* Customer Sidebar (YouTube Style) */}
        <CustomerSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'my_units') setViewMode('grid');
            setIsMobileSidebarOpen(false);
          }}
          activeUnitCount={units.length}
          customerUser={customerUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          isOpen={isMobileSidebarOpen}
          onToggle={handleToggleSidebar}
        />

        {/* Mobile Backdrop Overlay khi mở thanh điều hướng trên màn hình nhỏ */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* 3. KHU VỰC NỘI DUNG CHÍNH (MAIN VIEW) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* LUỒNG 3: Ô KHO CỦA TÔI */}
          {activeTab === 'my_units' && (
            <>
              {/* Loading skeleton */}
              {loading && (
                <div className="w-full max-w-[1800px] mx-auto space-y-4 animate-pulse">
                  <div className="h-8 w-48 bg-slate-200 rounded-xl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                        <div className="h-8 bg-slate-200 rounded-xl mt-4" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANG A: BẢNG ĐIỀU KHIỂN "Ô KHO CỦA TÔI" (GRID) */}
              {!loading && viewMode === 'grid' && (
                <MyUnitsGrid
                  units={units}
                  reservations={reservations}
                  customerUser={customerUser}
                  onSelectUnit={handleSelectUnit}
                  onOpenGuestPass={handleOpenGuestPass}
                  onOpenExtendLease={handleOpenExtendLease}
                  onOpenReportIncident={handleOpenReportIncident}
                  onOpenReturnUnit={handleOpenReturnUnit}
                  onCancelCheckoutRequest={handleCancelCheckoutRequest}
                  onCancelReservation={handleCancelReservation}
                />
              )}

              {/* TRANG B: CHI TIẾT & QUẢN LÝ Ô KHO (DEEP-DIVE TABS) */}
              {viewMode === 'details' && (
                <UnitDetailsView
                  unit={selectedUnit}
                  onBack={() => setViewMode('grid')}
                  onOpenGuestPass={handleOpenGuestPass}
                  onOpenExtendLease={handleOpenExtendLease}
                  onOpenUpgradeUnit={handleOpenUpgrade}
                  onOpenReportIncident={handleOpenReportIncident}
                  onOpenReturnUnit={handleOpenReturnUnit}
                  onCancelCheckoutRequest={handleCancelCheckoutRequest}
                />
              )}
            </>
          )}

          {/* TAB HỒ SƠ & THÔNG TIN CÁ NHÂN */}
          {activeTab === 'profile' && (
            <CustomerProfileView
              customerUser={customerUser}
              onUserUpdated={(u) => setCustomerUser(u)}
            />
          )}

          {/* TAB TRUY CẬP & KHÓA THÔNG MINH SMART LOCK (FLOW 3) */}
          {activeTab === 'access' && (
            <CustomerAccessView
              units={units}
              selectedUnit={selectedUnit}
              onSelectUnit={(u) => setSelectedUnitId(u.id)}
              onOpenGuestPassModal={() => {
                setActiveModalUnit(selectedUnit || units[0]);
                setIsGuestPassModalOpen(true);
              }}
            />
          )}

          {/* TAB HỢP ĐỒNG & KÝ SỐ ĐIỆN TỬ (FLOW 3) */}
          {activeTab === 'documents' && (
            <CustomerDocumentsView
              units={units}
              customerUser={customerUser}
              onRefresh={() => loadContractsData(false)}
            />
          )}

          {/* TAB THANH TOÁN & HÓA ĐƠN (FLOW 4) */}
          {activeTab === 'billing' && (
            <CustomerBillingView units={units} />
          )}

          {/* TAB TRUNG TÂM HỖ TRỢ & TIẾP NHẬN SỰ CỐ (FLOW 7) */}
          {activeTab === 'support' && (
            <CustomerSupportView
              units={units}
              onOpenReportIncident={() => handleOpenReportIncident(selectedUnit || units[0])}
            />
          )}
        </main>
      </div>
    </div>

      {/* ========================================================================= */}
      {/* MODALS TƯƠNG TÁC CHÍNH CỦA LUỒNG 3 */}
      {/* ========================================================================= */}
      {targetModalUnit && (
        <>
          {/* 1. Modal [ Tạo mã cho khách tạm thời ] */}
          <GuestPassModal
            isOpen={isGuestPassModalOpen}
            onClose={() => setIsGuestPassModalOpen(false)}
            unit={targetModalUnit}
            onCreatedPass={handleCreatedGuestPass}
          />

          {/* 2. Modal [ Gia hạn hợp đồng ] */}
          <ExtendLeaseModal
            isOpen={isExtendLeaseModalOpen}
            onClose={() => setIsExtendLeaseModalOpen(false)}
            unit={targetModalUnit}
            onConfirmExtend={handleConfirmExtend}
          />

          {/* 3. Modal [ Nâng cấp/Hạ cấp ô kho ] */}
          <UpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            unit={targetModalUnit}
            onConfirmRequest={handleConfirmUpgrade}
          />

          {/* 4. Modal [ Báo cáo sự cố ] */}
          <IncidentReportModal
            isOpen={isIncidentModalOpen}
            onClose={() => setIsIncidentModalOpen(false)}
            unit={targetModalUnit}
            onSubmitTicket={handleSubmittedTicket}
          />

          {/* 5. Modal [ Trả kho & Thanh lý hợp đồng ] */}
          <ReturnUnitModal
            isOpen={isReturnUnitModalOpen}
            onClose={() => setIsReturnUnitModalOpen(false)}
            unit={targetModalUnit}
            onConfirmCheckout={handleConfirmCheckout}
            onCancelCheckout={handleCancelCheckoutRequest}
          />
        </>
      )}

      {/* 5. Modal [ Đăng nhập Khách hàng JWT ] */}
      <CustomerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 6. Modal [ Xác nhận hủy đơn đặt chỗ (Thay thế window.confirm) ] */}
      {cancelReservationId !== null && (() => {
        const targetRes = reservations.find((r) => r.id === cancelReservationId);
        const item = targetRes?.items?.[0];
        const depositVal = item?.depositAmount ? Number(item.depositAmount) : 0;
        const unitName = item?.unitType?.name || 'Ngăn kho lưu trữ';
        const unitNum = item?.unit?.unitNumber ? `Ô ${item.unit.unitNumber}` : '';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Xác nhận hủy đơn đặt chỗ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã đơn: <span className="font-semibold text-slate-700">{targetRes?.reservationCode || `#${cancelReservationId}`}</span>
                    {unitNum && ` • ${unitNum}`}
                  </p>
                </div>
              </div>

              {/* Thông tin đơn và tiền cọc */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Kho đã đặt:</span>
                  <span className="font-semibold text-slate-800">{unitName}</span>
                </div>
                {depositVal > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                    <span className="text-slate-600">Tiền cọc giữ chỗ đã nộp:</span>
                    <span className="font-bold text-rose-600 text-sm tabular-nums">
                      {depositVal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>

              {/* Cảnh báo không hoàn cọc nổi bật */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Lưu ý quan trọng: Không hoàn lại tiền cọc</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Theo quy định và chính sách đặt chỗ của hệ thống, khi bạn xác nhận hủy đơn, <strong>toàn bộ số tiền cọc đã thanh toán sẽ KHÔNG ĐƯỢC HOÀN LẠI</strong>. Ngăn kho sẽ được mở công khai ngay lập tức cho khách hàng khác đặt thuê.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelReservationId(null)}
                  disabled={isCancellingReservation}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Giữ lại đơn
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelReservation}
                  disabled={isCancellingReservation}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCancellingReservation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý hủy...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Xác nhận hủy (Không hoàn cọc)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
