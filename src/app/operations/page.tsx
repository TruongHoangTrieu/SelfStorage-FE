"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Settings,
  DollarSign,
  TrendingUp,
  Download,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Tag,
  X,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Menu,
  LogOut,
  Clock,
  Check,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Boxes,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { facilitiesApi, FacilityItem } from "@/lib/api/facilities";
import {
  operationsApi,
  PolicyItem,
  FeeTypeItem,
} from "@/lib/api/operations";
import MultiBranchRevenueAnalytics from "../admin/components/MultiBranchRevenueAnalytics";
import FacilityLayoutView from "../staff/components/FacilityLayoutView";
import UnitTypesPricingManager from "../staff/components/UnitTypesPricingManager";

type OpsTab = "facilities" | "storage_units" | "policies" | "pricing_fees" | "performance" | "reports";

export default function BusinessOperationsPage() {
  const [activeTab, setActiveTab] = useState<OpsTab>("facilities");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Facilities Management State
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [facilityStatusFilter, setFacilityStatusFilter] = useState("ALL");
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
  const [selectedFacilityForUnits, setSelectedFacilityForUnits] = useState<string>("1");
  const [unitsSubTab, setUnitsSubTab] = useState<"unit_types" | "layout">("unit_types");

  // Fee Edit State
  const [editingFee, setEditingFee] = useState<FeeTypeItem | null>(null);
  const [editFeeName, setEditFeeName] = useState("");
  const [editFeeCode, setEditFeeCode] = useState("");
  const [editFeeAmount, setEditFeeAmount] = useState(200000);
  const [editFeeDescription, setEditFeeDescription] = useState("");
  const [editFeeAppliesTo, setEditFeeAppliesTo] = useState("CHECKOUT");
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [isDeletingFee, setIsDeletingFee] = useState(false);

  // Facility Form Fields
  const [facName, setFacName] = useState("");
  const [facCode, setFacCode] = useState("");
  const [facAddress, setFacAddress] = useState("");
  const [facPhone, setFacPhone] = useState("");
  const [facEmail, setFacEmail] = useState("");
  const [facDescription, setFacDescription] = useState("");
  const [facStatus, setFacStatus] = useState<"ACTIVE" | "INACTIVE" | "UNDER_MAINTENANCE">("ACTIVE");
  const [isSavingFacility, setIsSavingFacility] = useState(false);

  // Policies State (General rental policies)
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [dailyFinePercent, setDailyFinePercent] = useState(1.5);
  const [depositPercent, setDepositPercent] = useState(25);
  const [securityDepositMultiplier, setSecurityDepositMultiplier] = useState("1.0");
  const [cancellationDays100, setCancellationDays100] = useState(3);
  const [cancellationDays50, setCancellationDays50] = useState(1);
  const [autoLockoutDays, setAutoLockoutDays] = useState(14);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Pricing & Fees State
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>([]);
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);

  // Fee Form
  const [feeName, setFeeName] = useState("");
  const [feeCode, setFeeCode] = useState("");
  const [feeAmount, setFeeAmount] = useState(200000);
  const [feeDescription, setFeeDescription] = useState("");
  const [feeAppliesTo, setFeeAppliesTo] = useState("CHECKOUT");



  // Reports & Analytics Records
  const [reportContracts, setReportContracts] = useState<any[]>([]);
  const [reportFacilityFilter, setReportFacilityFilter] = useState("ALL");
  const [reportStatusFilter, setReportStatusFilter] = useState("ALL");
  const [reportSearch, setReportSearch] = useState("");

  // Load User from LocalStorage & Strict Role Guard for Role 4
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) {
          window.location.replace("/login?redirect=/operations");
          return;
        }
        const user = JSON.parse(raw);
        setCurrentUser(user);

        const role = (
          typeof user?.role === "string" ? user.role : user?.role?.name || ""
        ).toUpperCase();

        if (role === "STORAGE_CUSTOMER" || role === "CUSTOMER") {
          toast.error("Tài khoản Khách hàng không có quyền truy cập Cổng Vận Hành Doanh Nghiệp.");
          window.location.replace("/dashboard");
          return;
        }

        if (role === "FACILITY_STAFF" || (role.includes("STAFF") && !role.includes("MANAGER"))) {
          toast.warning("Tài khoản Nhân viên không có quyền truy cập Cổng Vận Hành. Đã chuyển về Cổng Nhân Viên.");
          window.location.replace("/staff");
          return;
        }

        if (role === "FACILITY_MANAGER" && !role.includes("OPERATIONS") && !role.includes("ADMIN")) {
          toast.info("Tài khoản Quản Lý Chi Nhánh (Role 3) - Cổng Vận Hành dành riêng cho Quản Lý Vận Hành Chuỗi (Role 4). Đã chuyển về Cổng Chi Nhánh.");
          window.location.replace("/manager");
          return;
        }

        const isAllowed =
          role === "BUSINESS_OPERATIONS_MANAGER" ||
          role === "OPS" ||
          role.includes("OPERATIONS_MANAGER") ||
          role === "SYSTEM_ADMINISTRATOR" ||
          role === "ADMIN" ||
          role.includes("ADMIN");

        if (!isAllowed) {
          toast.error("Bạn không có quyền truy cập Cổng Vận Hành Doanh Nghiệp.");
          window.location.replace("/dashboard");
          return;
        }
      } catch {}
    }
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "OP";
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Logout notice:", e);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        sessionStorage.clear();
        window.location.replace("/login");
      }
    }
  };

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [facRes, polRes, feeRes, contRes] = await Promise.allSettled([
        facilitiesApi.getFacilities(),
        operationsApi.getPolicies(),
        operationsApi.getFeeTypes(),
        operationsApi.getReportContracts(),
      ]);

      if (facRes.status === "fulfilled" && facRes.value) {
        setFacilities(Array.isArray(facRes.value) ? facRes.value : (facRes.value as any)?.data || []);
      }
      if (polRes.status === "fulfilled" && polRes.value) {
        setPolicies(polRes.value);
        const overduePol = polRes.value.find((p) => p.policyType === "OVERDUE");
        if (overduePol?.value) {
          if (overduePol.value.gracePeriodDays) setGracePeriodDays(overduePol.value.gracePeriodDays);
          if (overduePol.value.dailyFinePercent) setDailyFinePercent(overduePol.value.dailyFinePercent);
        }
        const depositPol = polRes.value.find((p) => p.policyType === "DEPOSIT");
        if (depositPol?.value) {
          if (depositPol.value.depositPercent) setDepositPercent(depositPol.value.depositPercent);
          if (depositPol.value.multiplier) setSecurityDepositMultiplier(String(depositPol.value.multiplier));
        }
      }
      if (feeRes.status === "fulfilled" && feeRes.value) {
        setFeeTypes(feeRes.value);
      }
      if (contRes.status === "fulfilled" && contRes.value) {
        setReportContracts(Array.isArray(contRes.value) ? contRes.value : (contRes.value as any)?.data || []);
      }
    } catch (err) {
      console.warn("Load operations data error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Save Policy
  const handleSavePolicies = async () => {
    setIsSavingPolicy(true);
    try {
      await Promise.all([
        operationsApi.createPolicy({
          policyType: "OVERDUE",
          name: "Chính Sách Quá Hạn & Phạt Trễ Toàn Chuỗi",
          description: "Ân hạn 7 ngày, sau đó phạt theo tỷ lệ % mỗi ngày và khóa ô kho",
          value: {
            gracePeriodDays,
            dailyFinePercent,
            autoLockoutDays,
          },
          valueType: "JSON",
          effectiveFrom: new Date().toISOString(),
        }),
        operationsApi.createPolicy({
          policyType: "DEPOSIT",
          name: "Chính Sách Đặt Cọc & Hoàn Cọc Toàn Hệ Thống",
          description: "Mức cọc tối thiểu và cọc an ninh",
          value: {
            depositPercent,
            securityDepositMultiplier: parseFloat(securityDepositMultiplier) || 1,
            cancellationDays100,
            cancellationDays50,
          },
          valueType: "JSON",
          effectiveFrom: new Date().toISOString(),
        }),
      ]);
      toast.success("Đã lưu và cập nhật chính sách cho toàn bộ hệ thống!");
      const updatedPols = await operationsApi.getPolicies();
      setPolicies(updatedPols);
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu chính sách");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Handle Facility Modal
  const openAddFacilityModal = () => {
    setEditingFacility(null);
    setFacName("");
    setFacCode("");
    setFacAddress("");
    setFacPhone("");
    setFacEmail("");
    setFacDescription("");
    setFacStatus("ACTIVE");
    setIsAddFacilityModalOpen(true);
  };

  const openEditFacilityModal = (fac: FacilityItem) => {
    setEditingFacility(fac);
    setFacName(fac.name || "");
    setFacCode(fac.code || "");
    setFacAddress(fac.address || "");
    setFacPhone(fac.phone || "");
    setFacEmail(fac.email || "");
    setFacDescription(fac.district || "");
    setFacStatus((fac.isActive ? "ACTIVE" : "INACTIVE") as any);
    setIsAddFacilityModalOpen(true);
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim() || !facCode.trim() || !facAddress.trim()) {
      toast.error("Vui lòng điền tên cơ sở, mã cơ sở và địa chỉ!");
      return;
    }
    setIsSavingFacility(true);
    try {
      if (editingFacility) {
        await facilitiesApi.updateFacility(editingFacility.id, {
          name: facName.trim(),
          code: facCode.trim().toUpperCase(),
          address: facAddress.trim(),
          phone: facPhone.trim() || undefined,
          email: facEmail.trim() || undefined,
          description: facDescription.trim() || undefined,
          status: facStatus,
        });
        toast.success(`Đã cập nhật cơ sở ${facName}`);
      } else {
        await facilitiesApi.createFacility({
          name: facName.trim(),
          code: facCode.trim().toUpperCase(),
          address: facAddress.trim(),
          phone: facPhone.trim() || undefined,
          email: facEmail.trim() || undefined,
          description: facDescription.trim() || undefined,
          status: facStatus,
        });
        toast.success(`Đã thêm mới cơ sở ${facName}`);
      }
      setIsAddFacilityModalOpen(false);
      const res = await facilitiesApi.getFacilities();
      setFacilities(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi lưu cơ sở");
    } finally {
      setIsSavingFacility(false);
    }
  };

  // Handle Open Edit Fee Modal
  const openEditFeeModal = (fee: FeeTypeItem) => {
    setEditingFee(fee);
    setEditFeeName(fee.name);
    setEditFeeCode(fee.code);
    setEditFeeAmount(fee.defaultAmount);
    setEditFeeDescription(fee.description || "");
    setEditFeeAppliesTo(fee.appliesTo || "CHECKOUT");
    setIsEditFeeModalOpen(true);
  };

  // Handle Update Fee Type
  const handleUpdateFeeType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;
    if (!editFeeName.trim() || !editFeeCode.trim()) {
      toast.error("Vui lòng nhập tên và mã biểu phí!");
      return;
    }
    try {
      await operationsApi.updateFeeType(editingFee.id, {
        name: editFeeName.trim(),
        code: editFeeCode.trim().toUpperCase(),
        defaultAmount: Number(editFeeAmount) || 0,
        amountType: "FIXED",
        appliesTo: editFeeAppliesTo,
        description: editFeeDescription.trim() || undefined,
      });
      toast.success("Đã cập nhật biểu phí thành công!");
      setIsEditFeeModalOpen(false);
      setEditingFee(null);
      const res = await operationsApi.getFeeTypes();
      setFeeTypes(res);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi cập nhật biểu phí");
    }
  };

  // Handle Delete Fee Type
  const handleDeleteFeeType = async (id: number | string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa loại phụ phí này?")) return;
    setIsDeletingFee(true);
    try {
      await operationsApi.deleteFeeType(id);
      toast.success("Đã xóa biểu phí thành công!");
      const res = await operationsApi.getFeeTypes();
      setFeeTypes(res);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xóa biểu phí");
    } finally {
      setIsDeletingFee(false);
    }
  };

  // Handle Create Fee Type
  const handleCreateFeeType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeName.trim() || !feeCode.trim()) {
      toast.error("Vui lòng nhập tên và mã biểu phí!");
      return;
    }
    try {
      await operationsApi.createFeeType({
        name: feeName.trim(),
        code: feeCode.trim().toUpperCase(),
        defaultAmount: Number(feeAmount) || 0,
        amountType: "FIXED",
        appliesTo: feeAppliesTo,
        description: feeDescription.trim() || undefined,
      });
      toast.success("Đã tạo mới loại biểu phí thành công!");
      setIsAddFeeModalOpen(false);
      setFeeName("");
      setFeeCode("");
      setFeeAmount(200000);
      setFeeDescription("");
      const res = await operationsApi.getFeeTypes();
      setFeeTypes(res);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tạo biểu phí");
    }
  };



  // Filtered Facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchSearch =
        !facilitySearch.trim() ||
        f.name?.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.code?.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.address?.toLowerCase().includes(facilitySearch.toLowerCase());

      const isFacActive = f.status ? f.status === "ACTIVE" : (f.isActive ?? true);
      const matchStatus =
        facilityStatusFilter === "ALL" ||
        (facilityStatusFilter === "ACTIVE" && isFacActive) ||
        (facilityStatusFilter === "INACTIVE" && !isFacActive);

      return matchSearch && matchStatus;
    });
  }, [facilities, facilitySearch, facilityStatusFilter]);

  // Filtered Report Contracts
  const filteredReportContracts = useMemo(() => {
    return reportContracts.filter((c) => {
      const fId = String(c.facilityId || c.storageUnit?.facilityId || "");
      const matchFac = reportFacilityFilter === "ALL" || fId === reportFacilityFilter;
      const status = String(c.status || "").toUpperCase();
      const matchStatus = reportStatusFilter === "ALL" || status === reportStatusFilter;
      const search = reportSearch.toLowerCase().trim();
      const matchSearch =
        !search ||
        String(c.contractNumber || c.id || "").toLowerCase().includes(search) ||
        String(c.customer?.fullName || "").toLowerCase().includes(search) ||
        String(c.storageUnit?.unitNumber || "").toLowerCase().includes(search);

      return matchFac && matchStatus && matchSearch;
    });
  }, [reportContracts, reportFacilityFilter, reportStatusFilter, reportSearch]);

  // Export to CSV Function
  const exportReportToCSV = () => {
    if (filteredReportContracts.length === 0) {
      toast.warning("Không có dữ liệu hợp đồng nào để xuất!");
      return;
    }
    const headers = [
      "Mã Hợp Đồng",
      "Khách Hàng",
      "Số Điện Thoại",
      "Cơ Sở Kho",
      "Số Ô Kho",
      "Loại Kho",
      "Giá Thuê Tháng (VND)",
      "Ngày Bắt Đầu",
      "Ngày Kết Thúc",
      "Trạng Thái",
      "Tình Trạng Thanh Toán",
    ];

    const rows = filteredReportContracts.map((c) => [
      `"${c.contractNumber || c.id || ""}"`,
      `"${c.customer?.fullName || c.customerName || "N/A"}"`,
      `"${c.customer?.phone || c.customerPhone || ""}"`,
      `"${c.facility?.name || c.facilityName || "Cơ sở kho"}"`,
      `"${c.storageUnit?.unitNumber || c.unitNumber || ""}"`,
      `"${c.storageUnit?.unitType?.name || c.unitTypeName || "Tiêu chuẩn"}"`,
      c.monthlyRent || c.rentalFee || 0,
      `"${c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : ""}"`,
      `"${c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : ""}"`,
      `"${c.status || "ACTIVE"}"`,
      `"${c.paymentStatus || "PAID"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Bao_Cao_He_Thong_SelfStorage_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất tệp CSV báo cáo toàn hệ thống thành công!");
  };

  // Navigation Items for Sidebar
  const navSection1 = [
    { id: "facilities" as OpsTab, label: "Danh sách cơ sở kho", icon: Building2, badge: facilities.length },
    { id: "storage_units" as OpsTab, label: "Quản lý kho & Sơ đồ", icon: Boxes },
    { id: "policies" as OpsTab, label: "Chính sách cho thuê", icon: Settings },
    { id: "pricing_fees" as OpsTab, label: "Biểu phí & Khung giá", icon: DollarSign },
  ];

  const navSection2 = [
    { id: "performance" as OpsTab, label: "Doanh thu, Tỷ lệ sử dụng & Hiệu suất", icon: TrendingUp },
    { id: "reports" as OpsTab, label: "Báo cáo & Xuất dữ liệu", icon: Download },
  ];

  const tabLabels: Record<OpsTab, { title: string; subtitle: string; icon: any }> = {
    facilities: {
      title: "Quản Lý Danh Sách Tất Cả Cơ Sở Kho Toàn Chuỗi",
      subtitle: "Theo dõi trạng thái, địa chỉ, tổng tầng và thông tin liên hệ của toàn bộ cơ sở trong hệ thống.",
      icon: Building2,
    },
    storage_units: {
      title: "Quản Lý Kho, Ô Kho & Bảng Giá Thuê - Tiền Cọc",
      subtitle: "Thêm loại kho mới, tăng số lượng ô kho trống, quyết định giá thuê, tiền cọc và theo dõi sơ đồ mặt bằng.",
      icon: Boxes,
    },
    policies: {
      title: "Thiết Lập Chính Sách Cho Thuê Toàn Bộ Hệ Thống",
      subtitle: "Quy định tiền cọc, gia hạn, hoàn cọc khi hủy, điều kiện trả kho và chế tài phạt quá hạn.",
      icon: Settings,
    },
    pricing_fees: {
      title: "Biểu Phí Phụ Thu & Khung Giá Chuẩn",
      subtitle: "Quản lý khung giá thuê chuẩn theo diện tích và danh mục biểu phí phụ thu áp dụng toàn hệ thống.",
      icon: DollarSign,
    },
    performance: {
      title: "Giám Sát Doanh Thu, Tỷ Lệ Sử Dụng Kho & Hiệu Suất Từng Cơ Sở",
      subtitle: "Báo cáo và phân tích chuyên sâu 3 trụ cột: Doanh thu thực thu, Tỷ lệ sử dụng kho (công suất/lấp đầy) và Hiệu suất vận hành từng cơ sở.",
      icon: TrendingUp,
    },
    reports: {
      title: "Báo Cáo Tổng Hợp & Xuất Dữ Liệu Toàn Hệ Thống",
      subtitle: "Lọc dữ liệu theo cơ sở kho, loại hình kho, trạng thái thanh toán và xuất tệp Excel/CSV chuẩn.",
      icon: Download,
    },
  };

  const currentTabInfo = tabLabels[activeTab];
  const TabHeaderIcon = currentTabInfo.icon;

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans text-slate-900 antialiased flex flex-col overflow-hidden selection:bg-blue-600/20 selection:text-blue-600">
      
      {/* 1. TOP EXECUTIVE HEADER (Exact staff style) */}
      <header className="h-18 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 shrink-0 z-40 flex items-center justify-between shadow-2xs">
        {/* Left: Sidebar Toggle, Brand Logo & Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95 shrink-0"
            title="Đóng / mở menu bên"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-base tracking-tight text-slate-900 block leading-tight">
                SmartStorage
              </span>
              <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Cổng Vận Hành Chuỗi
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 pl-3 border-l border-slate-200 min-w-0">
            <span>Hệ Thống</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-blue-900 font-bold truncate">
              {currentTabInfo.title.split(" - ")[0]}
            </span>
          </div>
        </div>

        {/* Cross-Role Quick Switcher */}
        <div className="hidden xl:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <Link
            href="/manager"
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white transition"
          >
            Role 3: Quản Lý Cơ Sở
          </Link>
          <span className="px-2.5 py-1 rounded-lg bg-white text-amber-700 shadow-2xs font-bold">
            Role 4: Vận Hành Chuỗi
          </span>
          <Link
            href="/admin"
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-white transition"
          >
            Role 5: Quản Trị Hệ Thống
          </Link>
        </div>

        {/* Right: Refresh button, Profile Pill & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadInitialData}
            disabled={isLoading}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            <span>Đồng bộ</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 py-1 px-2 rounded-full border border-slate-200 bg-slate-50/80">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                  {getInitials(currentUser.fullName, currentUser.email)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.fullName || "Quản Lý Vận Hành"}
                  </div>
                  <div className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider">
                    OPERATIONS MANAGER
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-xs transition"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* Operations Sidebar (Light theme matching /staff) */}
        <aside
          className={`bg-white text-slate-800 border-r border-slate-200 flex flex-col shrink-0 select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } fixed lg:static inset-y-0 left-0 z-50 lg:z-30 h-screen lg:h-full ${
            isSidebarCollapsed ? "lg:w-[72px]" : "lg:w-72"
          } w-72`}
        >
          {/* Mobile Drawer Header */}
          <div className="lg:hidden h-18 border-b border-slate-200 flex items-center bg-white shrink-0">
            <div className="w-[72px] h-full flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="inline-flex items-center gap-2 pr-4">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-900">
                  SmartStorage
                </span>
                <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  Vận Hành Chuỗi
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
            {/* Section 1 */}
            <div
              className={`px-3 pt-2 pb-1 text-[13px] font-bold text-slate-900 flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isSidebarCollapsed ? "max-h-0 opacity-0 py-0" : "max-h-8 opacity-100"
              }`}
            >
              <span>Quản Trị Chuỗi Cơ Sở</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {navSection1.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center h-12 rounded-xl transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                      : "text-slate-700 hover:bg-slate-100 font-medium"
                  }`}
                  title={item.label}
                >
                  <div className="w-[56px] h-12 shrink-0 flex items-center justify-center">
                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-slate-600"}`} />
                  </div>

                  <span
                    className={`text-[14px] whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 text-left flex-1 ${
                      isSidebarCollapsed ? "max-w-0 opacity-0 -translate-x-2" : "opacity-100 translate-x-0"
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`mr-2 text-xs font-bold px-2 py-0.5 rounded-full transition-all shrink-0 ${
                        isActive ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
                      } ${isSidebarCollapsed ? "max-w-0 opacity-0 overflow-hidden px-0" : "max-w-[40px] opacity-100"}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Divider */}
            <hr className="my-2 border-slate-200 mx-1" />

            {/* Section 2 */}
            <div
              className={`px-3 pt-2 pb-1 text-[13px] font-bold text-slate-900 flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isSidebarCollapsed ? "max-h-0 opacity-0 py-0" : "max-h-8 opacity-100"
              }`}
            >
              <span>Phân Tích &amp; Báo Cáo</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {navSection2.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center h-12 rounded-xl transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                      : "text-slate-700 hover:bg-slate-100 font-medium"
                  }`}
                  title={item.label}
                >
                  <div className="w-[56px] h-12 shrink-0 flex items-center justify-center">
                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-slate-600"}`} />
                  </div>

                  <span
                    className={`text-[14px] whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 text-left flex-1 ${
                      isSidebarCollapsed ? "max-w-0 opacity-0 -translate-x-2" : "opacity-100 translate-x-0"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* User Footer in Sidebar */}
          <div className="py-3 px-2 border-t border-slate-200 bg-slate-50/80 mt-auto shrink-0 overflow-hidden">
            {currentUser ? (
              <div className="flex items-center">
                <div className="w-[56px] shrink-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0 tracking-wider">
                    {getInitials(currentUser.fullName, currentUser.email)}
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 whitespace-nowrap flex-1 min-w-0 pr-1 ${
                    isSidebarCollapsed ? "max-w-0 opacity-0" : "opacity-100"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {currentUser.fullName || "Quản Lý Vận Hành"}
                  </div>
                  <div className="text-[11px] text-blue-600 font-semibold truncate">
                    BUSINESS OPS
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-auto mr-1 ${
                    isSidebarCollapsed ? "hidden" : "block"
                  }`}
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="px-1 py-1">
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Đăng nhập</span>}
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* 3. MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Standard Header Banner Card (matching staff/dashboard) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <TabHeaderIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentTabInfo.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {currentTabInfo.subtitle}
                  </p>
                </div>
              </div>

              {activeTab === "facilities" && (
                <button
                  type="button"
                  onClick={openAddFacilityModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs self-start md:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Cơ Sở Mới</span>
                </button>
              )}

              {activeTab === "policies" && (
                <button
                  type="button"
                  onClick={handleSavePolicies}
                  disabled={isSavingPolicy}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs self-start md:self-auto cursor-pointer"
                >
                  {isSavingPolicy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Lưu &amp; Áp Dụng Toàn Hệ Thống</span>
                </button>
              )}

              {activeTab === "pricing_fees" && (
                <button
                  type="button"
                  onClick={() => setIsAddFeeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs self-start md:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Loại Phụ Phí</span>
                </button>
              )}

              {activeTab === "reports" && (
                <button
                  type="button"
                  onClick={exportReportToCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs self-start md:self-auto cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Báo Cáo CSV (Excel)</span>
                </button>
              )}
            </div>

            {/* TAB 1: DANH SÁCH CƠ SỞ KHO */}
            {activeTab === "facilities" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={facilitySearch}
                      onChange={(e) => setFacilitySearch(e.target.value)}
                      placeholder="Tìm tên cơ sở, mã chi nhánh, địa chỉ..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={facilityStatusFilter}
                    onChange={(e) => setFacilityStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 outline-none"
                  >
                    <option value="ALL">Tất Cả Trạng Thái</option>
                    <option value="ACTIVE">Đang Vận Hành</option>
                    <option value="INACTIVE">Tạm Ngưng</option>
                  </select>

                  <span className="text-xs font-bold text-slate-500 ml-auto">
                    Tổng số: <strong className="text-blue-600">{filteredFacilities.length}</strong> cơ sở
                  </span>
                </div>

                {/* Facilities Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFacilities.map((fac) => (
                    <div
                      key={fac.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
                              MÃ: {fac.code}
                            </span>
                            <h3 className="text-base font-black text-slate-900 mt-2 leading-snug">
                              {fac.name}
                            </h3>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                              (fac.status === "ACTIVE" || fac.isActive === true)
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : fac.status === "UNDER_MAINTENANCE"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {fac.status === "ACTIVE" || fac.isActive === true
                              ? "Đang Vận Hành"
                              : fac.status === "UNDER_MAINTENANCE"
                              ? "Đang Bảo Trì"
                              : "Tạm Ngưng"}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{fac.address}</span>
                          </div>
                          {fac.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{fac.phone}</span>
                            </div>
                          )}
                          {fac.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{fac.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">
                          Quy mô: <strong className="text-slate-800">{fac.totalFloors || 3} Tầng</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFacilityForUnits(String(fac.id));
                              setUnitsSubTab("unit_types");
                              setActiveTab("storage_units");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition"
                          >
                            Xem Sơ Đồ Kho
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditFacilityModal(fac)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition"
                          >
                            Chỉnh Sửa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            
            {/* TAB: QUẢN LÝ KHO & SƠ ĐỒ MẶT BẰNG (TẦN SUẤT SỬ DỤNG KHO) */}
            {activeTab === "storage_units" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Sub-tabs header: Loại kho & Bảng giá (Thêm kho, thêm ô kho, giá thuê, tiền cọc) vs Sơ đồ ô kho & Tần suất sử dụng */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUnitsSubTab("unit_types")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                        unitsSubTab === "unit_types"
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Boxes className="w-4 h-4 text-blue-600" />
                      <span>Loại Kho &amp; Bảng Giá (Thêm Kho / Thêm Ô Kho / Tiền Cọc)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitsSubTab("layout")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                        unitsSubTab === "layout"
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>Sơ Đồ Mặt Bằng &amp; Tần Suất Sử Dụng</span>
                    </button>
                  </div>

                  {unitsSubTab === "layout" && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500">Cơ sở xem sơ đồ:</span>
                      <select
                        value={selectedFacilityForUnits}
                        onChange={(e) => setSelectedFacilityForUnits(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 outline-none cursor-pointer"
                      >
                        {facilities.map((f) => (
                          <option key={f.id} value={String(f.id)}>
                            {f.name} ({f.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* SubTab 1: Quản lý loại kho & Bảng giá, thêm ô kho trống, quyết định cọc & thuê */}
                {unitsSubTab === "unit_types" && (
                  <UnitTypesPricingManager
                    currentFacilityId={selectedFacilityForUnits}
                    currentUser={{
                      ...currentUser,
                      role: "BUSINESS_OPERATIONS_MANAGER",
                    }}
                  />
                )}

                {/* SubTab 2: Sơ đồ mặt bằng chi tiết 24/7 & tần suất sử dụng */}
                {unitsSubTab === "layout" && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6">
                    <FacilityLayoutView
                      key={selectedFacilityForUnits}
                      facilityId={selectedFacilityForUnits}
                      userRole="BUSINESS_OPERATIONS_MANAGER"
                      initialSubTab="layout"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CHÍNH SÁCH CHO THUÊ */}
            {activeTab === "policies" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                {/* Card 1: Tiền Cọc & Hủy */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Chính Sách Đặt Cọc &amp; Hủy Phòng</h3>
                      <p className="text-[11px] text-slate-500">Quy định tiền giữ chỗ và điều kiện hoàn tiền cọc</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tỷ Lệ Tiền Cọc Giữ Chỗ Lúc Đặt Kho (% trên tổng đơn)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={depositPercent}
                          onChange={(e) => setDepositPercent(Number(e.target.value))}
                          className="flex-1 accent-blue-600"
                        />
                        <span className="font-black text-base text-blue-600 w-16 text-right">
                          {depositPercent}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hệ Số Cọc An Ninh Bảo Đảm Tài Sản (Tháng tiền thuê)
                      </label>
                      <select
                        value={securityDepositMultiplier}
                        onChange={(e) => setSecurityDepositMultiplier(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                      >
                        <option value="0.5">0.5 Tháng tiền thuê</option>
                        <option value="1.0">1.0 Tháng tiền thuê (Khuyên dùng)</option>
                        <option value="1.5">1.5 Tháng tiền thuê</option>
                        <option value="2.0">2.0 Tháng tiền thuê</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Hoàn Cọc Khi Khách Hủy Trước Nhận Kho:
                      </p>
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span>Hủy trước &gt;= {cancellationDays100} ngày:</span>
                        <strong className="text-emerald-600">Hoàn 100% Tiền Cọc</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span>Hủy trước {cancellationDays50} - {cancellationDays100 - 1} ngày:</span>
                        <strong className="text-blue-600">Hoàn 50% Tiền Cọc</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span>Hủy trong vòng {cancellationDays50} ngày hoặc vắng mặt:</span>
                        <strong className="text-rose-600">Không Hoàn Cọc</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Quá Hạn & Chế Tài */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Chính Sách Xử Lý Quá Hạn &amp; Chế Tài</h3>
                      <p className="text-[11px] text-slate-500">Thời gian ân hạn, tiền phạt theo ngày và khóa ô kho</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Thời Gian Ân Hạn Trễ Hạn (Grace Period)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={gracePeriodDays}
                          onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 w-28 bg-slate-50"
                        />
                        <span className="text-xs text-slate-500 font-medium">
                          ngày (Chưa áp dụng chế tài cưỡng chế khóa ô kho)
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tỷ Lệ Phạt Trễ Hạn Mỗi Ngày (% trên tiền thuê tháng)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="10"
                          value={dailyFinePercent}
                          onChange={(e) => setDailyFinePercent(Number(e.target.value))}
                          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 w-28 bg-slate-50"
                        />
                        <span className="text-xs text-slate-500 font-medium">
                          % / ngày (Mặc định 1.5% ngày tương đương ~45% / tháng)
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngưỡng Kích Hoạt Khóa Điện Tử Cưỡng Chế (Overlock)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={autoLockoutDays}
                          onChange={(e) => setAutoLockoutDays(Number(e.target.value))}
                          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 w-28 bg-slate-50"
                        />
                        <span className="text-xs text-slate-500 font-medium">
                          ngày quá hạn (Tự động vô hiệu hóa mã PIN &amp; thẻ vào kho)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900 leading-relaxed font-medium">
                      <strong>Lưu ý vận hành:</strong> Khi vượt ngưỡng {autoLockoutDays} ngày trễ hạn, hệ thống tự động gán trạng thái <em>OVERLOCKED</em> để chi nhánh bắt đầu quy trình xử lý theo điều khoản hợp đồng.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BIỂU PHÍ & ƯU ĐÃI */}
            {activeTab === "pricing_fees" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Standard Price Ranges Reference */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    Khung Giá Thuê Tiêu Chuẩn Theo Nhóm Diện Tích Toàn Hệ Thống
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhóm Micro Locker</span>
                      <p className="text-sm font-black text-slate-900 mt-1">1.0 m² - 2.5 m²</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">350.000 - 650.000 đ/tháng</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhóm Kho Nhỏ (Small)</span>
                      <p className="text-sm font-black text-slate-900 mt-1">3.0 m² - 5.0 m²</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">800.000 - 1.400.000 đ/tháng</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhóm Kho Vừa (Medium)</span>
                      <p className="text-sm font-black text-slate-900 mt-1">6.0 m² - 12.0 m²</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">1.600.000 - 3.200.000 đ/tháng</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhóm Kho Lớn / Doanh Nghiệp</span>
                      <p className="text-sm font-black text-slate-900 mt-1">&gt; 15.0 m²</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">&gt; 4.000.000 đ/tháng</p>
                    </div>
                  </div>
                </div>

                {/* Fee Types Table (Full width) */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Danh Mục Biểu Phí Phụ Thu Toàn Hệ Thống (Extra Fee Types)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Các mức phụ phí phát sinh khi kiểm tra trả kho, hư hại cơ sở vật chất hoặc xử lý quá hạn
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      {feeTypes.length} loại biểu phí
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="px-6 py-3.5">Mã &amp; Tên Biểu Phí</th>
                          <th className="px-6 py-3.5">Phạm Vi Áp Dụng</th>
                          <th className="px-6 py-3.5">Mô Tả Quy Định</th>
                          <th className="px-6 py-3.5 text-right">Mức Phí Quy Định</th>
                          <th className="px-6 py-3.5 text-center w-28">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {feeTypes.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                              Chưa có biểu phí phụ thu nào được thiết lập trong hệ thống
                            </td>
                          </tr>
                        ) : (
                          feeTypes.map((fee) => (
                            <tr key={fee.id} className="hover:bg-slate-50/70 transition">
                              <td className="px-6 py-4">
                                <p className="font-black text-slate-900 text-sm">{fee.name}</p>
                                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">{fee.code}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">
                                  {fee.appliesTo === "CHECKOUT" ? "Lúc Trả Kho (Checkout)" : fee.appliesTo === "LATE" ? "Quá Hạn (Late Fee)" : "Chung (General)"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {fee.description || "Áp dụng theo quy chế bàn giao và nghiệm thu"}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                                {new Intl.NumberFormat("vi-VN").format(fee.defaultAmount)} đ
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditFeeModal(fee)}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Chỉnh sửa biểu phí"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFeeType(fee.id)}
                                    disabled={isDeletingFee}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Xóa biểu phí"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: HIỆU SUẤT & DOANH THU */}
            {activeTab === "performance" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <MultiBranchRevenueAnalytics />
              </div>
            )}

            {/* TAB 5: BÁO CÁO & XUẤT DỮ LIỆU */}
            {activeTab === "reports" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      placeholder="Tìm theo mã hợp đồng, khách hàng, số ô..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={reportFacilityFilter}
                    onChange={(e) => setReportFacilityFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 outline-none"
                  >
                    <option value="ALL">Tất Cả Cơ Sở Kho</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={String(f.id)}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>

                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 outline-none"
                  >
                    <option value="ALL">Tất Cả Trạng Thái</option>
                    <option value="ACTIVE">Đang Thuê (ACTIVE)</option>
                    <option value="COMPLETED">Đã Hoàn Tất (COMPLETED)</option>
                    <option value="OVERDUE">Quá Hạn (OVERDUE)</option>
                    <option value="CANCELLED">Đã Hủy (CANCELLED)</option>
                  </select>

                  <span className="text-xs font-bold text-slate-500 ml-auto">
                    Tìm thấy: <strong className="text-blue-600">{filteredReportContracts.length}</strong> bản ghi
                  </span>
                </div>

                {/* Contracts Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Mã Hợp Đồng</th>
                          <th className="px-4 py-3">Khách Hàng</th>
                          <th className="px-4 py-3">Cơ Sở &amp; Ô Kho</th>
                          <th className="px-4 py-3">Thời Hạn</th>
                          <th className="px-4 py-3 text-right">Tiền Thuê / Tháng</th>
                          <th className="px-4 py-3 text-center">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReportContracts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                              Không có dữ liệu hợp đồng nào thỏa mãn bộ lọc
                            </td>
                          </tr>
                        ) : (
                          filteredReportContracts.slice(0, 30).map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 font-mono font-bold text-slate-800">
                                {c.contractNumber || c.id}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-black text-slate-900">{c.customer?.fullName || c.customerName || "N/A"}</p>
                                <span className="text-[10px] text-slate-400">{c.customer?.phone || c.customerPhone || ""}</span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800">{c.facility?.name || "Cơ sở"}</p>
                                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                                  Ô #{c.storageUnit?.unitNumber || c.unitNumber || "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : "--"} &rarr;{" "}
                                {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "--"}
                              </td>
                              <td className="px-4 py-3 text-right font-black text-slate-900">
                                {new Intl.NumberFormat("vi-VN").format(c.monthlyRent || c.rentalFee || 0)} đ
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                    c.status === "ACTIVE"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : c.status === "OVERDUE"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {c.status || "ACTIVE"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL: THÊM / SỬA CƠ SỞ KHO */}
      {isAddFacilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingFacility ? "Chỉnh Sửa Thông Tin Cơ Sở" : "Thêm Cơ Sở Kho Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Cơ Sở Kho (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kho Tự Quản Tân Bình"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Cơ Sở (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: FAC_TB"
                    value={facCode}
                    onChange={(e) => setFacCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng Thái Vận Hành</label>
                  <select
                    value={facStatus}
                    onChange={(e) => setFacStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 outline-none"
                  >
                    <option value="ACTIVE">Đang Vận Hành (ACTIVE)</option>
                    <option value="INACTIVE">Tạm Đóng (INACTIVE)</option>
                    <option value="UNDER_MAINTENANCE">Bảo Trì (MAINTENANCE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa Chỉ Chi Tiết (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, đường, phường, quận, thành phố..."
                  value={facAddress}
                  onChange={(e) => setFacAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="09xx xxx xxx"
                    value={facPhone}
                    onChange={(e) => setFacPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Liên Hệ</label>
                  <input
                    type="email"
                    placeholder="branch@selfstorage.vn"
                    value={facEmail}
                    onChange={(e) => setFacEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddFacilityModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingFacility}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition flex items-center gap-1.5"
                >
                  {isSavingFacility ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingFacility ? "Cập Nhật" : "Tạo Cơ Sở"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL: CHỈNH SỬA BIỂU PHÍ */}
      {isEditFeeModalOpen && editingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Chỉnh Sửa Biểu Phí Phụ Thu</h3>
                <p className="text-xs text-slate-400">Mã phí: {editingFee.code}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditFeeModalOpen(false);
                  setEditingFee(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFeeType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Phụ Phí (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phí vệ sinh kho bẩn, Phí mất thẻ từ"
                  value={editFeeName}
                  onChange={(e) => setEditFeeName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã Phụ Phí (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: FEE_CLEANING, FEE_KEY_LOST"
                  value={editFeeCode}
                  onChange={(e) => setEditFeeCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền Quy Định (đ)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={editFeeAmount}
                    onChange={(e) => setEditFeeAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Áp Dụng Cho</label>
                  <select
                    value={editFeeAppliesTo}
                    onChange={(e) => setEditFeeAppliesTo(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 outline-none"
                  >
                    <option value="CHECKOUT">Lúc Trả Kho (Checkout)</option>
                    <option value="LATE">Quá Hạn (Late)</option>
                    <option value="GENERAL">Chung (General)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô Tả Quy Định</label>
                <textarea
                  rows={3}
                  value={editFeeDescription}
                  onChange={(e) => setEditFeeDescription(e.target.value)}
                  placeholder="Quy định áp dụng khi nào..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditFeeModalOpen(false);
                    setEditingFee(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM BIỂU PHÍ */}
      {isAddFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Thêm Loại Biểu Phí Phụ Thu</h3>
              <button
                type="button"
                onClick={() => setIsAddFeeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeeType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Phụ Phí (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phí vệ sinh kho bẩn, Phí mất thẻ từ"
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã Phụ Phí (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: FEE_CLEANING, FEE_KEY_LOST"
                  value={feeCode}
                  onChange={(e) => setFeeCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền Mặc Định (đ)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Áp Dụng Cho</label>
                  <select
                    value={feeAppliesTo}
                    onChange={(e) => setFeeAppliesTo(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 outline-none"
                  >
                    <option value="CHECKOUT">Lúc Trả Kho (Checkout)</option>
                    <option value="LATE">Quá Hạn (Late)</option>
                    <option value="GENERAL">Chung (General)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddFeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition"
                >
                  Tạo Biểu Phí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          </div>
  );
}
