'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  CreditCard,
  KeyRound,
  FileText,
  Headphones,
  User,
  ShieldCheck,
  Boxes,
  Sparkles
} from 'lucide-react';

// Types & Mock Data
import { CustomerUnit, CustomerTab, GuestPass, SupportTicket } from './types';
import { INITIAL_CUSTOMER_UNITS } from './mockData';

// Modular Components
import CustomerSidebar from './components/CustomerSidebar';
import MyUnitsGrid from './components/MyUnitsGrid';
import UnitDetailsView from './components/UnitDetailsView';
import GuestPassModal from './components/GuestPassModal';
import ExtendLeaseModal from './components/ExtendLeaseModal';
import UpgradeModal from './components/UpgradeModal';
import IncidentReportModal from './components/IncidentReportModal';

export default function CustomerDashboardPage() {
  // Navigation & Sub-views State
  const [activeTab, setActiveTab] = useState<CustomerTab>('my_units');
  const [viewMode, setViewMode] = useState<'grid' | 'details'>('grid');

  // Customer Units State
  const [units, setUnits] = useState<CustomerUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  useEffect(() => {
    async function fetchContracts() {
      try {
        const response = await api.get('/contracts/my-contracts');
        
        // Map backend contract & items to the frontend CustomerUnit
        const mappedUnits: CustomerUnit[] = response.flatMap((contract: any) => 
          contract.contractItems.map((item: any) => ({
            id: item.id.toString(),
            unitNumber: `Ô ${item.unit.unitNumber}`,
            unitType: item.unit.facility?.name || 'Kho Cá nhân Tiêu chuẩn',
            size: '10x10 Có điều hòa nhiệt độ',
            dimensions: '3.0m x 3.0m x 2.8m',
            area: '9.0 m²',
            facilityName: item.unit.facility?.name || 'Cơ sở tự quản',
            facilityAddress: item.unit.facility?.address || 'Khu vực quản lý',
            zone: 'Khu A',
            floor: 'Tầng 1 (Kế thang máy)',
            status: item.status === 'ACTIVE' ? 'active' : 'expiring',
            statusLabel: item.status === 'ACTIVE' ? 'Đang hoạt động' : 'Hết hạn',
            daysRemaining: 30, // Mocked for now
            nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('vi-VN'),
            monthlyRent: `${item.rentalPrice.toLocaleString()} đ/tháng`,
            monthlyRentNum: item.rentalPrice,
            contractStartDate: new Date(contract.startDate).toLocaleDateString('vi-VN'),
            contractEndDate: new Date(contract.endDate).toLocaleDateString('vi-VN'),
            contractId: `SS-HĐ-${contract.id}`,
            totalPaid: `${(item.rentalPrice * contract.durationMonths).toLocaleString()} đ`,
            currentBalance: '0 đ (Đã trả đủ)',
            temperature: '22°C (Mát mẻ)',
            humidity: '50% (Tối ưu chống ẩm)',
            mainPin: 'Đang tải...', // will fetch separately in details view or smart-lock endpoint
            rfidCard: 'RFID-9921',
            isClimateControlled: true,
            guestPasses: [],
            paymentHistory: [],
            supportTickets: [],
            rawContractId: contract.id,
            rawUnitId: item.unit.id
          }))
        );
        
        setUnits(mappedUnits.length > 0 ? mappedUnits : INITIAL_CUSTOMER_UNITS);
        if (mappedUnits.length > 0) setSelectedUnitId(mappedUnits[0].id);
      } catch (error) {
        console.error('Failed to load my-contracts', error);
        // Fallback to mock data on error for UI demonstration
        setUnits(INITIAL_CUSTOMER_UNITS);
        setSelectedUnitId(INITIAL_CUSTOMER_UNITS[0].id);
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, []);

  // Modals State
  const [activeModalUnit, setActiveModalUnit] = useState<CustomerUnit | null>(null);
  const [isGuestPassModalOpen, setIsGuestPassModalOpen] = useState(false);
  const [isExtendLeaseModalOpen, setIsExtendLeaseModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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

  // Callback: Thêm mã khách thành công
  const handleCreatedGuestPass = (newPass: GuestPass) => {
    setUnits(prev => prev.map(u => {
      if (u.id === targetModalUnit.id) {
        return {
          ...u,
          guestPasses: [newPass, ...u.guestPasses],
        };
      }
      return u;
    }));
    triggerToast(`Đã tạo mã khách ${newPass.pin} thành công cho ${newPass.guestName}!`);
  };

  // Callback: Gia hạn hợp đồng thành công
  const handleConfirmExtend = (months: number, newTotal: string) => {
    setUnits(prev => prev.map(u => {
      if (u.id === targetModalUnit.id) {
        return {
          ...u,
          status: 'active',
          statusLabel: 'Đang hoạt động',
          daysRemaining: u.daysRemaining + (months * 30),
          currentBalance: '0 đ (Đã thanh toán)',
        };
      }
      return u;
    }));
    triggerToast(`Gia hạn thành công ô ${targetModalUnit.unitNumber} thêm ${months} tháng (${newTotal})!`);
  };

  // Callback: Gửi yêu cầu nâng cấp/hạ cấp thành công
  const handleConfirmUpgrade = (targetType: string) => {
    triggerToast(`Đã gửi yêu cầu chuyển sang "${targetType}" cho Ban Quản Lý!`);
  };

  // Callback: Gửi báo cáo sự cố thành công
  const handleSubmittedTicket = (newTicket: SupportTicket) => {
    setUnits(prev => prev.map(u => {
      if (u.id === targetModalUnit.id) {
        return {
          ...u,
          supportTickets: [newTicket, ...u.supportTickets],
        };
      }
      return u;
    }));
    triggerToast(`Đã ghi nhận phiếu hỗ trợ #${newTicket.id} cho ${targetModalUnit.unitNumber}!`);
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

      {/* 1. THANH ĐIỀU HƯỚNG BÊN (SIDEBAR) CỔNG KHÁCH HÀNG */}
      <CustomerSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'my_units') setViewMode('grid');
        }}
        activeUnitCount={units.length}
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH (MAIN VIEW) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <span>Cổng Khách Hàng Tự Quản</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/staff"
              className="text-xs font-semibold text-slate-600 hover:text-[#4f39f6] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cổng Nhân Viên ↗
            </Link>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                NH
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">Nguyễn Văn Hải</span>
            </div>
          </div>
        </header>

        {/* Nội dung trang thay đổi theo Tab & ViewMode */}
        <main className="flex-1 p-6 sm:p-8">
          {/* LUỒNG 3: Ô KHO CỦA TÔI */}
          {activeTab === 'my_units' && (
            <>
              {/* Loading skeleton */}
              {loading && (
                <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
                  <div className="h-8 w-48 bg-slate-200 rounded-xl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1,2,3].map(i => (
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
                  onSelectUnit={handleSelectUnit}
                  onOpenGuestPass={handleOpenGuestPass}
                  onOpenExtendLease={handleOpenExtendLease}
                  onOpenReportIncident={handleOpenReportIncident}
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
                />
              )}
            </>
          )}

          {/* CÁC TAB KHÁC CỦA CỔNG KHÁCH HÀNG */}
          {activeTab !== 'my_units' && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xs animate-slide-up-fade">
              <div className="w-16 h-16 rounded-2xl bg-[#4f39f6]/10 text-[#4f39f6] flex items-center justify-center mx-auto">
                {activeTab === 'billing' && <CreditCard className="w-8 h-8" />}
                {activeTab === 'access' && <KeyRound className="w-8 h-8" />}
                {activeTab === 'documents' && <FileText className="w-8 h-8" />}
                {activeTab === 'support' && <Headphones className="w-8 h-8" />}
                {activeTab === 'profile' && <User className="w-8 h-8" />}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === 'billing' && 'Thanh Toán & Hóa Đơn (Tích hợp Luồng 4)'}
                {activeTab === 'access' && 'Truy Cập & Khóa Thông Minh Smart Lock'}
                {activeTab === 'documents' && 'Kho Tài Liệu & Hợp Đồng Ký Số'}
                {activeTab === 'support' && 'Trung Tâm Hỗ Trợ & Yêu Cầu Kỹ Thuật (Luồng 7)'}
                {activeTab === 'profile' && 'Hồ Sơ Cá Nhân & Cài Đặt Bảo Mật'}
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Bạn đang xem tính năng mở rộng. Để quản lý danh sách các kho đã thuê và các thao tác liên quan, vui lòng quay lại tab <strong>Ô kho của tôi</strong>.
              </p>
              <button
                onClick={() => { setActiveTab('my_units'); setViewMode('grid'); }}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-md shadow-[#4f39f6]/25 transition-all"
              >
                <span>Về Ô kho của tôi</span>
              </button>
            </div>
          )}
        </main>
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
        </>
      )}
    </div>
  );
}
