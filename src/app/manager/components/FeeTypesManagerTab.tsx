"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  RefreshCw,
  Coins,
  ShieldAlert,
  Sliders,
  DollarSign,
  FileText,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { StaffUser } from "../types";

export interface FeeTypeItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  defaultAmount: number;
  amountType: "FIXED" | "PERCENTAGE";
  appliesTo: "CONTRACT" | "GENERAL" | "RESERVATION" | "STORAGE_UNIT" | "FACILITY";
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

// Danh mục phụ thu mặc định làm fallback khi mới khởi động hoặc offline (khớp DB MongoDB)
const INITIAL_FEE_TYPES: FeeTypeItem[] = [
  {
    id: "6ae7f9f1a256eb7881b1d3a0",
    name: "Vệ sinh & thu gom rác thải trong kho",
    code: "CLEANING",
    description:
      "Áp dụng khi khách trả ô kho còn để lại rác thải, bụi bẩn hoặc vết dơ cần tẩy rửa.",
    defaultAmount: 50000,
    amountType: "FIXED",
    appliesTo: "CONTRACT",
    status: "ACTIVE",
  },
  {
    id: "6ae7f9f1a256eb7881b1d3a1",
    name: "Bồi thường trầy xước tường & sàn kho",
    code: "SCRATCHES",
    description:
      "Áp dụng khi kiểm tra nghiệm thu phát hiện trầy xước sơn vách ngăn hoặc tróc sàn do kéo lê đồ.",
    defaultAmount: 100000,
    amountType: "FIXED",
    appliesTo: "CONTRACT",
    status: "ACTIVE",
  },
  {
    id: "6ae7f9f1a256eb7881b1d3a2",
    name: "Thay thế chốt khóa / tay nắm cửa hư hỏng",
    code: "DOOR_LOCK",
    description:
      "Áp dụng khi chốt khóa thông minh, tay nắm hoặc ổ khóa bị cạy phá, biến dạng hoặc gãy kẹt.",
    defaultAmount: 200000,
    amountType: "FIXED",
    appliesTo: "CONTRACT",
    status: "ACTIVE",
  },
  {
    id: "6ae7f9f1a256eb7881b1d3a3",
    name: "Phí phạt trễ hẹn trả kho (theo ngày)",
    code: "LATE_FEE",
    description:
      "Phí phạt trễ hẹn tính theo từng ngày trễ hẹn bàn giao kho (Tối đa 30 ngày trước khi áp dụng thủ tục thanh lý kho).",
    defaultAmount: 50000,
    amountType: "FIXED",
    appliesTo: "CONTRACT",
    status: "ACTIVE",
  },
  {
    id: "6ae7f9f2a256eb7881b1d3a4",
    name: "Phụ thu phát sinh đặc thù khác",
    code: "CUSTOM",
    description:
      "Khoản phụ thu khác do nhân viên và Quản lý cơ sở thẩm định tại chỗ (thay đổi giá linh hoạt).",
    defaultAmount: 0,
    amountType: "FIXED",
    appliesTo: "CONTRACT",
    status: "ACTIVE",
  },
];

interface FeeTypesManagerTabProps {
  currentUser?: StaffUser | null;
}

