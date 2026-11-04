"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  Key,
  Database,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Menu,
  ChevronRight,
  LogOut,
  Activity,
  Check,
  X,
  Clock,
  UserCheck,
  UserX,
  Filter,
  Monitor,
  Smartphone,
  Globe,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { clearClientAuth } from "@/lib/authUtils";
import { usersApi, UserItem, ActivityLogItem, LoginHistoryItem } from "@/lib/api/users";
import { facilitiesApi, FacilityItem } from "@/lib/api/facilities";

type AdminTab = "accounts" | "roles" | "facility_access" | "login_history" | "audit_logs";

const SYSTEM_ROLES = [
  {
    name: "STORAGE_CUSTOMER",
    title: "1. Storage Customer",
    titleVi: "Khách Hàng Thuê Kho",
    desc: "Xem cơ sở, loại kho, bảng giá; đặt kho, thanh toán cọc/phí; check-in nhận kho; quản lý các ô kho đã thuê; gửi sự cố khiếu nại.",
    color: "bg-sky-50 text-sky-800 border-sky-300",
    badge: "bg-sky-100 text-sky-800",
    rowBorder: "border-l-sky-500",
    avatarBg: "bg-sky-600",
    scope: "Customer Portal & Mobile App",
  },
  {
    name: "FACILITY_STAFF",
    title: "2. Facility Staff",
    titleVi: "Nhân Viên Vận Hành Cơ Sở",
    desc: "Kiểm tra khách đến nhận kho; hỗ trợ bàn giao, khóa, mã PIN; cập nhật trạng thái ô kho; nghiệm thu khi khách trả kho; xử lý sự cố tại chỗ.",
    color: "bg-emerald-50 text-emerald-800 border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800",
    rowBorder: "border-l-emerald-500",
    avatarBg: "bg-emerald-600",
    scope: "Cơ sở kho được phân công",
  },
  {
    name: "FACILITY_MANAGER",
    title: "3. Facility Manager",
    titleVi: "Quản Lý Chi Nhánh",
    desc: "Quản lý ô kho tại cơ sở (loại kho, giá, trạng thái); chỉ định ô kho cho khách; giám sát hợp đồng & thanh toán; duyệt trả kho/gia hạn; phân công nhân viên.",
    color: "bg-indigo-50 text-indigo-800 border-indigo-300",
    badge: "bg-indigo-100 text-indigo-800",
    rowBorder: "border-l-indigo-500",
    avatarBg: "bg-indigo-600",
    scope: "Toàn bộ dữ liệu tại cơ sở được phân công",
  },
  {
    name: "BUSINESS_OPERATIONS_MANAGER",
    title: "4. Business Operations Manager",
    titleVi: "Giám Đốc Vận Hành Chuỗi",
    desc: "Quản lý danh sách tất cả cơ sở; thiết lập chính sách chung (cọc, gia hạn, hủy, phạt trễ); quản lý khung giá & biểu phí phụ thu; theo dõi doanh thu toàn chuỗi.",
    color: "bg-amber-50 text-amber-900 border-amber-300",
    badge: "bg-amber-100 text-amber-900",
    rowBorder: "border-l-amber-500",
    avatarBg: "bg-amber-600",
    scope: "Toàn bộ cơ sở kho trong hệ thống (Global)",
  },
  {
    name: "SYSTEM_ADMINISTRATOR",
    title: "5. System Administrator",
    titleVi: "Quản Trị Viên Hệ Thống",
    desc: "Quản lý toàn bộ tài khoản người dùng; phân công vai trò (Role Assignment); cấu hình quyền truy cập dữ liệu cơ sở; theo dõi lịch sử đăng nhập & nhật ký truy vết.",
    color: "bg-rose-50 text-rose-800 border-rose-300",
    badge: "bg-rose-100 text-rose-800",
    rowBorder: "border-l-rose-500",
    avatarBg: "bg-rose-600",
    scope: "Toàn quyền quản trị nền tảng (Root Access)",
  },
];

