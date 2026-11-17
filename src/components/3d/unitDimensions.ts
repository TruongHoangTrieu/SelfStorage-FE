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

function classifyUnitCategory(
  vol: number,
  w: number,
  h: number
): UnitDimensions['category'] {
  if (vol <= 2.5 || (w <= 1.1 && h <= 1.6)) return 'MINI_LOCKER';
  if (vol <= 6.5) return 'SMALL_UNIT';
  if (vol <= 18.0) return 'MEDIUM_UNIT';
  if (vol <= 35.0) return 'LARGE_UNIT';
  return 'EXTRA_LARGE';
}

/**
 * Resolves accurate real-world 3D dimensions based on unit specifications,
 * ensuring each unit type has a distinctive, accurately proportioned 3D model.
 */
export function resolveUnitDimensions(unit: any): UnitDimensions {
  if (!unit) {
    return {
      width: 2.0,
      depth: 3.0,
      height: 2.5,
      volumeM3: 15.0,
      areaM2: 6.0,
      category: 'MEDIUM_UNIT',
      doorType: 'ROLLUP',
      recommendedItems: getItemsForVolume(15.0),
      capacitySummary: getCapacitySummary(15.0),
    };
  }

  // 1. If explicit width, length/depth, height are provided directly in API
  const rawW = Number(unit.width || unit.widthMeters || unit.sizeWidth);
  const rawD = Number(unit.depth || unit.length || unit.depthMeters || unit.sizeLength);
  const rawH = Number(unit.height || unit.heightMeters || unit.sizeHeight);

  if (rawW > 0 && rawD > 0 && rawH > 0) {
    const vol = Number((rawW * rawD * rawH).toFixed(2));
    const area = Number((rawW * rawD).toFixed(2));
    const category = classifyUnitCategory(vol, rawW, rawH);
    const isSmall = category === 'MINI_LOCKER';
    return {
      width: Number(rawW.toFixed(2)),
      depth: Number(rawD.toFixed(2)),
      height: Number(rawH.toFixed(2)),
      volumeM3: vol,
      areaM2: area,
      category,
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
      const category = classifyUnitCategory(vol, w, h);
      const isSmall = category === 'MINI_LOCKER';
      return {
        width: w,
        depth: d,
        height: h,
        volumeM3: vol,
        areaM2: area,
        category,
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
      const h = (w <= 1.1 && d <= 1.1) ? 1.4 : (w >= 3 || d >= 3.5) ? 2.8 : 2.5;
      const vol = Number((w * d * h).toFixed(2));
      const area = Number((w * d).toFixed(2));
      const category = classifyUnitCategory(vol, w, h);
      const isSmall = category === 'MINI_LOCKER';
      return {
        width: w,
        depth: d,
        height: h,
        volumeM3: vol,
        areaM2: area,
        category,
        doorType: isSmall ? 'HINGED' : 'ROLLUP',
        recommendedItems: getItemsForVolume(vol),
        capacitySummary: getCapacitySummary(vol),
      };
    }
  }

  // 3. Parse from size number and sizeUnit (standardized: 1m2, 2m2, 6m2, 18m2)
  const rawSize = parseFloat(String(unit.size || '0').replace(',', '.'));
  const sizeUnit = String(unit.sizeUnit || '').toUpperCase();
  const isM2 = sizeUnit.includes('M2') || sizeUnit.includes('M²') || name.includes('m2') || name.includes('m²');

  if (isM2 && rawSize > 0) {
    let w = 1.0;
    let d = 1.0;
    let h = 2.4;

    if (rawSize <= 1.2) {
      // 1 m² Locker: 1.0m x 1.0m x 1.4m
      w = 1.0;
      d = 1.0;
      h = 1.4;
    } else if (rawSize <= 2.5) {
      // 2 m² Mini Unit: 1.2m x 1.7m x 2.2m
      w = 1.2;
      d = Number((rawSize / 1.2).toFixed(1));
      h = 2.2;
    } else if (rawSize <= 4.0) {
      w = 1.5;
      d = Number((rawSize / 1.5).toFixed(1));
      h = 2.4;
    } else if (rawSize <= 7.0) {
      // 6 m² Standard / Family Unit: 2.0m x 3.0m x 2.5m
      w = 2.0;
      d = Number((rawSize / 2.0).toFixed(1));
      h = 2.5;
    } else if (rawSize <= 12.0) {
      w = 2.5;
      d = Number((rawSize / 2.5).toFixed(1));
      h = 2.6;
    } else {
      // 18 m² Enterprise / Large Unit: 3.6m x 5.0m x 2.8m
      w = 3.6;
      d = Number((rawSize / 3.6).toFixed(1));
      h = 2.8;
    }

    const area = Number(rawSize.toFixed(1));
    const vol = Number((w * d * h).toFixed(2));
    const category = classifyUnitCategory(vol, w, h);
    const isSmall = category === 'MINI_LOCKER';

    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: vol,
      areaM2: area,
      category,
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

  // Mini Locker (1 m² / <= 2.5 CBM)
  if (
    parsedVolume <= 2.5 ||
    name.includes('locker') ||
    code.includes('lock') ||
    name.includes('1 cbm') ||
    name.includes('1m')
  ) {
    const w = 1.0;
    const d = 1.0;
    const h = 1.4;
    const vol = Number((w * d * h).toFixed(2));
    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: vol,
      areaM2: 1.0,
      category: 'MINI_LOCKER',
      doorType: 'HINGED',
      recommendedItems: getItemsForVolume(vol),
      capacitySummary: getCapacitySummary(vol),
    };
  }

  // Small / Mini Unit (2 m² / ~4.5 CBM)
  if (
    parsedVolume <= 6.5 ||
    name.includes('mini') ||
    name.includes('nhỏ') ||
    name.includes('tiểu') ||
    name.includes('small')
  ) {
    const w = 1.2;
    const d = 1.7;
    const h = 2.2;
    const vol = Number((w * d * h).toFixed(2));
    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: vol,
      areaM2: 2.0,
      category: 'SMALL_UNIT',
      doorType: 'ROLLUP',
      recommendedItems: getItemsForVolume(vol),
      capacitySummary: getCapacitySummary(vol),
    };
  }

  // Standard / Family Unit (6 m² / ~15 CBM)
  if (
    parsedVolume <= 18.0 ||
    name.includes('tiêu chuẩn') ||
    name.includes('gia đình') ||
    name.includes('vừa') ||
    name.includes('medium')
  ) {
    const w = 2.0;
    const d = 3.0;
    const h = 2.5;
    const vol = Number((w * d * h).toFixed(2));
    return {
      width: w,
      depth: d,
      height: h,
      volumeM3: vol,
      areaM2: 6.0,
      category: 'MEDIUM_UNIT',
      doorType: 'ROLLUP',
      recommendedItems: getItemsForVolume(vol),
      capacitySummary: getCapacitySummary(vol),
    };
  }

  // Enterprise / Large Unit (18 m² / ~50.4 CBM)
  const w = 3.6;
  const d = 5.0;
  const h = 2.8;
  const vol = Number((w * d * h).toFixed(2));
  return {
    width: w,
    depth: d,
    height: h,
    volumeM3: vol,
    areaM2: 18.0,
    category: 'EXTRA_LARGE',
    doorType: 'ROLLUP',
    recommendedItems: getItemsForVolume(vol),
    capacitySummary: getCapacitySummary(vol),
  };
}

