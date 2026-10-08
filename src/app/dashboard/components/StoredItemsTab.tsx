'use client';

import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Trash2,
  Edit2,
  Package,
  Layers,
  FileText,
  Laptop,
  Shirt,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerUnit, StoredItem } from '../types';
import { customerUnitsApi } from '@/lib/api/customerUnits';

interface StoredItemsTabProps {
  unit: CustomerUnit;
  onUpdateItems?: (items: StoredItem[]) => void;
}

const CATEGORIES = [
  'Tất cả',
  'Nội thất & Gia dụng',
  'Tài liệu & Hồ sơ',
  'Thiết bị điện tử',
  'Quần áo & Thời trang',
  'Đồ lưu niệm & Khác',
];

export default function StoredItemsTab({ unit, onUpdateItems }: StoredItemsTabProps) {
  const [items, setItems] = useState<StoredItem[]>(unit.storedItems || []);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoredItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Nội thất & Gia dụng');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const resetForm = () => {
    setName('');
    setCategory('Nội thất & Gia dụng');
    setQuantity(1);
    setDescription('');
    setPhotoUrl('');
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: StoredItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || 'Nội thất & Gia dụng');
    setQuantity(item.quantity || 1);
    setDescription(item.description || '');
    setPhotoUrl(item.photoUrl || '');
    setIsAddModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên món đồ');
      return;
    }

    setIsLoading(true);
    try {
      if (editingItem) {
        // Cập nhật món đồ
        if (editingItem.id && unit.rawContractId) {
          try {
            await customerUnitsApi.updateStoredItem(editingItem.id, {
              name: name.trim(),
              category,
              quantity: Number(quantity),
              description: description.trim(),
              photoUrl: photoUrl.trim(),
            });
          } catch (err) {
            console.warn('Backend updateStoredItem failed, fallback to local state', err);
          }
        }
        const updated = items.map((it) =>
          it.id === editingItem.id
            ? {
                ...it,
                name: name.trim(),
                category,
                quantity: Number(quantity),
                description: description.trim(),
                photoUrl: photoUrl.trim(),
                updatedAt: new Date().toISOString(),
              }
            : it
        );
        setItems(updated);
        onUpdateItems?.(updated);
        toast.success(`Đã cập nhật: ${name}`);
      } else {
        // Thêm món đồ mới
        let newItemId = Date.now();
        if (unit.rawContractId && unit.rawUnitId) {
          try {
            const res = await customerUnitsApi.createStoredItem(
              unit.rawContractId,
              unit.rawUnitId,
              {
                name: name.trim(),
                category,
                quantity: Number(quantity),
                description: description.trim(),
                photoUrl: photoUrl.trim(),
              }
            );
            if (res?.id) newItemId = res.id;
          } catch (err) {
            console.warn('Backend createStoredItem failed, fallback to local state', err);
          }
        }

        const newItem: StoredItem = {
          id: newItemId,
          contractItemId: unit.rawContractItemId || 1,
          name: name.trim(),
          category,
          quantity: Number(quantity),
          description: description.trim(),
          photoUrl: photoUrl.trim(),
          createdAt: new Date().toISOString(),
        };
        const updated = [newItem, ...items];
        setItems(updated);
        onUpdateItems?.(updated);
        toast.success(`Đã thêm "${name}" vào danh mục lưu trữ`);
      }

      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu món đồ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number, itemName: string) => {
    if (!confirm(`Bạn chắc chắn muốn xóa "${itemName}" khỏi danh mục kho?`)) return;

    try {
      if (unit.rawContractId && itemId) {
        try {
          await customerUnitsApi.deleteStoredItem(itemId);
        } catch (err) {
          console.warn('Backend deleteStoredItem failed, fallback to local state', err);
        }
      }
      const updated = items.filter((it) => it.id !== itemId);
      setItems(updated);
      onUpdateItems?.(updated);
      toast.success(`Đã xóa món đồ "${itemName}"`);
    } catch (err: any) {
      toast.error('Không thể xóa món đồ.');
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'Nội thất & Gia dụng':
        return <Layers className="w-4 h-4 text-amber-600" />;
      case 'Tài liệu & Hồ sơ':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'Thiết bị điện tử':
        return <Laptop className="w-4 h-4 text-purple-600" />;
      case 'Quần áo & Thời trang':
        return <Shirt className="w-4 h-4 text-rose-600" />;
      default:
        return <Package className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="bg-slate-900 rounded-2xl text-white shadow-xs border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-slate-400 font-medium">
              Ô kho: <strong className="text-white font-bold">{unit.unitNumber}</strong> • {unit.zone} • {unit.facilityName}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Danh Mục Đồ Đạc Lưu Trữ (Inventory)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Kiểm kê và theo dõi các thùng đồ, thiết bị đang lưu giữ tại cơ sở để thuận tiện khi cần tra cứu hoặc xuất kho.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60 text-center min-w-[90px]">
            <div className="text-xl font-bold text-white">{items.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Chủng loại</div>
          </div>
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60 text-center min-w-[90px]">
            <div className="text-xl font-bold text-amber-400">{totalQuantity}</div>
            <div className="text-[11px] text-slate-400 font-medium">Tổng số lượng</div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm đồ vào kho</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên món đồ, mã thùng hoặc ghi chú..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
            <Boxes className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">
            {searchQuery || selectedCategory !== 'Tất cả'
              ? 'Không tìm thấy món đồ phù hợp bộ lọc'
              : 'Chưa có danh mục đồ đạc trong kho'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'Tất cả'
              ? 'Vui lòng thử xóa từ khóa tìm kiếm hoặc chọn nhóm danh mục khác.'
              : 'Ghi lại danh mục các thùng carton, thiết bị hoặc giấy tờ để quản lý ngăn nắp và kiểm kê khi chuyển đồ ra ngoài.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm món đồ đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-50 transition-colors">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {item.category || 'Vật dụng'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                        {item.name}
                      </h4>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg text-xs font-bold tabular-nums">
                    x{item.quantity || 1}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {item.photoUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 max-h-36 bg-slate-100">
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px]">
                  {item.createdAt
                    ? `Cất ngày ${new Date(item.createdAt).toLocaleDateString('vi-VN')}`
                    : 'Đã lưu kho'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa món đồ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-slide-up-fade">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingItem ? 'Chỉnh Sửa Món Đồ' : 'Thêm Đồ Vào Ngăn Kho'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ngăn kho {unit.unitNumber} • {unit.facilityName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tên món đồ / Thùng đồ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Thùng sách & tài liệu thuế, Bộ bàn ăn gỗ xoan..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nhóm danh mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'Tất cả').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mô tả chi tiết / Tình trạng đóng gói
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Bọc nilon chống ẩm, dán nhãn Thùng số 4, chứa tài liệu năm 2024..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Đường dẫn ảnh chụp minh họa (Tùy chọn)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photos/item.jpg"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 disabled:opacity-50 uppercase tracking-wider"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingItem ? 'Lưu thay đổi' : 'Thêm vào kho'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