export default function SystemAdministratorPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("accounts");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // User & Data State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityLogItem[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);

  // Search & Filter State
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [facilityFilter, setFacilityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Login History Filter
  const [loginSearch, setLoginSearch] = useState("");
  const [loginRoleFilter, setLoginRoleFilter] = useState("ALL");

  // Audit Logs Filter
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");

  // Modals
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isAssignFacilityModalOpen, setIsAssignFacilityModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Create User Form (Onboarding)
  const [createAccountScope, setCreateAccountScope] = useState<"INTERNAL" | "CUSTOMER">("INTERNAL");
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("Storage@2026");
  const [formRole, setFormRole] = useState("FACILITY_STAFF");
  const [formFacilityId, setFormFacilityId] = useState("");
  const [formCreateReason, setFormCreateReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
    roleTitle: string;
    scopeLabel: string;
  } | null>(null);

  // Change Role Form (Role Transition)
  const [newRoleName, setNewRoleName] = useState("");
  const [roleChangeFacilityId, setRoleChangeFacilityId] = useState("");
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);

  // Assign Facility Form
  const [targetFacilityId, setTargetFacilityId] = useState("");
  const [roleInFacility, setRoleInFacility] = useState("STAFF");

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(`SS@${randomPart}`);
  };

  // Load User from LocalStorage & Strict Role Guard for Role 5
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) {
          window.location.replace("/login?redirect=/admin");
          return;
        }
        const user = JSON.parse(raw);
        setCurrentUser(user);

        const role = (
          typeof user?.role === "string" ? user.role : user?.role?.name || ""
        ).toUpperCase();

        const isAdmin =
          role === "SYSTEM_ADMINISTRATOR" ||
          role === "ADMIN" ||
          role.includes("ADMIN");

        if (!isAdmin) {
          if (role === "BUSINESS_OPERATIONS_MANAGER" || role === "OPS" || role.includes("OPERATIONS_MANAGER")) {
            toast.info("Đang chuyển sang Cổng Vận Hành Doanh Nghiệp...");
            window.location.replace("/operations");
            return;
          }
          if (role === "FACILITY_MANAGER" || role === "MANAGER" || role.includes("MANAGER")) {
            toast.info("Đang chuyển sang Cổng Quản Lý Cơ Sở...");
            window.location.replace("/manager");
            return;
          }
          if (role.includes("STAFF")) {
            toast.warning("Tài khoản Nhân viên không có quyền Quản Trị Hệ Thống. Đã chuyển về Cổng Nhân Viên.");
            window.location.replace("/staff");
            return;
          }
          toast.error("Chỉ Quản Trị Viên Hệ Thống mới có quyền truy cập Cổng Quản Trị.");
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
    return "AD";
  };

  const handleLogout = () => {
    clearClientAuth();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, facRes, logsRes, loginsRes] = await Promise.allSettled([
        usersApi.getUsers(),
        facilitiesApi.getFacilities(),
        usersApi.getAuditLogs({ limit: 100 }),
        usersApi.getLoginHistory({ limit: 100 }),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value) {
        setUsers(usersRes.value);
      }
      if (facRes.status === "fulfilled" && facRes.value) {
        const list = Array.isArray(facRes.value) ? facRes.value : (facRes.value as any)?.data || [];
        setFacilities(list);
      }
      if (logsRes.status === "fulfilled" && logsRes.value) {
        setAuditLogs(logsRes.value);
      }
      if (loginsRes.status === "fulfilled" && loginsRes.value) {
        setLoginHistory(loginsRes.value);
      }
    } catch (err) {
      console.warn("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const search = userSearch.toLowerCase().trim();
      const matchSearch =
        !search ||
        u.fullName?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.phone?.toLowerCase().includes(search);

      const uRole = (u.role || "").toUpperCase();
      const matchRole =
        roleFilter === "ALL" ||
        uRole === roleFilter ||
        (roleFilter === "CUSTOMER" && uRole.includes("CUSTOMER")) ||
        (roleFilter === "STAFF" && uRole.includes("STAFF")) ||
        (roleFilter === "MANAGER" && uRole === "FACILITY_MANAGER");

      const matchFacility =
        facilityFilter === "ALL" ||
        String(u.facilityId || "") === facilityFilter;

      const matchStatus = statusFilter === "ALL" || u.status === statusFilter;

      return matchSearch && matchRole && matchFacility && matchStatus;
    });
  }, [users, userSearch, roleFilter, facilityFilter, statusFilter]);

  // Filtered Login History
  const filteredLoginHistory = useMemo(() => {
    return loginHistory.filter((item) => {
      const s = loginSearch.toLowerCase().trim();
      const u = item.user;
      const matchSearch =
        !s ||
        u?.fullName?.toLowerCase().includes(s) ||
        u?.email?.toLowerCase().includes(s) ||
        item.ipAddress?.toLowerCase().includes(s) ||
        item.deviceInfo?.toLowerCase().includes(s);

      const role = (u?.role?.name || "").toUpperCase();
      const matchRole =
        loginRoleFilter === "ALL" ||
        role === loginRoleFilter ||
        (loginRoleFilter === "STAFF" && role.includes("STAFF")) ||
        (loginRoleFilter === "CUSTOMER" && role.includes("CUSTOMER"));

      return matchSearch && matchRole;
    });
  }, [loginHistory, loginSearch, loginRoleFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((item) => {
      const s = auditSearch.toLowerCase().trim();
      const matchSearch =
        !s ||
        item.description?.toLowerCase().includes(s) ||
        item.action?.toLowerCase().includes(s) ||
        item.user?.email?.toLowerCase().includes(s);

      const matchAction =
        auditActionFilter === "ALL" || item.action === auditActionFilter;

      return matchSearch && matchAction;
    });
  }, [auditLogs, auditSearch, auditActionFilter]);

  // Kiểm tra cơ sở đang chọn khi tạo tài khoản đã có Quản lý (FACILITY_MANAGER) hay chưa
  const existingManagerAtCreateFacility = useMemo(() => {
    if (formRole !== "FACILITY_MANAGER" || !formFacilityId) return null;
    return users.find(
      (u) =>
        u.status === "ACTIVE" &&
        u.role === "FACILITY_MANAGER" &&
        String(u.facilityId || u.assignedFacility?.id || "") === String(formFacilityId)
    );
  }, [users, formRole, formFacilityId]);

  // Kiểm tra cơ sở đang chọn khi đổi vai trò sang Quản lý đã có Quản lý khác hay chưa
  const existingManagerAtRoleChangeFacility = useMemo(() => {
    if (newRoleName !== "FACILITY_MANAGER" || !roleChangeFacilityId || !selectedUser) return null;
    return users.find(
      (u) =>
        u.id !== selectedUser.id &&
        u.status === "ACTIVE" &&
        u.role === "FACILITY_MANAGER" &&
        String(u.facilityId || u.assignedFacility?.id || "") === String(roleChangeFacilityId)
    );
  }, [users, newRoleName, roleChangeFacilityId, selectedUser]);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formEmail.trim()) {
      toast.error("Vui lòng điền đầy đủ họ tên và email!");
      return;
    }

    const isFacilityScoped = formRole === "FACILITY_STAFF" || formRole === "FACILITY_MANAGER";

    // Ràng buộc bắt buộc gán cơ sở đối với Staff và Facility Manager
    if (isFacilityScoped && !formFacilityId) {
      toast.error("Vai trò Nhân viên (Staff) và Quản lý (Facility Manager) bắt buộc phải gán cơ sở trực thuộc!");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPassword = formPassword.trim() || "Storage@2026";
      const targetFacilityObj = isFacilityScoped
        ? facilities.find((f) => String(f.id) === String(formFacilityId))
        : null;
      const roleObj = SYSTEM_ROLES.find((r) => r.name === formRole);

      await usersApi.createUser({
        fullName: formFullName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim() || undefined,
        password: finalPassword,
        roleName: formRole,
        facilityId: isFacilityScoped ? formFacilityId : undefined,
        reason: formCreateReason.trim() || undefined,
      });

      toast.success(`Đã tạo tài khoản ${formFullName.trim()} và cấp quyền thành công!`);

      // Hiển thị thẻ bàn giao thông tin đăng nhập (Copy Credentials Card)
      setCreatedCredentials({
        fullName: formFullName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: finalPassword,
        roleTitle: roleObj ? `${roleObj.titleVi} (${roleObj.title})` : formRole,
        scopeLabel: isFacilityScoped
          ? targetFacilityObj
            ? `${targetFacilityObj.name} (${targetFacilityObj.code})`
            : "Chi nhánh được gán"
          : formRole === "STORAGE_CUSTOMER"
            ? "Cổng Khách Hàng (Customer Portal)"
            : "Toàn Hệ Thống (Global Scope - Mọi chi nhánh)",
      });

      setFormFullName("");
      setFormEmail("");
      setFormPhone("");
      setFormCreateReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tạo tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle User Status (Lock/Unlock)
  const handleToggleStatus = async (user: UserItem) => {
    if (currentUser && String(currentUser.id) === String(user.id)) {
      toast.error("Bạn không thể tự khóa tài khoản Quản trị viên đang đăng nhập của chính mình!");
      return;
    }
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const actionLabel = nextStatus === "ACTIVE" ? "Mở khóa tài khoản" : "Khóa tài khoản";
    if (
      !confirm(
        `Xác nhận ${actionLabel} cho người dùng ${user.fullName} (${user.email})?\n\n` +
          (nextStatus === "SUSPENDED"
            ? "Khi bị khóa, người dùng sẽ bị thu hồi phiên đăng nhập ngay lập tức và không thể truy cập hệ thống."
            : "Khi mở khóa, người dùng có thể đăng nhập bình thường.")
      )
    ) {
      return;
    }

    try {
      await usersApi.updateUserStatus(user.id, nextStatus as any);
      toast.success(
        nextStatus === "ACTIVE"
          ? `Đã mở khóa tài khoản cho ${user.fullName}!`
          : `Đã khóa tài khoản ${user.fullName} thành công!`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus as any } : u))
      );
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  // Handle Submit Role Change
  const handleSubmitRoleChange = async () => {
    if (!selectedUser || !newRoleName) return;

    if (currentUser && String(currentUser.id) === String(selectedUser.id) && newRoleName !== "SYSTEM_ADMINISTRATOR") {
      toast.error("Không thể tự hạ quyền tài khoản Quản trị viên đang đăng nhập!");
      return;
    }

    const isFacilityScoped =
      newRoleName === "FACILITY_STAFF" || newRoleName === "FACILITY_MANAGER";

    // Ràng buộc bắt buộc gán cơ sở khi đổi sang Staff hoặc Facility Manager
    if (isFacilityScoped && !roleChangeFacilityId) {
      toast.error(
        "Vai trò Nhân viên (Staff) và Quản lý (Facility Manager) bắt buộc phải chọn cơ sở trực thuộc!"
      );
      return;
    }

    setIsRoleSubmitting(true);
    try {
      await usersApi.updateUserRole(selectedUser.id, newRoleName, {
        facilityId: isFacilityScoped ? roleChangeFacilityId : undefined,
        reason: roleChangeReason.trim() || undefined,
      });

      toast.success(`Đã chuyển đổi vai trò nghiệp vụ cho ${selectedUser.fullName} thành công!`);
      setIsChangeRoleModalOpen(false);
      setRoleChangeReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Không thể thay đổi vai trò");
    } finally {
      setIsRoleSubmitting(false);
    }
  };

  // Handle Submit Facility Assignment
  const handleSubmitFacilityAssignment = async () => {
    if (!selectedUser || !targetFacilityId) return;
    try {
      await usersApi.assignFacility(selectedUser.id, targetFacilityId, roleInFacility);
      toast.success(`Đã phân công cơ sở thành công cho ${selectedUser.fullName}!`);
      setIsAssignFacilityModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi phân công cơ sở");
    }
  };

  // Navigation Items for Sidebar
  const navSection1 = [
    { id: "accounts" as AdminTab, label: "Quản trị người dùng", icon: Users, badge: users.length },
    { id: "roles" as AdminTab, label: "Phân quyền vai trò IAM", icon: Key },
    { id: "facility_access" as AdminTab, label: "Phân quyền cơ sở kho", icon: Building2, badge: facilities.length },
  ];

  const navSection2 = [
    { id: "login_history" as AdminTab, label: "Lịch sử đăng nhập", icon: Clock, badge: loginHistory.length },
    { id: "audit_logs" as AdminTab, label: "Nhật ký thao tác Audit", icon: Activity, badge: auditLogs.length },
  ];

  const tabLabels: Record<AdminTab, { title: string; subtitle: string; icon: any }> = {
    accounts: {
      title: "Quản Lý Toàn Bộ Tài Khoản Người Dùng Hệ Thống",
      subtitle: "Phân công 5 vai trò IAM, quản lý thông tin tài khoản, gán cơ sở trực thuộc và kiểm soát khóa/mở khóa tài khoản.",
      icon: Users,
    },
    roles: {
      title: "Cấu Hình & Đối Soát 5 Vai Trò Hệ Thống (RBAC Matrix)",
      subtitle: "Storage Customer, Facility Staff, Facility Manager, Business Operations Manager và System Administrator.",
      icon: Key,
    },
    facility_access: {
      title: "Cấu Hình Phân Quyền Truy Cập Dữ Liệu Theo Cơ Sở Kho",
      subtitle: "Ràng buộc dữ liệu độc lập giữa các chi nhánh, gán quyền điều hành cho Quản Lý và Nhân Viên.",
      icon: Building2,
    },
    login_history: {
      title: "Theo Dõi Lịch Sử Đăng Nhập Người Dùng (Track Login History)",
      subtitle: "Ghi nhận chi tiết thời gian đăng nhập, địa chỉ IP, thiết bị/trình duyệt và tình trạng xác thực trên toàn hệ thống.",
      icon: Clock,
    },
    audit_logs: {
      title: "Nhật Ký Thao Tác & Truy Vết Hoạt Động (User Activity Logs)",
      subtitle: "Truy vết chi tiết mọi thay đổi quyền IAM, điều chỉnh chính sách, gán cơ sở, cập nhật trạng thái và thao tác dữ liệu.",
      icon: Activity,
    },
  };

  const currentTabInfo = tabLabels[activeTab];
  const TabHeaderIcon = currentTabInfo.icon;

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans text-slate-900 antialiased flex flex-col overflow-hidden selection:bg-blue-600/20 selection:text-blue-600">
      
      {/* 1. TOP EXECUTIVE HEADER */}
      <header className="h-18 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 shrink-0 z-40 flex items-center justify-between shadow-2xs">
        {/* Left: Sidebar Toggle, Brand Logo & Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="w-10 h-10 rounded-xl border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            title="Đóng / mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                SmartStorage
              </div>
              <div className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider mt-0.5">
                Cổng Quản Trị Hệ Thống (Admin)
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 text-xs font-semibold text-slate-500 min-w-0">
            <span className="text-slate-400">Admin</span>
            <span>/</span>
            <span className="text-blue-900 font-bold truncate">{currentTabInfo.title}</span>
          </div>
        </div>

        {/* Right: Quick Role Portal Links, Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-semibold">
            <Link
              href="/manager"
              className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white transition"
            >
              Role 3: Quản Lý Cơ Sở
            </Link>
            <Link
              href="/operations"
              className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-white transition"
            >
              Role 4: Vận Hành Chuỗi
            </Link>
            <span className="px-2.5 py-1 rounded-lg bg-white text-blue-700 shadow-2xs font-bold">
              Role 5: Quản Trị Hệ Thống
            </span>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition cursor-pointer"
            title="Đồng bộ lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {getInitials(currentUser.fullName, currentUser.email)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.fullName || "Quản Trị Viên"}
                </div>
                <div className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider">
                  SYSTEM ADMIN
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
        
        {/* Admin Sidebar */}
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
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-900">
                  SmartStorage
                </span>
                <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  Quản Trị Hệ Thống
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
              <span>Tài Khoản &amp; Phân Quyền</span>
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
              <span>Giám Sát &amp; Truy Vết (Audit)</span>
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
          </nav>

          {/* Footer User Info */}
          <div className="p-3 border-t border-slate-200 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(currentUser.fullName, currentUser.email)}
                </div>
                <div
                  className={`flex-1 min-w-0 transition-all duration-300 ${
                    isSidebarCollapsed ? "max-w-0 opacity-0 overflow-hidden" : "opacity-100"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.fullName || "Quản Trị Viên"}
                  </div>
                  <div className="text-[11px] text-blue-600 font-semibold truncate">
                    SYSTEM ADMIN
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
                  <Shield className="w-4 h-4 shrink-0" />
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
            
            {/* Header Banner Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <TabHeaderIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentTabInfo.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal leading-relaxed">
                    {currentTabInfo.subtitle}
                  </p>
                </div>
              </div>

              {activeTab === "accounts" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCredentials(null);
                      setCreateAccountScope("INTERNAL");
                      setFormRole("FACILITY_STAFF");
                      setFormFacilityId(facilities[0]?.id ? String(facilities[0].id) : "");
                      setFormCreateReason("");
                      setIsCreateUserModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Tài Khoản &amp; Cấp Quyền</span>
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: ACCOUNTS - QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN VAI TRÒ */}
            {activeTab === "accounts" && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo họ tên, email, số điện thoại..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Role Filter */}
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="ALL">Tất cả vai trò ({users.length})</option>
                      <option value="STORAGE_CUSTOMER">Khách Hàng</option>
                      <option value="FACILITY_STAFF">Nhân Viên Cơ Sở</option>
                      <option value="FACILITY_MANAGER">Quản Lý Cơ Sở</option>
                      <option value="BUSINESS_OPERATIONS_MANAGER">Vận Hành Chuỗi</option>
                      <option value="SYSTEM_ADMINISTRATOR">Quản Trị Viên</option>
                    </select>

                    {/* Facility Filter */}
                    <select
                      value={facilityFilter}
                      onChange={(e) => setFacilityFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="ALL">Tất cả chi nhánh</option>
                      {facilities.map((f) => (
                        <option key={f.id} value={String(f.id)}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="ALL">Mọi trạng thái</option>
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="SUSPENDED">Bị khóa</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
                      <thead className="bg-slate-50/80 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3.5 whitespace-nowrap min-w-[220px]">Người Dùng</th>
                          <th className="px-5 py-3.5 whitespace-nowrap min-w-[170px]">Vai Trò Nghiệp Vụ (Role)</th>
                          <th className="px-5 py-3.5 whitespace-nowrap min-w-[240px]">Phạm Vi Quyền Hạn (Data Scope)</th>
                          <th className="px-5 py-3.5 whitespace-nowrap min-w-[170px]">Đăng Nhập Gần Nhất</th>
                          <th className="px-5 py-3.5 whitespace-nowrap text-center min-w-[120px]">Trạng Thái</th>
                          <th className="px-5 py-3.5 whitespace-nowrap text-right min-w-[270px]">Thao Tác Quản Trị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-400">
                              <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-bold">Không tìm thấy tài khoản người dùng nào!</p>
                              <p className="text-[11px] mt-0.5">Thử thay đổi bộ lọc tìm kiếm hoặc tạo tài khoản mới.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => {
                            const roleObj = SYSTEM_ROLES.find(
                              (r) => r.name === u.role || (u.role && u.role.includes(r.name.replace("FACILITY_", "")))
                            ) || SYSTEM_ROLES[0];
                            const isSelf = Boolean(currentUser && String(currentUser.id) === String(u.id));
                            const isFacilityRole = u.role === "FACILITY_STAFF" || u.role === "FACILITY_MANAGER";
                            const isGlobalRole =
                              u.role === "BUSINESS_OPERATIONS_MANAGER" || u.role === "SYSTEM_ADMINISTRATOR";

                            return (
                              <tr
                                key={u.id}
                                className={`hover:bg-slate-50/80 transition-colors border-l-4 ${roleObj.rowBorder}`}
                              >
                                <td className="px-5 py-3.5 whitespace-nowrap min-w-[220px]">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-9 h-9 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${roleObj.avatarBg}`}
                                    >
                                      {u.fullName?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="font-black text-slate-900 leading-tight whitespace-nowrap">{u.fullName}</p>
                                        {isSelf && (
                                          <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[9px] font-black uppercase">
                                            Bạn
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-slate-400 text-[11px] font-mono whitespace-nowrap">{u.email}</p>
                                      {u.phone && <p className="text-slate-400 text-[10px] whitespace-nowrap">{u.phone}</p>}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-3.5 whitespace-nowrap min-w-[170px]">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-2xs whitespace-nowrap ${roleObj.color}`}
                                  >
                                    {roleObj.titleVi}
                                  </span>
                                </td>

                                <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-600 min-w-[240px]">
                                  {isGlobalRole ? (
                                    <span className="inline-flex items-center gap-1.5 text-purple-800 font-bold bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap">
                                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                      <span>Toàn Hệ Thống (Global Scope)</span>
                                    </span>
                                  ) : isFacilityRole ? (
                                    u.assignedFacility ? (
                                      <span className="inline-flex items-center gap-1.5 text-slate-800 font-bold bg-slate-100/80 border border-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span className="truncate max-w-[200px]">{u.assignedFacility.name}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span>Chưa gán cơ sở</span>
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-slate-400 text-[11px] font-medium whitespace-nowrap">
                                      Cổng Khách Hàng (Customer Portal)
                                    </span>
                                  )}
                                </td>

                                <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium min-w-[170px]">
                                  {u.lastLoginAt ? (
                                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                      {new Date(u.lastLoginAt).toLocaleString("vi-VN")}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px] whitespace-nowrap">Chưa đăng nhập</span>
                                  )}
                                </td>

                                <td className="px-5 py-3.5 whitespace-nowrap text-center min-w-[120px]">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border whitespace-nowrap ${
                                      u.status === "ACTIVE"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}
                                  >
                                    {u.status === "ACTIVE" ? "Hoạt Động" : "Bị Khóa"}
                                  </span>
                                </td>

                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-2 whitespace-nowrap">
                                    <button
                                      type="button"
                                      disabled={isSelf}
                                      onClick={() => {
                                        if (isSelf) return;
                                        setSelectedUser(u);
                                        setNewRoleName(u.role || "FACILITY_STAFF");
                                        setRoleChangeFacilityId(
                                          u.facilityId || (facilities[0]?.id ? String(facilities[0].id) : "")
                                        );
                                        setRoleChangeReason("");
                                        setIsChangeRoleModalOpen(true);
                                      }}
                                      title={
                                        isSelf
                                          ? "Không thể tự thay đổi vai trò của chính tài khoản Admin đang đăng nhập"
                                          : "Chuyển đổi vai trò nghiệp vụ & phạm vi quyền hạn"
                                      }
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap inline-flex items-center gap-1.5 shadow-2xs ${
                                        isSelf
                                          ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                          : "bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer active:scale-95"
                                      }`}
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                      <span>Đổi Vai Trò</span>
                                    </button>

                                    {isFacilityRole && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedUser(u);
                                          setTargetFacilityId(
                                            u.facilityId || (facilities[0]?.id ? String(facilities[0].id) : "")
                                          );
                                          setRoleInFacility(u.role === "FACILITY_MANAGER" ? "MANAGER" : "STAFF");
                                          setIsAssignFacilityModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                                      >
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>Đổi Cơ Sở</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isSelf}
                                      onClick={() => handleToggleStatus(u)}
                                      className={`p-2 rounded-xl transition ${
                                        isSelf
                                          ? "text-slate-300 cursor-not-allowed opacity-50"
                                          : u.status === "ACTIVE"
                                            ? "text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 cursor-pointer active:scale-95"
                                            : "text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 cursor-pointer active:scale-95"
                                      }`}
                                      title={
                                        isSelf
                                          ? "Không thể tự khóa tài khoản của chính mình"
                                          : u.status === "ACTIVE"
                                            ? "Khóa tài khoản: Thu hồi phiên đăng nhập ngay lập tức"
                                            : "Mở khóa tài khoản: Khôi phục quyền truy cập"
                                      }
                                    >
                                      {u.status === "ACTIVE" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ROLES & RBAC MATRIX */}
            {activeTab === "roles" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {SYSTEM_ROLES.map((role) => (
                  <div
                    key={role.name}
                    className={`bg-white rounded-3xl p-6 border shadow-xs flex flex-col justify-between border-l-6 ${role.rowBorder}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${role.color}`}>
                          {role.titleVi}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {users.filter((u) => u.role === role.name).length} tài khoản
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-base mb-2">{role.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">{role.desc}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Phạm vi dữ liệu:</span>
                      <strong className="text-slate-800">{role.scope}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: FACILITY ACCESS */}
            {activeTab === "facility_access" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {facilities.map((fac) => {
                    const assignedStaff = users.filter((u) => String(u.facilityId) === String(fac.id));

                    return (
                      <div key={fac.id} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                            {fac.code}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {assignedStaff.length} nhân sự phụ trách
                          </span>
                        </div>

                        <div>
                          <h3 className="font-black text-slate-900 text-base">{fac.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{fac.address}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Nhân Sự Đang Được Gán Quyền:
                          </span>
                          {assignedStaff.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Chưa có nhân viên hoặc quản lý nào được gán vào cơ sở này.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                              {assignedStaff.map((st) => (
                                <div key={st.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                                  <span className="font-bold text-slate-800">{st.fullName}</span>
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                                    {st.role?.includes("MANAGER") ? "Quản Lý" : "Nhân Viên"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: TRACK LOGIN HISTORY (LỊCH SỬ ĐĂNG NHẬP) */}
            {activeTab === "login_history" && (
              <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Phiên Đăng Nhập</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{loginHistory.length}</div>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% bảo mật SSL/TLS
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thiết Bị Web Desktop</div>
                    <div className="text-2xl font-black text-blue-600 mt-1">
                      {loginHistory.filter((l) => l.deviceInfo?.includes("Windows") || l.deviceInfo?.includes("macOS")).length}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-blue-600" /> Cổng Quản Lý &amp; Nhân Viên
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thiết Bị Mobile App</div>
                    <div className="text-2xl font-black text-indigo-600 mt-1">
                      {loginHistory.filter((l) => l.deviceInfo?.includes("Mobile")).length}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> Khách Hàng Thuê Kho
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phiên Bị Chặn (Khóa)</div>
                    <div className="text-2xl font-black text-rose-600 mt-1">
                      {loginHistory.filter((l) => l.status === "BLOCKED_SUSPENDED").length}
                    </div>
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Chặn truy cập theo quyền Admin
                    </p>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo IP, tên người dùng, thiết bị..."
                      value={loginSearch}
                      onChange={(e) => setLoginSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                      value={loginRoleFilter}
                      onChange={(e) => setLoginRoleFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="ALL">Mọi vai trò đăng nhập</option>
                      <option value="SYSTEM_ADMINISTRATOR">Quản Trị Viên</option>
                      <option value="FACILITY_MANAGER">Quản Lý Chi Nhánh</option>
                      <option value="STAFF">Nhân Viên Vận Hành</option>
                      <option value="STORAGE_CUSTOMER">Khách Hàng</option>
                    </select>
                  </div>
                </div>

                {/* Login History Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
                      <thead className="bg-slate-50/80 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3.5 whitespace-nowrap">Thời Gian Đăng Nhập</th>
                          <th className="px-5 py-3.5 whitespace-nowrap">Tài Khoản / Người Dùng</th>
                          <th className="px-5 py-3.5 whitespace-nowrap">Vai Trò Hệ Thống</th>
                          <th className="px-5 py-3.5 whitespace-nowrap">Địa Chỉ IP</th>
                          <th className="px-5 py-3.5 whitespace-nowrap">Thiết Bị / Trình Duyệt</th>
                          <th className="px-5 py-3.5 whitespace-nowrap text-center">Tình Trạng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredLoginHistory.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-400">
                              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-bold">Không tìm thấy bản ghi lịch sử đăng nhập nào!</p>
                            </td>
                          </tr>
                        ) : (
                          filteredLoginHistory.map((item) => {
                            const u = item.user;
                            const roleName = u?.role?.name || "STORAGE_CUSTOMER";
                            const roleObj = SYSTEM_ROLES.find((r) => r.name === roleName) || SYSTEM_ROLES[0];

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-3.5 font-mono text-slate-800 font-semibold whitespace-nowrap">
                                  {new Date(item.loginTime).toLocaleString("vi-VN")}
                                </td>

                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${roleObj.avatarBg}`}>
                                      {u?.fullName?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 leading-tight">{u?.fullName || "Khách vãng lai"}</p>
                                      <p className="text-slate-400 text-[11px] font-mono">{u?.email}</p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${roleObj.color}`}>
                                    {roleObj.titleVi}
                                  </span>
                                </td>

                                <td className="px-5 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span>{item.ipAddress}</span>
                                  </span>
                                </td>

                                <td className="px-5 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5">
                                    {item.deviceInfo.includes("Mobile") ? (
                                      <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    ) : (
                                      <Monitor className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    )}
                                    <span>{item.deviceInfo}</span>
                                  </span>
                                </td>

                                <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                  {item.status === "SUCCESS" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Thành công
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <Lock className="w-3 h-3 text-rose-600" />
                                      Bị chặn
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: USER ACTIVITY LOGS (NHẬT KÝ THAO TÁC AUDIT) */}
            {activeTab === "audit_logs" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm nhật ký theo nội dung, email người thực hiện..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="ALL">Mọi loại hành động ({auditLogs.length})</option>
                      <option value="CREATE_USER">CREATE_USER (Tạo tài khoản &amp; cấp quyền)</option>
                      <option value="UPDATE_ROLE">UPDATE_ROLE (Chuyển đổi vai trò)</option>
                      <option value="ASSIGN_FACILITY">ASSIGN_FACILITY (Gán cơ sở)</option>
                      <option value="UPDATE_STATUS">UPDATE_STATUS (Khóa/Mở tài khoản)</option>
                      <option value="REVOKE_FACILITY">REVOKE_FACILITY (Thu hồi cơ sở)</option>
                      <option value="LOGIN">LOGIN (Đăng nhập)</option>
                    </select>
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
                      <thead className="bg-slate-50/80 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3.5 whitespace-nowrap">Thời Gian</th>
                          <th className="px-5 py-3.5 whitespace-nowrap">Người Thực Hiện</th>
                          <th className="px-5 py-3.5 whitespace-nowrap">Hành Động</th>
                          <th className="px-5 py-3.5 whitespace-nowrap">Đối Tượng Tác Động</th>
                          <th className="px-5 py-3.5 whitespace-nowrap">Mô Tả Chi Tiết</th>
                          <th className="px-5 py-3.5 whitespace-nowrap text-center">Kiểm Toán</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-400">
                              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-bold">Không tìm thấy nhật ký thao tác nào!</p>
                            </td>
                          </tr>
                        ) : (
                          filteredAuditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-3.5 font-mono text-slate-800 font-semibold whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString("vi-VN")}
                              </td>

                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <div className="font-bold text-slate-900">{log.user?.fullName || "System Admin"}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{log.user?.email || "admin@selfstorage.vn"}</div>
                              </td>

                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                                  {log.action}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className="text-slate-600 font-medium">
                                  {log.entityType || "SYSTEM"}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-slate-700">
                                {log.description || `Thao tác ${log.action} trên hệ thống`}
                              </td>

                              <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  Đã xác thực
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

      {/* MODAL: TẠO TÀI KHOẢN NỘI BỘ & CẤP QUYỀN BAN ĐẦU (ONBOARDING) */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {createdCredentials ? "Bàn Giao Thông Tin Đăng Nhập" : "Khởi Tạo Tài Khoản & Cấp Quyền Ban Đầu"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {createdCredentials
                    ? "Tài khoản đã được kích hoạt và phân quyền thành công trên hệ thống."
                    : "Thiết lập danh tính IAM, vai trò nghiệp vụ và phạm vi dữ liệu ngay khi tạo."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateUserModalOpen(false);
                  setCreatedCredentials(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdCredentials ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Đã cấp phát tài khoản và ghi nhận vào Nhật ký Kiểm toán (Audit Log)</span>
                  </div>

                  <div className="bg-white rounded-xl p-3.5 border border-emerald-100 space-y-2 text-xs font-mono">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-sans">Họ và tên:</span>
                      <span className="font-bold text-slate-900 font-sans">{createdCredentials.fullName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-sans">Tài khoản (Email):</span>
                      <span className="font-bold text-blue-700">{createdCredentials.email}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-sans">Mật khẩu khởi tạo:</span>
                      <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{createdCredentials.password}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-sans">Vai trò IAM:</span>
                      <span className="font-bold text-slate-800 font-sans">{createdCredentials.roleTitle}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-sans">Phạm vi quyền hạn:</span>
                      <span className="font-bold text-emerald-700 font-sans">{createdCredentials.scopeLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const text =
                        `[THÔNG TIN TÀI KHOẢN SELF STORAGE]\n` +
                        `- Họ tên: ${createdCredentials.fullName}\n` +
                        `- Email đăng nhập: ${createdCredentials.email}\n` +
                        `- Mật khẩu khởi tạo: ${createdCredentials.password}\n` +
                        `- Vai trò nghiệp vụ: ${createdCredentials.roleTitle}\n` +
                        `- Phạm vi dữ liệu: ${createdCredentials.scopeLabel}\n` +
                        `* Vui lòng đăng nhập và đổi mật khẩu trong phần Thông tin cá nhân.`;
                      navigator.clipboard.writeText(text);
                      toast.success("Đã sao chép thông tin bàn giao tài khoản vào Clipboard!");
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Sao Chép Thông Tin Đăng Nhập</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedCredentials(null);
                        generateRandomPassword();
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                    >
                      + Tạo thêm tài khoản khác
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateUserModalOpen(false);
                        setCreatedCredentials(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Phân tách Nhóm Tài Khoản Nội Bộ (IAM) vs Khách Hàng */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateAccountScope("INTERNAL");
                      if (formRole === "STORAGE_CUSTOMER") {
                        setFormRole("FACILITY_STAFF");
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      createAccountScope === "INTERNAL"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Nhân Sự Nội Bộ (Internal IAM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateAccountScope("CUSTOMER");
                      setFormRole("STORAGE_CUSTOMER");
                      setFormFacilityId("");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      createAccountScope === "CUSTOMER"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Tài Khoản Khách Thuê Kho</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn A"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Địa Chỉ Email Đăng Nhập (*)</label>
                    <input
                      type="email"
                      required
                      placeholder="staff.q1@selfstorage.vn"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại Liên Hệ</label>
                    <input
                      type="tel"
                      placeholder="0901234567"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Mật Khẩu Khởi Tạo (*)</label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Tạo ngẫu nhiên</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Cấp quyền Vai trò ban đầu */}
                {createAccountScope === "INTERNAL" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Cấp Quyền Vai Trò Nghiệp Vụ Ban Đầu (*)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SYSTEM_ROLES.filter((r) => r.name !== "STORAGE_CUSTOMER").map((r) => (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => setFormRole(r.name)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-start justify-between gap-2 ${
                            formRole === r.name
                              ? "border-blue-600 bg-blue-50/80 text-blue-950 shadow-2xs"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-black leading-tight">{r.titleVi}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{r.title}</p>
                          </div>
                          {formRole === r.name && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Vai trò mặc định:</span> Khách Hàng Thuê Kho (Storage Customer) — Dùng để đặt thuê kho, ký hợp đồng điện tử và mở khóa Smart Key.
                  </div>
                )}

                {/* Tự động ánh xạ Phạm vi dữ liệu (Data Scope) theo Vai trò */}
                {(formRole === "FACILITY_STAFF" || formRole === "FACILITY_MANAGER") && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Phạm Vi Quyền Hạn: Gán Chi Nhánh Kho Trực Thuộc (* Bắt buộc)
                      </span>
                    </label>
                    <select
                      value={formFacilityId}
                      onChange={(e) => setFormFacilityId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-amber-300 bg-white rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="">-- Chọn Cơ Sở Kho Trực Thuộc --</option>
                      {facilities.map((f) => (
                        <option key={f.id} value={String(f.id)}>
                          {f.name} ({f.code})
                        </option>
                      ))}
                    </select>

                    {/* Cảnh báo nếu chi nhánh đã có Quản lý khác */}
                    {existingManagerAtCreateFacility && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black">Lưu ý bàn giao Quản lý chi nhánh:</span> Cơ sở này hiện đang do{" "}
                          <span className="font-extrabold underline">{existingManagerAtCreateFacility.fullName}</span> (
                          {existingManagerAtCreateFacility.email}) quản lý. Khi xác nhận tạo mới, quyền quản lý tại chi nhánh này sẽ tự động chuyển giao sang nhân sự mới.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(formRole === "BUSINESS_OPERATIONS_MANAGER" || formRole === "SYSTEM_ADMINISTRATOR") && (
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black">Phạm Vi Quyền Hạn: Toàn Hệ Thống (Global Scope)</p>
                      <p className="text-[11px] text-purple-700 mt-0.5">
                        Vai trò này có quyền giám sát và điều hành xuyên suốt tất cả các chi nhánh kho trên hệ thống (không bị giới hạn vào một cơ sở đơn lẻ).
                      </p>
                    </div>
                  </div>
                )}

                {/* Ghi chú bổ nhiệm / Lý do khởi tạo (Lưu vào Audit Log) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi Chú Bổ Nhiệm / Lý Do Cấp Quyền (Lưu vào Nhật ký Kiểm toán)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tuyển mới nhân viên vận hành ca sáng Quận 1 / Bổ nhiệm quản lý mới..."
                    value={formCreateReason}
                    onChange={(e) => setFormCreateReason(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Khởi Tạo &amp; Cấp Quyền</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: QUẢN LÝ CHUYỂN ĐỔI VAI TRÒ NGHIỆP VỤ (ROLE TRANSITION) */}
      {isChangeRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Chuyển Đổi Vai Trò Nghiệp Vụ (Role Transition)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động đồng bộ phạm vi chi nhánh, thu hồi quyền cũ và ghi vết kiểm toán IAM.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeRoleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin nhân sự & So sánh Vai trò Hiện tại -> Mới */}
            {(() => {
              const currentRoleObj =
                SYSTEM_ROLES.find((r) => r.name === selectedUser.role) || SYSTEM_ROLES[0];
              const targetRoleObj =
                SYSTEM_ROLES.find((r) => r.name === newRoleName) || currentRoleObj;
              return (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-slate-900">{selectedUser.fullName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{selectedUser.email}</p>
                    </div>
                    {selectedUser.assignedFacility && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        <span>{selectedUser.assignedFacility.name}</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Vai trò hiện tại</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${currentRoleObj.color}`}>
                        {currentRoleObj.titleVi}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 text-right">
                      <span className="block text-[10px] font-bold text-blue-600 uppercase mb-0.5">Vai trò chuyển tới</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${targetRoleObj.color}`}>
                        {targetRoleObj.titleVi}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Chọn Vai Trò Nghiệp Vụ Mới:</label>
              <div className="space-y-1.5">
                {SYSTEM_ROLES.map((r) => {
                  // Nếu là nhân sự nội bộ đang hoạt động, hạn chế chuyển nhầm về Khách hàng trừ khi thật sự cần
                  const isDemotingInternalToCustomer =
                    selectedUser.role !== "STORAGE_CUSTOMER" && r.name === "STORAGE_CUSTOMER";

                  return (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => setNewRoleName(r.name)}
                      className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        newRoleName === r.name
                          ? "border-blue-600 bg-blue-50/90 text-blue-950 font-black shadow-2xs"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black">{r.titleVi}</p>
                          <span className="text-[10px] font-mono text-slate-400">({r.title})</span>
                          {selectedUser.role === r.name && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {isDemotingInternalToCustomer
                            ? "Thu hồi toàn bộ quyền nội bộ và đưa về tài khoản khách hàng thông thường"
                            : r.scope}
                        </p>
                      </div>
                      {newRoleName === r.name && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KỊCH BẢN 1: CHUYỂN SANG STAFF HOẶC FACILITY MANAGER (Bắt buộc chọn chi nhánh) */}
            {(newRoleName === "FACILITY_STAFF" || newRoleName === "FACILITY_MANAGER") && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Chi Nhánh Công Tác Áp Dụng Cho Vai Trò {newRoleName === "FACILITY_MANAGER" ? "Quản Lý" : "Nhân Viên"} (*):
                  </span>
                </label>
                <select
                  value={roleChangeFacilityId}
                  onChange={(e) => setRoleChangeFacilityId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- Chọn cơ sở kho trực thuộc --</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>

                {/* Cảnh báo nếu nâng lên Quản lý tại cơ sở đã có Quản lý khác */}
                {existingManagerAtRoleChangeFacility && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black">Cảnh báo thay thế Quản lý chi nhánh:</span> Cơ sở này hiện đang do{" "}
                      <span className="font-extrabold underline">{existingManagerAtRoleChangeFacility.fullName}</span> phụ trách. Nếu tiếp tục, hệ thống sẽ tự động đóng nhiệm kỳ quản lý cũ tại cơ sở này để bàn giao cho{" "}
                      <span className="font-bold">{selectedUser.fullName}</span>.
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-amber-800">
                  Hệ thống sẽ tự động cập nhật bảng phân công cơ sở (<code className="font-mono">StaffFacilityAssignment</code>) sang vị trí{" "}
                  <strong>{newRoleName === "FACILITY_MANAGER" ? "MANAGER" : "STAFF"}</strong>.
                </p>
              </div>
            )}

            {/* KỊCH BẢN 2: NÂNG LÊN VAI TRÒ TOÀN HỆ THỐNG (Tự động giải phóng cơ sở đơn lẻ cũ) */}
            {(newRoleName === "BUSINESS_OPERATIONS_MANAGER" || newRoleName === "SYSTEM_ADMINISTRATOR") && (
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black">Đồng Bộ Phạm Vi: Nâng Lên Toàn Hệ Thống (Global Scope)</p>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    {selectedUser.assignedFacility
                      ? `Hệ thống sẽ tự động đóng phân công cục bộ tại "${selectedUser.assignedFacility.name}" và mở quyền quản lý xuyên chuỗi cho tài khoản này.`
                      : "Tài khoản sẽ có quyền truy cập và điều hành dữ liệu trên toàn bộ các cơ sở kho."}
                  </p>
                </div>
              </div>
            )}

            {/* LÝ DO THAY ĐỔI VAI TRÒ (AUDIT TRAIL REASON) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Lý Do Quyết Định Thay Đổi Vai Trò (Ghi vào Audit Log):
              </label>
              <input
                type="text"
                placeholder="Nhập lý do bổ nhiệm / luân chuyển / hạ quyền..."
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  "Thăng chức lên Quản lý chi nhánh",
                  "Luân chuyển công tác định kỳ",
                  "Bổ nhiệm Vận hành chuỗi",
                  "Điều chỉnh phân quyền nội bộ",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setRoleChangeReason(tag)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-bold text-slate-600 transition cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsChangeRoleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isRoleSubmitting}
                onClick={handleSubmitRoleChange}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {isRoleSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Xác Nhận Chuyển Vai Trò</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GÁN CƠ SỞ KHO */}
      {isAssignFacilityModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Phân Công Cơ Sở Trực Thuộc</h3>
              <button
                type="button"
                onClick={() => setIsAssignFacilityModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <p className="font-black text-slate-800">{selectedUser.fullName}</p>
              <p className="text-slate-400 font-mono">{selectedUser.email}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Cơ Sở Kho (*)</label>
                <select
                  value={targetFacilityId}
                  onChange={(e) => setTargetFacilityId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 outline-none"
                >
                  <option value="">-- Chọn Cơ Sở --</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vị Trí / Chức Danh</label>
                <select
                  value={roleInFacility}
                  onChange={(e) => setRoleInFacility(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 outline-none"
                >
                  <option value="STAFF">Nhân Viên Vận Hành Tại Chỗ</option>
                  <option value="MANAGER">Quản Lý Chi Nhánh</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAssignFacilityModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitFacilityAssignment}
                className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Xác Nhận Gán</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