function getItemsForVolume(vol: number): string[] {
  if (vol <= 2.5) {
    return [
      '1–2 vali du lịch',
      '3–4 thùng carton / hộp hồ sơ',
      'Balo & vật dụng cá nhân nhỏ',
    ];
  }
  if (vol <= 6.5) {
    return [
      '1 kệ sắt 3 tầng phân loại đồ',
      '6–8 thùng carton tiêu chuẩn',
      '1–2 vali du lịch & hộp hồ sơ',
      'Ghế làm việc & đồ phòng trọ',
    ];
  }
  if (vol <= 18.0) {
    return [
      '1 kệ sắt 3 tầng + 10–12 thùng đồ',
      '1 Tủ lạnh & 1 Máy giặt gia đình',
      '1 Ghế Sofa vừa & vali du lịch',
      'Nội thất căn hộ Studio / 1PN',
    ];
  }
  return [
    'Hệ thống 2 kệ sắt 3 tầng lớn',
    '25–30 thùng carton / kiện hàng TMĐT',
    'Bộ Sofa lớn, Tủ lạnh & Máy giặt',
    'Hàng hóa kinh doanh & thiết bị',
  ];
}

function getCapacitySummary(vol: number): string {
  if (vol <= 2.5) {
    return 'Tủ Locker cá nhân (1 m²): Gửi vali du lịch, hộp hồ sơ tài liệu, balo cá nhân ngắn hạn';
  }
  if (vol <= 6.5) {
    return 'Kho Mini cá nhân (2 m²): Phù hợp đồ đạc phòng trọ sinh viên, lưu trữ hồ sơ cá nhân';
  }
  if (vol <= 18.0) {
    return 'Kho Gia Đình tiêu chuẩn (6 m²): Phù hợp nội thất căn hộ Studio / 1 phòng ngủ';
  }
  return 'Kho Doanh Nghiệp lớn (18 m²): Phù hợp căn hộ 2–3 phòng ngủ hoặc kho hàng Shop Online';
}
