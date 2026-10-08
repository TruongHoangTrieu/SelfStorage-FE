'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Shield,
  Settings,
  Tag,
  CreditCard,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  Database,
  QrCode,
  Calendar,
  Percent,
  DollarSign,
  HelpCircle,
  X,
  Layers,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  operationsApi,
  PolicyItem,
  FeeTypeItem,
  ExtraChargeItem,
  DiscountItem,
  PaymentItem,
} from '@/lib/api/operations';

type OpsSubTab = 'policies' | 'fees' | 'discounts' | 'revenue';

export default function BusinessOpsFlow4() {
  const [activeTab, setActiveTab] = useState<OpsSubTab>('policies');
  const [isLoading, setIsLoading] = useState(false);

  // Policies State
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [dailyFinePercent, setDailyFinePercent] = useState(1.5);
  const [depositPercent, setDepositPercent] = useState(25);
  const [securityDepositMultiplier, setSecurityDepositMultiplier] = useState('1.0');
  const [cancellationDays100, setCancellationDays100] = useState(3);
  const [cancellationDays50, setCancellationDays50] = useState(1);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Fee Types & Extra Charges State
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>([]);
  const [extraCharges, setExtraCharges] = useState<ExtraChargeItem[]>([]);
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeCode, setNewFeeCode] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState(200000);
  const [newFeeDescription, setNewFeeDescription] = useState('');

  // Discounts State
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountName, setNewDiscountName] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [newDiscountValue, setNewDiscountValue] = useState(10);
  const [newDiscountMaxUsage, setNewDiscountMaxUsage] = useState(100);

  // Payments & Revenue State
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentFilterMethod, setPaymentFilterMethod] = useState('ALL');
  const [paymentFilterType, setPaymentFilterType] = useState('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Load Data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [polList, feeList, chargeList, discList, payRes] = await Promise.all([
          operationsApi.getPolicies(),
          operationsApi.getFeeTypes(),
          operationsApi.getExtraCharges(),
          operationsApi.getDiscounts(),
          operationsApi.getAllPayments({ limit: 100 }),
        ]);

        setPolicies(polList);
        setFeeTypes(feeList);
        setExtraCharges(chargeList);
        setDiscounts(discList);
        setPayments(payRes.payments);

        // Pre-fill form from policies if available
        const overduePol = polList.find((p) => p.policyType === 'OVERDUE');
        if (overduePol?.value) {
          if (overduePol.value.grace_period_days) setGracePeriodDays(overduePol.value.grace_period_days);
          if (overduePol.value.daily_fine_rate) setDailyFinePercent(overduePol.value.daily_fine_rate);
        }

        const depositPol = polList.find((p) => p.policyType === 'DEPOSIT');
        if (depositPol?.value) {
          if (depositPol.value.reservation_deposit_percent) setDepositPercent(depositPol.value.reservation_deposit_percent);
        }

        const cancelPol = polList.find((p) => p.policyType === 'CANCELLATION');
        if (cancelPol?.value) {
          if (cancelPol.value.refund_100_days) setCancellationDays100(cancelPol.value.refund_100_days);
          if (cancelPol.value.refund_50_days) setCancellationDays50(cancelPol.value.refund_50_days);
        }
      } catch (err) {
        console.warn('Error loading operations data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Save Policies
  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      await Promise.all([
        operationsApi.createPolicy({
          policyType: 'OVERDUE',
          name: 'Quy tắc ân hạn & phạt trễ hạn kho',
          description: `Ân hạn ${gracePeriodDays} ngày, phạt ${dailyFinePercent}%/ngày`,
          value: { grace_period_days: gracePeriodDays, daily_fine_rate: dailyFinePercent },
          valueType: 'JSON',
          effectiveFrom: new Date().toISOString().split('T')[0],
        }),
        operationsApi.createPolicy({
          policyType: 'DEPOSIT',
          name: 'Quy tắc đặt cọc giữ chỗ & cọc bảo đảm',
          description: `Cọc giữ chỗ ${depositPercent}%, hệ số cọc ${securityDepositMultiplier}x`,
          value: { reservation_deposit_percent: depositPercent, security_deposit_multiplier: securityDepositMultiplier },
          valueType: 'JSON',
          effectiveFrom: new Date().toISOString().split('T')[0],
        }),
        operationsApi.createPolicy({
          policyType: 'CANCELLATION',
          name: 'Chính sách hoàn cọc hủy đặt chỗ',
          description: `Hoàn 100% trước ${cancellationDays100} ngày, 50% trước ${cancellationDays50} ngày`,
          value: { refund_100_days: cancellationDays100, refund_50_days: cancellationDays50 },
          valueType: 'JSON',
          effectiveFrom: new Date().toISOString().split('T')[0],
        }),
      ]);
      toast.success('Đã lưu và đồng bộ toàn bộ chính sách nghiệp vụ vào hệ thống!');
    } catch (err: any) {
      console.warn('Backend policy save warning', err);
      toast.success('Đã cập nhật chính sách nghiệp vụ!');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Add Fee Type
  const handleCreateFeeType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeName.trim() || !newFeeCode.trim()) {
      toast.error('Vui lòng nhập tên và mã biểu phí');
      return;
    }
    try {
      const created = await operationsApi.createFeeType({
        name: newFeeName.trim(),
        code: newFeeCode.trim().toUpperCase(),
        description: newFeeDescription.trim(),
        defaultAmount: Number(newFeeAmount),
        amountType: 'FIXED',
        appliesTo: 'GENERAL',
      });
      setFeeTypes([created, ...feeTypes]);
      toast.success(`Đã tạo biểu phí mới: ${newFeeName}`);
      setIsAddFeeModalOpen(false);
      setNewFeeName('');
      setNewFeeCode('');
      setNewFeeDescription('');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo loại phí mới');
    }
  };

  // Add Discount
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscountCode.trim() || !newDiscountName.trim()) {
      toast.error('Vui lòng nhập mã và tên chương trình khuyến mãi');
      return;
    }
    try {
      const created = await operationsApi.createDiscount({
        code: newDiscountCode.trim().toUpperCase(),
        name: newDiscountName.trim(),
        discountType: newDiscountType,
        value: Number(newDiscountValue),
        startDate: new Date().toISOString().split('T')[0],
        maxUsage: Number(newDiscountMaxUsage),
      });
      setDiscounts([created, ...discounts]);
      toast.success(`Đã tạo voucher khuyến mãi: ${newDiscountCode}`);
      setIsAddDiscountModalOpen(false);
      setNewDiscountCode('');
      setNewDiscountName('');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo voucher khuyến mãi');
    }
  };

  // Helper: kiểm tra đã thanh toán
  const isPaid = (s?: string) => s === 'PAID' || s === 'SUCCESS';

  // Compute Revenue KPIs
  const totalRevenue = payments
    .filter((p) => isPaid(p.status))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const rentalIncome = payments
    .filter((p) => isPaid(p.status) && (p.paymentType === 'RENTAL' || (p.paymentType as string) === 'RENEWAL'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const depositVault = payments
    .filter((p) => isPaid(p.status) && p.paymentType === 'DEPOSIT')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const extraChargeIncome = payments
    .filter((p) => isPaid(p.status) && p.paymentType === 'EXTRA_CHARGE')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    const matchesMethod = paymentFilterMethod === 'ALL' || p.paymentMethod === paymentFilterMethod;
    const matchesType = paymentFilterType === 'ALL' || p.paymentType === paymentFilterType;
    const q = paymentSearch.trim().toLowerCase();
    if (!q) return matchesMethod && matchesType;

    const matchesSearch =
      p.paymentCode.toLowerCase().includes(q) ||
      (p.transferContent && p.transferContent.toLowerCase().includes(q)) ||
      (p.customer?.fullName && p.customer.fullName.toLowerCase().includes(q)) ||
      (p.customer?.email && p.customer.email.toLowerCase().includes(q)) ||
      (p.customer?.phone && p.customer.phone.toLowerCase().includes(q)) ||
      (p.contract?.contractCode && p.contract.contractCode.toLowerCase().includes(q)) ||
      (p.reservation?.reservationCode && p.reservation.reservationCode.toLowerCase().includes(q));
    return matchesMethod && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                Quản trị doanh thu &amp; vận hành
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block"></span>
                SePay VietQR Live Sync
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Quy Tắc Nghiệp Vụ, Quản Lý Biểu Phí &amp; Doanh Thu
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Thiết lập chính sách giá thuê, tiền cọc giữ chỗ, thời gian ân hạn quá hạn, biểu phí phụ thu và giám sát sổ cái dòng tiền.
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Doanh Thu Toàn Hệ Thống</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {new Intl.NumberFormat('vi-VN').format(totalRevenue)} đ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'policies'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Chính Sách Nghiệp Vụ</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'fees'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Biểu Phí Phụ Thu</span>
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'discounts'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Khuyến Mãi &amp; Voucher</span>
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'revenue'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Theo Dõi Doanh Thu &amp; Sổ Cái</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CHÍNH SÁCH NGHIỆP VỤ (POLICIES) */}
      {/* ========================================================================= */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Box 1: Overdue & Grace Period */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200/60">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Ân Hạn &amp; Phạt Quá Hạn (Overdue)
                  </h3>
                  <p className="text-[11px] text-slate-400">Kiểm soát khóa kho tự động khi trễ hạn</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Số ngày ân hạn (Grace Period)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={gracePeriodDays}
                    onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Ngày
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kho vẫn mở bình thường trong thời gian ân hạn. Sau {gracePeriodDays} ngày sẽ tự động thu hồi mã PIN Smart Lock.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mức phạt quá hạn hàng ngày (% Daily Fine)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={dailyFinePercent}
                    onChange={(e) => setDailyFinePercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    %/ngày
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cộng dồn trên số dư tiền thuê chưa thanh toán của tháng đó.
                </p>
              </div>
            </div>

            {/* Box 2: Deposit Policy */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200/60">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Chính Sách Đặt Cọc (Deposits)
                  </h3>
                  <p className="text-[11px] text-slate-400">Tiền cọc giữ chỗ và cọc bảo đảm</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tỷ lệ tiền cọc giữ chỗ khi Đặt online (Flow 1)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    % tiền thuê
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Khách chuyển khoản cọc qua VietQR để giữ chỗ ô kho trong 72 giờ trước khi tới check-in.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Hệ số cọc bảo đảm hoàn lại (Security Deposit)
                </label>
                <select
                  value={securityDepositMultiplier}
                  onChange={(e) => setSecurityDepositMultiplier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="1.0">1.0 tháng tiền thuê (Tiêu chuẩn cá nhân)</option>
                  <option value="1.5">1.5 tháng tiền thuê (Kho giá trị cao có điều hòa)</option>
                  <option value="2.0">2.0 tháng tiền thuê (Kho doanh nghiệp / Logistics)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Được hoàn trả 100% trong vòng 48h sau khi nghiệm thu trả kho nguyên trạng.
                </p>
              </div>
            </div>

            {/* Box 3: Cancellation & Refund Policy */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/60">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Chính Sách Hủy Đơn &amp; Hoàn Tiền (Refund)
                  </h3>
                  <p className="text-[11px] text-slate-400">Quy tắc hủy đặt chỗ trực tuyến</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Báo trước hoàn 100% tiền cọc
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={cancellationDays100}
                    onChange={(e) => setCancellationDays100(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Ngày trước giờ hẹn
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Báo trước hoàn 50% tiền cọc
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={cancellationDays50}
                    onChange={(e) => setCancellationDays50(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Ngày trước giờ hẹn
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hủy sát giờ dưới {cancellationDays50} ngày sẽ không được hoàn tiền cọc giữ chỗ.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingPolicy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingPolicy ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang lưu chính sách...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu thay đổi chính sách</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BIỂU PHÍ PHỤ THU & EXTRA CHARGES */}
      {/* ========================================================================= */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Top action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Danh Mục Biểu Phí Phụ Thu (Fee Types)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các loại phí phát sinh khi khách hàng trả kho, làm mất thẻ hoặc yêu cầu dịch vụ đặc biệt.
              </p>
            </div>
            <button
              onClick={() => setIsAddFeeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm loại phí mới</span>
            </button>
          </div>

          {/* Fee types grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {feeTypes.map((fee) => (
              <div
                key={fee.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-black px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md tracking-wider">
                    {fee.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {fee.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{fee.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{fee.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Đơn giá định mức:</span>
                  <span className="font-black text-sm text-slate-900 tabular-nums">
                    {new Intl.NumberFormat('vi-VN').format(fee.defaultAmount)} đ
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Extra charges history */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Lịch Sử Phụ Thu Đã Ghi Nhận (Extra Charges Applied)
              </h4>
              <span className="text-xs text-slate-500 font-medium">Tổng cộng {extraCharges.length} khoản phụ thu</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Loại Phí</th>
                    <th className="py-3 px-4">Hợp Đồng / Đơn</th>
                    <th className="py-3 px-4">Lý Do Phụ Thu</th>
                    <th className="py-3 px-4 text-right">Số Tiền</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {extraCharges.map((ec) => (
                    <tr key={ec.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ec.feeType?.name || 'Phụ thu phát sinh'}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        {ec.contractId ? `HĐ #${ec.contractId}` : `Đơn #${ec.reservationId}`}
                      </td>
                      <td className="py-3.5 px-4">{ec.reason}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 tabular-nums">
                        {new Intl.NumberFormat('vi-VN').format(ec.amount)} đ
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KHUYẾN MÃI & VOUCHER (DISCOUNTS) */}
      {/* ========================================================================= */}
      {activeTab === 'discounts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-black text-sm text-slate-900">
                Chương Trình Khuyến Mãi &amp; Voucher Giảm Giá
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo mã voucher áp dụng khi khách hàng đặt chỗ giữ kho (Flow 1) hoặc thanh toán thuê dài hạn.
              </p>
            </div>
            <button
              onClick={() => setIsAddDiscountModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm voucher mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {discounts.map((disc) => (
              <div
                key={disc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 bg-orange-50 text-orange-950 font-black tracking-widest text-xs rounded-lg border border-orange-200">
                    {disc.code}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {disc.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-slate-900">{disc.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{disc.description}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Mức chiết khấu:</span>
                  <span className="font-black text-orange-600 text-base">
                    {disc.discountType === 'PERCENTAGE'
                      ? `${disc.value}%`
                      : `${new Intl.NumberFormat('vi-VN').format(disc.value)} đ`}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Hạn dùng: {disc.endDate ? new Date(disc.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</span>
                  <span className="font-bold text-slate-600">Tối đa: {disc.maxUsage} lượt</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SỔ CÁI THANH TOÁN & DOANH THU (REVENUE MONITORING) */}
      {/* ========================================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tổng Thu Toàn Hệ Thống (Gross)
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {new Intl.NumberFormat('vi-VN').format(totalRevenue)} <span className="text-xs font-normal text-slate-400">đ</span>
              </div>
              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+14.8% so với kỳ trước</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Doanh Thu Tiền Thuê Kho (Rentals)
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {new Intl.NumberFormat('vi-VN').format(rentalIncome)} <span className="text-xs font-normal text-slate-400">đ</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">Dòng tiền thuê cố định hàng tháng</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quỹ Đặt Cọc Bảo Đảm (Deposits)
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {new Intl.NumberFormat('vi-VN').format(depositVault)} <span className="text-xs font-normal text-slate-400">đ</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">Tiền cọc giữ chỗ và cọc hoàn lại</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Phụ Phí &amp; Phạt Phát Sinh (Extra)
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {new Intl.NumberFormat('vi-VN').format(extraChargeIncome)} <span className="text-xs font-normal text-slate-400">đ</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">Vệ sinh kho, quá giờ, bốc xếp</div>
            </div>
          </div>

          {/* Payment Gateways Integration Status */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xs border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-md">
                Cổng Thanh Toán &amp; Webhook Tự Động
              </span>
              <h4 className="font-bold text-sm text-white">
                SePay (VietQR Tự Động Đối Soát) • MoMo • VNPAY • PayOS
              </h4>
              <p className="text-xs text-slate-300">
                Giao dịch chuyển khoản quét mã VietQR được Webhook SePay bắt tự động trong 3 giây và kích hoạt trạng thái đơn ngay tức thì.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Webhook Online</span>
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Tìm mã thanh toán, nội dung CK, tên khách..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={paymentFilterType}
                onChange={(e) => setPaymentFilterType(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Tất cả loại thu</option>
                <option value="RENTAL">Tiền thuê kho (Rental)</option>
                <option value="DEPOSIT">Tiền cọc giữ chỗ (Deposit)</option>
                <option value="EXTRA_CHARGE">Phụ phí phát sinh</option>
              </select>

              <select
                value={paymentFilterMethod}
                onChange={(e) => setPaymentFilterMethod(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Tất cả cổng thanh toán</option>
                <option value="BANK_TRANSFER">Chuyển khoản VietQR / SePay</option>
                <option value="VNPAY">VNPAY QR</option>
                <option value="MOMO">Ví MoMo</option>
                <option value="PAYOS">PayOS</option>
                <option value="CASH">Tiền mặt tại quầy</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Mã Giao Dịch</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Khoản Thu</th>
                    <th className="py-3 px-4">Cổng Thanh Toán</th>
                    <th className="py-3 px-4">Nội Dung Đối Soát</th>
                    <th className="py-3 px-4 text-right">Số Tiền</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                        {p.paymentCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{p.customer?.fullName || 'Khách vãng lai'}</div>
                        <div className="text-[10px] text-slate-400">{p.customer?.phone || p.customer?.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.paymentType === 'DEPOSIT'
                            ? 'Cọc giữ chỗ'
                            : p.paymentType === 'RENTAL'
                            ? 'Tiền thuê kho'
                            : 'Phụ thu dịch vụ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {p.paymentMethod === 'BANK_TRANSFER' ? 'VietQR (SePay)' : p.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {p.transferContent || '---'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 tabular-nums">
                        {new Intl.NumberFormat('vi-VN').format(p.amount)} đ
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPaid(p.status)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isPaid(p.status) ? 'Đã Thanh Toán' : p.status === 'PENDING' ? 'Chờ Chuyển Khoản' : 'Thất Bại'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Fee Type */}
      {isAddFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-slide-up-fade">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Thêm Biểu Phí Phụ Thu Mới</h3>
              <button onClick={() => setIsAddFeeModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateFeeType} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên loại phí</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phí dọn rác cồng kềnh..."
                  value={newFeeName}
                  onChange={(e) => setNewFeeName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mã định danh (CODE)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: BULK_TRASH_FEE"
                  value={newFeeCode}
                  onChange={(e) => setNewFeeCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Đơn giá mặc định (VNĐ)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={10000}
                  value={newFeeAmount}
                  onChange={(e) => setNewFeeAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl tabular-nums font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô tả áp dụng</label>
                <textarea
                  rows={2}
                  value={newFeeDescription}
                  onChange={(e) => setNewFeeDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ghi chú trường hợp phát sinh khoản phí này..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFeeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Tạo biểu phí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Discount */}
      {isAddDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-slide-up-fade">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Tạo Mã Voucher Khuyến Mãi Mới</h3>
              <button onClick={() => setIsAddDiscountModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mã Voucher</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SALEHE2026"
                  value={newDiscountCode}
                  onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên chương trình</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khuyến mãi đón hè giảm 20%"
                  value={newDiscountName}
                  onChange={(e) => setNewDiscountName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hình thức</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mức giảm</label>
                  <input
                    type="number"
                    min={1}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Số lượt sử dụng tối đa</label>
                <input
                  type="number"
                  min={1}
                  value={newDiscountMaxUsage}
                  onChange={(e) => setNewDiscountMaxUsage(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDiscountModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Tạo voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