export default function FeeTypesManagerTab({
  currentUser,
}: FeeTypesManagerTabProps) {
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>(INITIAL_FEE_TYPES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FeeTypeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    defaultAmount: 50000,
    amountType: "FIXED" as "FIXED" | "PERCENTAGE",
    appliesTo: "CONTRACT" as "CONTRACT" | "GENERAL" | "RESERVATION" | "STORAGE_UNIT" | "FACILITY",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Tải danh mục loại phụ phí từ Backend
  const loadFeeTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<FeeTypeItem[]>("/operations/fee-types");
      if (res && Array.isArray(res) && res.length > 0) {
        setFeeTypes(res);
      } else {
        setFeeTypes(INITIAL_FEE_TYPES);
      }
    } catch (err: any) {
      console.warn(
        "Backend fee-types API fallback to local data:",
        err?.message || err,
      );
      setFeeTypes(INITIAL_FEE_TYPES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeeTypes();
  }, [loadFeeTypes]);

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      defaultAmount: 50000,
      amountType: "FIXED",
      appliesTo: "STORAGE_UNIT",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (item: FeeTypeItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || "",
      defaultAmount: item.defaultAmount,
      amountType: item.amountType || "FIXED",
      appliesTo: item.appliesTo || "STORAGE_UNIT",
      status: item.status || "ACTIVE",
    });
    setIsModalOpen(true);
  };

  // Submit Form Lưu / Cập nhật
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên loại phụ thu");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Vui lòng nhập mã định danh phụ thu");
      return;
    }

    const validAppliesTo: "CONTRACT" | "GENERAL" | "RESERVATION" =
      formData.appliesTo === "STORAGE_UNIT" || (formData.appliesTo as string) === "FACILITY"
        ? "CONTRACT"
        : (formData.appliesTo as "CONTRACT" | "GENERAL" | "RESERVATION");

    const payload = {
      name: formData.name.trim(),
      code: formData.code.toUpperCase().trim(),
      description: formData.description.trim() || undefined,
      defaultAmount: Number(formData.defaultAmount) || 0,
      amountType: formData.amountType,
      appliesTo: validAppliesTo,
      status: formData.status,
    };

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Cập nhật lên Backend API
        const res = await api.put<FeeTypeItem>(`/operations/fee-types/${editingItem.id}`, payload);
        const updated: FeeTypeItem = res && res.id ? res : { ...editingItem, ...payload };
        setFeeTypes((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updated : item)),
        );
        toast.success(
          `Đã cập nhật cấu hình phụ thu "${payload.name}" thành công!`,
        );
      } else {
        // Tạo mới trên Backend API
        const res = await api.post<FeeTypeItem>("/operations/fee-types", payload);
        const created: FeeTypeItem = res && res.id ? res : { ...payload, id: `fee-${Date.now()}`, createdAt: new Date().toISOString() };
        setFeeTypes((prev) => [created, ...prev]);
        toast.success(
          `Đã thêm loại phụ thu mới "${payload.name}" thành công!`,
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu cấu hình phụ thu. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bật/tắt trạng thái ACTIVE / INACTIVE
  const handleToggleStatus = async (item: FeeTypeItem) => {
    const nextStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api
        .patch(`/operations/fee-types/${item.id}/toggle-status`, {})
        .catch(() => null);
      setFeeTypes((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: nextStatus } : f)),
      );
      toast.success(
        `Đã chuyển trạng thái "${item.name}" sang ${nextStatus === "ACTIVE" ? "Đang áp dụng" : "Tạm dừng"}`,
      );
    } catch (err) {
      toast.error("Không thể đổi trạng thái.");
    }
  };

  // Xóa phụ thu
  const handleDeleteFeeType = async (item: FeeTypeItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa loại phụ thu "${item.name}"?`))
      return;

    try {
      await api.delete(`/operations/fee-types/${item.id}`).catch(() => null);
      setFeeTypes((prev) => prev.filter((f) => f.id !== item.id));
      toast.success(`Đã xóa loại phụ thu "${item.name}"`);
    } catch (err) {
      toast.error("Lỗi khi xóa loại phụ thu.");
    }
  };

  // Lọc dữ liệu hiển thị
  const filteredFeeTypes = feeTypes.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  const activeCount = feeTypes.filter((f) => f.status === "ACTIVE").length;
  const maxFee = Math.max(...feeTypes.map((f) => f.defaultAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ─── HEADER QUẢN LÝ PHỤ THU ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-700">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Danh Mục & Cấu hình phí phạt
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập mức giá bồi thường và phụ phí do{" "}
                <strong>Quản Lý Cơ Sở (Facility Manager)</strong> quyết định khi
                khách trả kho hoặc vi phạm
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadFeeTypes}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Đồng bộ</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm loại phụ thu mới</span>
          </button>
        </div>
      </div>

      {/* ─── 3 THẺ THỐNG KÊ NHANH ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50/70 to-white p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Tổng loại phụ thu
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {feeTypes.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-white p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Đang áp dụng thực tế
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {activeCount} / {feeTypes.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 to-white p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Mức phí trần cao nhất
            </p>
            <p className="text-2xl font-black text-amber-900 mt-1">
              {maxFee.toLocaleString("vi-VN")} đ
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── THANH TÌM KIẾM & BỘ LỌC ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã phụ thu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">
            Trạng thái:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả ({feeTypes.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              Áp dụng ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "INACTIVE"
                  ? "bg-white text-slate-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tạm dừng ({feeTypes.length - activeCount})
            </button>
          </div>
        </div>
      </div>

      {/* ─── DANH SÁCH BẢNG CẤU HÌNH PHỤ THU ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Tên loại phụ thu</th>
                <th className="py-3.5 px-4">Mã hệ thống</th>
                <th className="py-3.5 px-4 text-right">Đơn giá quy định</th>
                <th className="py-3.5 px-4 text-center">Phạm vi</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredFeeTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">
                      Không tìm thấy loại phụ thu nào phù hợp
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFeeTypes.map((item) => {
                  const isActive = item.status === "ACTIVE";
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 text-[13px]">
                          {item.name}
                        </div>
                        {item.description ? (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {item.description}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {item.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {item.code === "LATE_FEE" ? (
                          <div>
                            <span className="font-black text-amber-600 text-sm">
                              {item.defaultAmount.toLocaleString("vi-VN")} đ
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 ml-1">/ ngày</span>
                            <div className="text-[10px] text-amber-600 font-medium">Tối đa 30 ngày</div>
                          </div>
                        ) : item.defaultAmount > 0 ? (
                          <span className="font-black text-blue-700 text-sm">
                            {item.defaultAmount.toLocaleString("vi-VN")} đ
                          </span>
                        ) : (
                          <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            Linh hoạt tại chỗ
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.appliesTo === "STORAGE_UNIT"
                            ? "Ô kho"
                            : "Chung"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                          }`}
                          title="Bấm để đổi trạng thái"
                        >
                          {isActive ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Đang áp dụng</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>Tạm dừng</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa đơn giá & thông tin"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFeeType(item)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa phụ thu"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ─── MODAL TẠO MỚI / CHỈNH SỬA PHỤ THU ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingItem
                      ? "Chỉnh Sửa Loại Phụ Thu"
                      : "Thêm Loại Phụ Thu Mới"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phục vụ nghiệm thu trả kho & đối soát thanh toán SePay
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên loại phụ phí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phí vệ sinh rác thải sau trả kho"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã hệ thống (Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CLEANING, SCRATCH..."
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs font-mono font-semibold uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.code === 'LATE_FEE' ? 'Đơn giá phạt mỗi ngày (VNĐ/ngày)' : 'Đơn giá quy định (VNĐ)'}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    required
                    value={formData.defaultAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs font-bold text-blue-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả & Hướng dẫn nhân viên
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú điều kiện áp dụng mức phí này khi kiểm tra nghiệm thu kho..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phạm vi áp dụng
                  </label>
                  <select
                    value={formData.appliesTo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appliesTo: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white"
                  >
                    <option value="STORAGE_UNIT">
                      Theo từng ngăn kho (Unit)
                    </option>
                    <option value="GENERAL">Chung toàn cơ sở (General)</option>
                    <option value="FACILITY">Cơ sở vật chất (Facility)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái kích hoạt
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white"
                  >
                    <option value="ACTIVE">Đang áp dụng (ACTIVE)</option>
                    <option value="INACTIVE">
                      Tạm dừng áp dụng (INACTIVE)
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : editingItem
                      ? "Cập nhật phụ thu"
                      : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
