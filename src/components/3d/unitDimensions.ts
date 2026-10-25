export interface UnitDimensions {
  width: number; // in meters (X)
  depth: number; // in meters (Z)
  height: number; // in meters (Y)
  volumeM3: number;
  areaM2: number;
  category: 'MINI_LOCKER' | 'SMALL_UNIT' | 'MEDIUM_UNIT' | 'LARGE_UNIT' | 'EXTRA_LARGE' | 'WAREHOUSE_XXL';
  doorType: 'HINGED' | 'ROLLUP';
  recommendedItems: string[];
  capacitySummary: string;
}

/**
 * Resolves accurate real-world 3D dimensions based on unit specifications,
 * ensuring each unit type has a distinctive, accurately proportioned 3D model.
 */
export function resolveUnitDimensions(unit: any): UnitDimensions {
  if (!unit) {
    return {
      width: 1.8,
      depth: 2.2,
      height: 2.4,
      volumeM3: 9.5,
      areaM2: 3.96,
      category: 'MEDIUM_UNIT',
      doorType: 'ROLLUP',
      recommendedItems: ['10-15 thùng đồ', 'Sofa đơn', 'Bàn làm việc', 'Tủ lạnh', 'Xe đạp'],
      capacitySummary: 'Phù hợp căn hộ 1 phòng ngủ hoặc văn phòng nhỏ',
    };
  }

  // 1. If explicit width, length/depth, height are provided directly in API
  const rawW = Number(unit.width || unit.widthMeters || unit.sizeWidth);
  const rawD = Number(unit.depth || unit.length || unit.depthMeters || unit.sizeLength);
  const rawH = Number(unit.height || unit.heightMeters || unit.sizeHeight);

  if (rawW > 0 && rawD > 0 && rawH > 0) {
    const vol = Number((rawW * rawD * rawH).toFixed(2));
    const area = Number((rawW * rawD).toFixed(2));
    const isSmall = vol <= 2.5 || (rawW <= 1.2 && rawH <= 1.6);
    return {
      width: Number(rawW.toFixed(2)),
      depth: Number(rawD.toFixed(2)),
      height: Number(rawH.toFixed(2)),
      volumeM3: vol,
      areaM2: area,
      category: isSmall ? 'MINI_LOCKER' : vol <= 6 ? 'SMALL_UNIT' : vol <= 16 ? 'LARGE_UNIT' : 'EXTRA_LARGE',
      doorType: isSmall ? 'HINGED' : 'ROLLUP',
      recommendedItems: getItemsForVolume(vol),
      capacitySummary: getCapacitySummary(vol),
    };
  }

  const name = String(unit.name || '').toLowerCase();
  const desc = String(unit.description || '').toLowerCase();
  const code = String(unit.code || '').toLowerCase();
  const fullText = `${name} ${desc} ${code}`;

  // 2. Check if name or description has dimensions format like "1.5 x 2.0" or "1.5x2.0m" or "1.5 x 2.0 x 2.4"
  const dim3Match = fullText.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[xX*]\s*(\d+(?:\.\d+)?)\s*(?:m)?\s*[xX*]\s*(\d+(?:\.\d+)?)/);
  if (dim3Match) {
    const w = parseFloat(dim3Match[1]);
    const d = parseFloat(dim3Match[2]);
    const h = parseFloat(dim3Match[3]);
    if (w > 0 && d > 0 && h > 0) {
      const vol = Number((w * d * h).toFixed(2));
      const area = Number((w * d).toFixed(2));
      const isSmall = vol <= 2.5 || (w <= 1.1 && h <= 1.6);
      return {
        width: w,
        depth: d,
        height: h,
        volumeM3: vol,
        areaM2: area,
        category: isSmall ? 'MINI_LOCKER' : vol <= 6 ? 'SMALL_UNIT' : vol <= 16 ? 'LARGE_UNIT' : 'EXTRA_LARGE',
        doorType: isSmall ? 'HINGED' : 'ROLLUP',
        recommendedItems: getItemsForVolume(vol),
        capacitySummary: getCapacitySummary(vol),
      };
    }
  }

  const dim2Match = fullText.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[xX*]\s*(\d+(?:\.\d+)?)/);
  if (dim2Match) {
    const w = parseFloat(dim2Match[1]);
    const d = parseFloat(dim2Match[2]);
    if (w > 0 && d > 0) {
      const h = (w <= 1.1 && d <= 1.1) ? 1.4 : (w >= 3 || d >= 3.5) ? 2.8 : 2.4;
      const vol = Number((w * d * h).toFixed(2));
      const area = Number((w * d).toFixed(2));
      const isSmall = vol <= 2.5 || (w <= 1.1 && h <= 1.6);
      return {
        width: w,
        depth: d,
        height: h,
        volumeM3: vol,
        areaM2: area,
        category: isSmall ? 'MINI_LOCKER' : vol <= 6 ? 'SMALL_UNIT' : vol <= 16 ? 'LARGE_UNIT' : 'EXTRA_LARGE',
        doorType: isSmall ? 'HINGED' : 'ROLLUP',
        recommendedItems: getItemsForVolume(vol),
        capacitySummary: getCapacitySummary(vol),
      };
    }
  }

  // 3. Parse from size number and sizeUnit (e.g. 1m2, 3m2, 5m2, 10m2 or 3 CBM, 5 CBM, 15 CBM)
  const rawSize = parseFloat(String(unit.size || '0').replace(',', '.'));
  const sizeUnit = String(unit.sizeUnit || '').toUpperCase();
  const isM2 = sizeUnit.includes('M2') || sizeUnit.includes('M²') || name.includes('m2') || name.includes('m²');

  if (isM2 && rawSize > 0) {
    // Exact square meters calculation
    let w = 1.0;
    let d = 1.0;
    let h = 2.4;

    if (rawSize <= 1.2) {
      w = 1.0;
      d = 1.0;
      h = 1.4;
    } else if (rawSize <= 2.5) {
      w = 1.2;
      d = Number((rawSize / 1.2).toFixed(1));
      h = 2.2;
    } else if (rawSize <= 4.0) {
      w = 1.5;
      d = Number((rawSize / 1.5).toFixed(1));
      h = 2.4;
    } else if (rawSize <= 6.5) {
      w = 2.0;
      d = Number((rawSize / 2.0).toFixed(1));
      h = 2.5;
    } else if (rawSize <= 10.0) {
      w = 2.5;
      d = Number((rawSize / 2.5).toFixed(1));
      h = 2.6;
    } else if (rawSize <= 16.0) {
      w = 3.0;
      d = Number((rawSize / 3.0).toFixed(1));
      h = 2.8;
    } else {
      w = 4.0;
      d = Number((rawSize / 4.0).toFixed(1));
      h = 3.0;
    }

    const area = Number((w * d).toFixed(2));
    const vol = Number((w * d * h).toFixed(2));
    const isSmall = vol <= 2.5 || (w <= 1.1 && h <= 1.6);

    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: vol,
      areaM2: area,
      category: isSmall ? 'MINI_LOCKER' : vol <= 6 ? 'SMALL_UNIT' : vol <= 16 ? 'LARGE_UNIT' : 'EXTRA_LARGE',
      doorType: isSmall ? 'HINGED' : 'ROLLUP',
      recommendedItems: getItemsForVolume(vol),
      capacitySummary: getCapacitySummary(vol),
    };
  }

  // 4. Volume in CBM or m3
  let parsedVolume = 0;
  if (!isNaN(rawSize) && rawSize > 0) {
    parsedVolume = rawSize;
  } else {
    const match = name.match(/(\d+(?:\.\d+)?)\s*(?:cbm|m3|m³)/i);
    if (match) {
      parsedVolume = parseFloat(match[1]);
    }
  }

  // Mini Locker (<= 2 CBM)
  if (
    parsedVolume <= 2 ||
    name.includes('mini') ||
    name.includes('locker') ||
    code.includes('lock') ||
    name.includes('1 cbm') ||
    name.includes('1m')
  ) {
    const w = 1.0;
    const d = 1.0;
    const h = 1.4;
    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: Number((w * d * h).toFixed(2)),
      areaM2: Number((w * d).toFixed(2)),
      category: 'MINI_LOCKER',
      doorType: 'HINGED',
      recommendedItems: ['2 vali du lịch cỡ lớn', '4 thùng carton tiêu chuẩn', 'Balo & tài liệu hồ sơ', 'Túi gậy golf'],
      capacitySummary: 'Tủ cá nhân Mini: Lưu trữ đồ dùng cá nhân, hồ sơ, vali du lịch',
    };
  }

  // Small Unit (3 - 5 CBM)
  if (
    parsedVolume <= 5.5 ||
    name.includes('3 - 5') ||
    name.includes('nhỏ') ||
    name.includes('tiểu') ||
    name.includes('small') ||
    name.includes('3 cbm') ||
    name.includes('5 cbm')
  ) {
    const w = 1.4;
    const d = 1.6;
    const h = 2.2;
    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: Number((w * d * h).toFixed(2)),
      areaM2: Number((w * d).toFixed(2)),
      category: 'SMALL_UNIT',
      doorType: 'ROLLUP',
      recommendedItems: ['10-15 thùng đồ', 'Xe đạp gấp gọn', 'Kệ sắt 3 tầng', 'Quạt cây & máy hút bụi', 'Đồ cắm trại'],
      capacitySummary: 'Kho tiêu chuẩn S: Lưu trữ đồ đạc phòng trọ, sinh viên, tài liệu văn phòng',
    };
  }

  // Medium Unit (6 - 10 CBM)
  if (
    parsedVolume <= 10.5 ||
    name.includes('vừa') ||
    name.includes('medium') ||
    name.includes('6 - 8') ||
    name.includes('8 cbm') ||
    name.includes('10 cbm')
  ) {
    const w = 1.8;
    const d = 2.2;
    const h = 2.4;
    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: Number((w * d * h).toFixed(2)),
      areaM2: Number((w * d).toFixed(2)),
      category: 'MEDIUM_UNIT',
      doorType: 'ROLLUP',
      recommendedItems: ['20-25 thùng đồ', 'Sofa bọc nỉ', 'Máy giặt & tủ lạnh mini', 'Bàn trà & ghế tựa', 'Tủ quần áo nhỏ'],
      capacitySummary: 'Kho tiêu chuẩn M: Đồ đạc căn hộ 1 phòng ngủ, chuyển nhà ngắn hạn',
    };
  }

  // Large Unit (11 - 18 CBM)
  if (
    parsedVolume <= 18 ||
    name.includes('lớn') ||
    name.includes('gia đình') ||
    name.includes('large') ||
    name.includes('12 cbm') ||
    name.includes('15 cbm')
  ) {
    const w = 2.4;
    const d = 2.6;
    const h = 2.6;
    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: Number((w * d * h).toFixed(2)),
      areaM2: Number((w * d).toFixed(2)),
      category: 'LARGE_UNIT',
      doorType: 'ROLLUP',
      recommendedItems: ['35-40 thùng đồ', 'Sofa lớn 3 chỗ', 'Tủ lạnh 2 cánh Side-by-side', 'Giường & nệm King size', 'Máy giặt & máy sấy'],
      capacitySummary: 'Kho gia đình L: Đồ đạc trọn gói căn hộ 2-3 phòng ngủ khi sửa nhà',
    };
  }

  // Extra Large (19 - 35 CBM)
  if (
    parsedVolume <= 35 ||
    name.includes('doanh nghiệp') ||
    name.includes('kinh doanh') ||
    name.includes('xl') ||
    name.includes('25 cbm') ||
    name.includes('30 cbm')
  ) {
    const w = 3.0;
    const d = 3.6;
    const h = 2.8;
    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: Number((w * d * h).toFixed(2)),
      areaM2: Number((w * d).toFixed(2)),
      category: 'EXTRA_LARGE',
      doorType: 'ROLLUP',
      recommendedItems: ['1 Xe máy', '60+ thùng hàng hóa', '2 Pallet hàng tiêu chuẩn', 'Hệ thống kệ kho công nghiệp 4 tầng', 'Toàn bộ nội thất nhà phố'],
      capacitySummary: 'Kho thương mại XL: Kho hàng TMĐT, nhà phân phối hoặc nội thất biệt thự',
    };
  }

  // Warehouse XXL (> 35 CBM)
  const w = 3.8;
  const d = 4.6;
  const h = 3.0;
  return {
    width: w,
    depth: d,
    height: h,
    volumeM3: Number((w * d * h).toFixed(2)),
    areaM2: Number((w * d).toFixed(2)),
    category: 'WAREHOUSE_XXL',
    doorType: 'ROLLUP',
    recommendedItems: ['2 Xe máy', '100+ kiện hàng', '4 Pallet lưu kho', 'Nhiều dãy kệ sắt công nghiệp'],
    capacitySummary: 'Kho cực đại XXL: Doanh nghiệp logistics, hàng xuất nhập khẩu quy mô lớn',
  };
}

function getItemsForVolume(vol: number): string[] {
  if (vol <= 2.5) return ['2 vali du lịch cỡ lớn', '4 thùng carton tiêu chuẩn', 'Balo & tài liệu hồ sơ'];
  if (vol <= 6) return ['10-15 thùng đồ', 'Xe đạp gấp gọn', 'Kệ sắt 3 tầng', 'Quạt cây & máy hút bụi'];
  if (vol <= 12) return ['20-25 thùng đồ', 'Sofa', 'Máy giặt & tủ lạnh mini', 'Bàn trà & ghế tựa'];
  if (vol <= 25) return ['35-40 thùng đồ', 'Sofa lớn', 'Tủ lạnh 2 cánh', 'Giường & nệm', 'Máy giặt'];
  return ['1-2 Xe máy', '60-100+ kiện hàng TMĐT', 'Pallet hàng hóa', 'Dãy kệ kho công nghiệp'];
}

function getCapacitySummary(vol: number): string {
  if (vol <= 2.5) return 'Tủ cá nhân: Lưu trữ tài liệu, vali, túi gậy golf hoặc đồ gia dụng nhỏ';
  if (vol <= 6) return 'Kho tiêu chuẩn S: Phù hợp phòng trọ sinh viên hoặc đồ văn phòng';
  if (vol <= 12) return 'Kho tiêu chuẩn M: Phù hợp căn hộ 1-2 phòng ngủ, chuyển nhà';
  if (vol <= 25) return 'Kho gia đình L: Phù hợp căn hộ 3 phòng ngủ hoặc nhà phố sửa chữa';
  return 'Kho kho bãi XL: Dành cho doanh nghiệp bán hàng online, kho hàng kinh doanh';
}
