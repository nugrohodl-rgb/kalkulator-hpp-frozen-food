/**
 * Kalkulator HPP Frozen Food by Nugita Digital
 * Core Calculations Engine & Unit Converter
 * 
 * Sesuai panduan rumus P2, P3, P4, P5, P9, P10 dan Audit 1–7.
 * Single Source of Truth untuk seluruh perhitungan aplikasi.
 */

// Satuan yang didukung
export const UNIT_TYPES = {
  WEIGHT: 'weight',
  VOLUME: 'volume',
  COUNT: 'count'
};

export const SUPPORTED_UNITS = {
  kg: { name: 'Kilogram (kg)', type: UNIT_TYPES.WEIGHT, toBase: 1000, baseUnit: 'gram' },
  gram: { name: 'Gram (g)', type: UNIT_TYPES.WEIGHT, toBase: 1, baseUnit: 'gram' },
  liter: { name: 'Liter (L)', type: UNIT_TYPES.VOLUME, toBase: 1000, baseUnit: 'ml' },
  ml: { name: 'Mililiter (ml)', type: UNIT_TYPES.VOLUME, toBase: 1, baseUnit: 'ml' },
  pcs: { name: 'Pcs / Butir / Buah', type: UNIT_TYPES.COUNT, toBase: 1, baseUnit: 'pcs' },
  lembar: { name: 'Lembar (kulit/plastik)', type: UNIT_TYPES.COUNT, toBase: 1, baseUnit: 'lembar' },
  batang: { name: 'Batang (sereh/kayu manis)', type: UNIT_TYPES.COUNT, toBase: 1, baseUnit: 'batang' },
  butir: { name: 'Butir (telur/bakso)', type: UNIT_TYPES.COUNT, toBase: 1, baseUnit: 'butir' },
  sachet: { name: 'Sachet / Bungkus', type: UNIT_TYPES.COUNT, toBase: 1, baseUnit: 'sachet' },
  pack: { name: 'Pack / Kemasan', type: UNIT_TYPES.COUNT, toBase: 1, baseUnit: 'pack' },
  ikat: { name: 'Ikat', type: UNIT_TYPES.COUNT, toBase: 1, baseUnit: 'ikat' },
  sendok: { name: 'Sendok makan (sdm ~15g)', type: UNIT_TYPES.WEIGHT, toBase: 15, baseUnit: 'gram' },
  sendok_teh: { name: 'Sendok teh (sdt ~5g)', type: UNIT_TYPES.WEIGHT, toBase: 5, baseUnit: 'gram' }
};

/**
 * Konversi jumlah dari satu satuan ke satuan lain yang sejenis.
 * @param {number} amount - Jumlah nilai yang akan dikonversi
 * @param {string} fromUnit - Satuan asal (contoh: 'kg', 'liter', 'pcs')
 * @param {string} toUnit - Satuan tujuan (contoh: 'gram', 'ml', 'pcs')
 * @returns {{ success: boolean, value: number, error?: string }}
 */
export function convertUnit(amount, fromUnit, toUnit) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return { success: false, value: 0, error: 'Jumlah tidak valid' };
  }

  const num = Number(amount);
  if (num < 0) {
    return { success: false, value: 0, error: 'Jumlah tidak boleh bernilai negatif.' };
  }

  const from = (fromUnit || '').toLowerCase().trim();
  const to = (toUnit || '').toLowerCase().trim();

  if (from === to) {
    return { success: true, value: num };
  }

  const uFrom = SUPPORTED_UNITS[from];
  const uTo = SUPPORTED_UNITS[to];

  if (!uFrom || !uTo) {
    return {
      success: false,
      value: 0,
      error: `Satuan "${from}" atau "${to}" tidak dikenali.`
    };
  }

  // Tolak konversi antar tipe yang tidak sejenis tanpa rasio spesifik (misal kg ke pcs)
  if (uFrom.type !== uTo.type) {
    return {
      success: false,
      value: 0,
      error: `Tidak dapat mengonversi ${uFrom.name} ke ${uTo.name} secara langsung karena berbeda jenis satuan.`
    };
  }

  // Konversi ke base unit lalu ke target unit (presisi float tinggi)
  const baseValue = num * uFrom.toBase;
  const targetValue = baseValue / uTo.toBase;

  return { success: true, value: targetValue };
}

/**
 * Menghitung harga per satuan dasar (misal Rp per gram atau Rp per ml)
 * @param {number} purchasePrice - Harga beli total (Rp)
 * @param {number} purchaseQty - Jumlah beli
 * @param {string} purchaseUnit - Satuan beli
 * @returns {{ success: boolean, pricePerBase: number, baseUnit: string, error?: string }}
 */
export function calculateBaseUnitPrice(purchasePrice, purchaseQty, purchaseUnit) {
  const price = Number(purchasePrice);
  const qty = Number(purchaseQty);
  const unit = (purchaseUnit || '').toLowerCase().trim();

  if (isNaN(price) || price < 0) {
    return { success: false, pricePerBase: 0, baseUnit: unit, error: 'Harga pembelian tidak boleh negatif' };
  }
  if (isNaN(qty) || qty <= 0) {
    return { success: false, pricePerBase: 0, baseUnit: unit, error: 'Jumlah pembelian harus lebih besar dari 0' };
  }

  const u = SUPPORTED_UNITS[unit];
  if (!u) {
    return { success: true, pricePerBase: price / qty, baseUnit: unit };
  }

  const totalBaseUnits = qty * u.toBase;
  const pricePerBase = price / totalBaseUnits;

  return {
    success: true,
    pricePerBase,
    baseUnit: u.baseUnit
  };
}

/**
 * Menghitung biaya bahan yang digunakan dalam satu batch.
 * @param {Object} ingredient
 * @param {string} ingredient.name - Nama bahan
 * @param {number} ingredient.purchasePrice - Harga beli
 * @param {number} ingredient.purchaseQty - Jumlah beli
 * @param {string} ingredient.purchaseUnit - Satuan beli
 * @param {number} ingredient.usageQty - Jumlah pakai
 * @param {string} ingredient.usageUnit - Satuan pakai
 * @returns {{ success: boolean, cost: number, pricePerBase: number, baseUnit: string, error?: string }}
 */
export function calculateIngredientCost(ingredient) {
  const {
    purchasePrice,
    purchaseQty,
    purchaseUnit,
    usageQty,
    usageUnit,
    name,
    conversionFactor
  } = ingredient || {};

  const pPrice = Number(purchasePrice);
  const pQty = Number(purchaseQty);
  const uQty = Number(usageQty);
  const pUnit = (purchaseUnit || '').toLowerCase().trim();
  const uUnit = (usageUnit || '').toLowerCase().trim();
  const ingName = (name || '').toLowerCase().trim();

  // Validasi ketat (Kasus E: Harga dan jumlah negatif harus ditolak)
  if (isNaN(pPrice) || pPrice < 0) {
    return { success: false, cost: 0, pricePerBase: 0, baseUnit: pUnit, unitPriceSource: '-', error: 'Harga pembelian tidak boleh negatif.' };
  }
  if (isNaN(pQty) || pQty <= 0) {
    return { success: false, cost: 0, pricePerBase: 0, baseUnit: pUnit, unitPriceSource: '-', error: 'Jumlah pembelian harus lebih besar dari 0.' };
  }
  if (isNaN(uQty) || uQty < 0) {
    return { success: false, cost: 0, pricePerBase: 0, baseUnit: pUnit, unitPriceSource: '-', error: 'Jumlah pemakaian tidak boleh negatif.' };
  }

  const uP = SUPPORTED_UNITS[pUnit];
  const uU = SUPPORTED_UNITS[uUnit];

  // Penanganan faktor konversi eksplisit atau standar kuliner telur
  const isEgg = ingName.includes('telur') || ingName.includes('egg');
  const isPurchaseWeight = pUnit === 'kg' || pUnit === 'gram';
  const isUsageCount = uUnit === 'butir' || uUnit === 'pcs';
  const isPurchaseCount = pUnit === 'butir' || pUnit === 'pcs';
  const isUsageWeight = uUnit === 'kg' || uUnit === 'gram';

  // Ambil faktor konversi yang ditentukan eksplisit oleh pengguna, atau default 16 untuk telur
  const rawConv = Number(conversionFactor);
  const explicitFactor = (!isNaN(rawConv) && rawConv > 0) ? rawConv : (isEgg ? 16 : null);

  if (explicitFactor && ((isPurchaseWeight && isUsageCount) || (isPurchaseCount && isUsageWeight))) {
    // explicitFactor merepresentasikan jumlah butir per kg (atau count per weight)
    const itemsPerKg = explicitFactor;
    const gramsPerItem = 1000 / itemsPerKg;

    if (isPurchaseWeight && isUsageCount) {
      // Beli dalam kg/gram, pakai dalam butir
      const totalItemsPurchased = pQty * (pUnit === 'kg' ? itemsPerKg : (itemsPerKg / 1000));
      const pricePerItem = pPrice / totalItemsPurchased;
      const cost = uQty * pricePerItem;
      const sourceText = `Rp ${Math.round(pricePerItem).toLocaleString('id-ID')}/${uUnit} (dari Rp ${Math.round(pPrice).toLocaleString('id-ID')} ÷ ${itemsPerKg} ${uUnit}/${pUnit})`;

      return {
        success: true,
        cost,
        pricePerBase: pricePerItem,
        baseUnit: uUnit,
        conversionFactor: itemsPerKg,
        unitPriceSource: sourceText,
        note: `Faktor konversi: 1 ${pUnit} = ${itemsPerKg} ${uUnit} (~${gramsPerItem.toFixed(1)}g/${uUnit})`
      };
    } else {
      // Beli dalam butir, pakai dalam gram/kg
      const usedItems = (uQty * (uUnit === 'kg' ? 1000 : 1)) / gramsPerItem;
      const pricePerItem = pPrice / pQty;
      const cost = usedItems * pricePerItem;
      const pricePerGram = pricePerItem / gramsPerItem;
      const sourceText = `Rp ${Math.round(pricePerItem).toLocaleString('id-ID')}/${pUnit} (~Rp ${pricePerGram.toFixed(1)}/g)`;

      return {
        success: true,
        cost,
        pricePerBase: pricePerItem,
        baseUnit: pUnit,
        conversionFactor: itemsPerKg,
        unitPriceSource: sourceText,
        note: `Faktor konversi: 1 butir ~${gramsPerItem.toFixed(1)}g (${itemsPerKg} butir/kg)`
      };
    }
  }

  // Jika kedua satuan dikenali
  if (uP && uU) {
    if (uP.type !== uU.type) {
      return {
        success: false,
        cost: 0,
        pricePerBase: 0,
        baseUnit: pUnit,
        unitPriceSource: '-',
        error: `Satuan beli (${pUnit}) dan pakai (${uUnit}) tidak sejenis. Tentukan faktor konversi eksplisit atau gunakan satuan yang sejenis.`
      };
    }

    // Hitung total unit dasar yang dibeli & dipakai
    const totalPurchasedBase = pQty * uP.toBase;
    const totalUsedBase = uQty * uU.toBase;
    const pricePerBase = pPrice / totalPurchasedBase;
    const cost = totalUsedBase * pricePerBase;
    const sourceText = `Rp ${pricePerBase.toLocaleString('id-ID', { maximumFractionDigits: 2 })}/${uP.baseUnit} (dari Rp ${Math.round(pPrice).toLocaleString('id-ID')} ÷ ${totalPurchasedBase} ${uP.baseUnit})`;

    return {
      success: true,
      cost,
      pricePerBase,
      baseUnit: uP.baseUnit,
      unitPriceSource: sourceText
    };
  }

  // Jika satuan kustom / sama
  if (pUnit === uUnit) {
    const pricePerUnit = pPrice / pQty;
    const sourceText = `Rp ${pricePerUnit.toLocaleString('id-ID', { maximumFractionDigits: 2 })}/${pUnit} (dari Rp ${Math.round(pPrice).toLocaleString('id-ID')} ÷ ${pQty} ${pUnit})`;
    return {
      success: true,
      cost: uQty * pricePerUnit,
      pricePerBase: pricePerUnit,
      baseUnit: pUnit,
      unitPriceSource: sourceText
    };
  }

  return {
    success: false,
    cost: 0,
    pricePerBase: 0,
    baseUnit: pUnit,
    unitPriceSource: '-',
    error: `Satuan tidak kompatibel: ${pUnit} vs ${uUnit}`
  };
}

/**
 * Menjumlahkan seluruh biaya bahan baku.
 * @param {Array<Object>} ingredients
 * @returns {{ total: number, validCount: number, errors: Array<string> }}
 */
export function calculateTotalIngredientsCost(ingredients = []) {
  let total = 0;
  let validCount = 0;
  const errors = [];
  const list = Array.isArray(ingredients) ? ingredients : [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    // Abaikan baris kosong tanpa nama dan tanpa harga
    if (!item.name && (!item.purchasePrice || item.purchasePrice === 0) && (!item.usageQty || item.usageQty === 0)) {
      continue;
    }

    const res = calculateIngredientCost(item);
    if (res.success) {
      total += res.cost;
      validCount++;
    } else {
      errors.push(`Bahan "${item.name || 'Baris ' + (i + 1)}": ${res.error}`);
    }
  }

  return { total, validCount, errors };
}

/**
 * Deteksi potensi double counting bahan vs biaya overhead.
 * @param {Array<Object>} ingredients
 * @param {Object} overheads
 * @param {number} [extraPackCost=0]
 * @returns {Array<string>} Daftar peringatan jika ditemukan indikasi duplikasi
 */
export function checkDoubleCountingWarnings(ingredients = [], overheads = {}, extraPackCost = 0) {
  const warnings = [];

  const ingredientNames = ingredients
    .map(ing => (ing.name || '').toLowerCase())
    .filter(Boolean);

  const hasOilInIngredients = ingredientNames.some(name =>
    name.includes('minyak') || name.includes('oil') || name.includes('mentega') || name.includes('margarin')
  );

  const oilOverhead = Number(overheads.biayaMinyak || 0);
  if (hasOilInIngredients && oilOverhead > 0) {
    warnings.push(
      'Minyak/lemak sudah dimasukkan dalam tabel bahan baku dan juga tercatat di biaya minyak operasional. Pastikan biaya minyak tidak terhitung dua kali.'
    );
  }

  const hasPackagingInIngredients = ingredientNames.some(name =>
    name.includes('plastik') || name.includes('pouch') || name.includes('box') || name.includes('kemasan') || name.includes('mika')
  );

  const packagingOverhead = (Number(overheads.biayaKemasanPerUnit || 0) * Number(overheads.jumlahKemasan || 0)) +
    Number(overheads.biayaKemasanTotal || 0);

  if (hasPackagingInIngredients && packagingOverhead > 0) {
    warnings.push(
      'Kemasan/wadah terdeteksi dalam tabel bahan baku dan juga biaya kemasan operasional. Hindari menghitung kemasan dua kali.'
    );
  }

  const extraPack = Number(extraPackCost || 0);
  if (packagingOverhead > 0 && extraPack > 0) {
    warnings.push(
      'Alokasi Kemasan: Kemasan utama sudah tercatat di operasional batch dan kemasan tambahan tercatat per pack. Pastikan kemasan tambahan per pack hanya mencakup kemasan sekunder (misal kantong luar / cup saus) dan tidak menduplikasi kemasan utama batch.'
    );
  }

  return warnings;
}

/**
 * Menghitung seluruh komponen biaya produksi dan HPP.
 * Sesuai rumus wajib P4 & Audit Rumus 2.
 * 
 * Rumus Baku:
 * Total biaya bahan = jumlah seluruh biaya bahan yang digunakan.
 * Total biaya produksi sebelum cadangan = biaya bahan + kemasan + label + tenaga kerja + energi + biaya operasional lain.
 * Cadangan susut = persentase cadangan × biaya produksi sebelum cadangan.
 * Total HPP batch = total biaya produksi sebelum cadangan + cadangan susut.
 * HPP per unit = total HPP batch ÷ jumlah produk layak jual.
 * HPP per pack = HPP per unit × jumlah unit per pack + biaya tambahan per pack yang belum masuk ke perhitungan sebelumnya.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.ingredients - Daftar bahan
 * @param {Object} params.overheads - Komponen biaya overhead
 * @param {number} params.yieldTotal - Jumlah hasil produksi awal (kotor)
 * @param {number} params.yieldSalable - Jumlah produk layak jual (bersih setelah reject)
 * @param {number} params.unitsPerPack - Jumlah isi per kemasan (pcs/pack)
 * @param {number} params.wasteReservePct - Persentase cadangan susut / reject (%)
 * @param {number} params.extraPackCost - Biaya kemasan luar tambahan per pack (jika ada yang belum masuk ke batch)
 * @returns {Object} Hasil perhitungan HPP lengkap (nilai internal presisi tinggi)
 */
export function calculateHPP(params = {}) {
  const safeParams = params || {};
  const {
    ingredients = [],
    overheads = {},
    yieldTotal = 1,
    yieldSalable = 1,
    unitsPerPack = 1,
    wasteReservePct = 0,
    extraPackCost = 0
  } = safeParams;

  const errors = [];

  // Validasi nilai non-negatif pada overhead
  const parseCost = (val, label) => {
    const num = Number(val);
    if (isNaN(num)) return 0;
    if (num < 0) {
      errors.push(`${label} tidak boleh bernilai negatif.`);
      return 0;
    }
    return num;
  };

  // 1. Total Bahan
  const ingResult = calculateTotalIngredientsCost(ingredients);
  const totalBahan = ingResult.total;
  errors.push(...ingResult.errors);

  // 2. Biaya Operasional / Overhead
  const biayaMinyak = parseCost(overheads.biayaMinyak, 'Biaya minyak');
  
  // Biaya kemasan utama dalam batch
  const biayaKemasanUnit = parseCost(overheads.biayaKemasanPerUnit, 'Biaya kemasan per pack');
  const jumlahKemasan = parseCost(overheads.jumlahKemasan, 'Jumlah kemasan');
  const biayaKemasanFlat = parseCost(overheads.biayaKemasanTotal, 'Total biaya kemasan');
  const totalBiayaKemasan = biayaKemasanFlat > 0 ? biayaKemasanFlat : (biayaKemasanUnit * jumlahKemasan);

  const biayaLabel = parseCost(overheads.biayaLabel, 'Biaya label');
  const biayaTenagaKerja = parseCost(overheads.biayaTenagaKerja, 'Biaya tenaga kerja');
  const biayaEnergi = parseCost(overheads.biayaEnergi, 'Biaya energi'); // Gas, listrik, air
  const biayaTransportasi = parseCost(overheads.biayaTransportasi, 'Biaya transportasi');
  const biayaLainnya = parseCost(overheads.biayaLainnya, 'Biaya lainnya');

  // B. Total Biaya Produksi Sebelum Cadangan
  const totalBiayaSebelumCadangan =
    totalBahan +
    biayaMinyak +
    totalBiayaKemasan +
    biayaLabel +
    biayaTenagaKerja +
    biayaEnergi +
    biayaTransportasi +
    biayaLainnya;

  // C. Cadangan Susut
  const reservePct = parseCost(wasteReservePct, 'Persentase cadangan susut');
  const cadanganSusut = (reservePct / 100) * totalBiayaSebelumCadangan;

  // D. Total HPP Batch
  const totalHppBatch = totalBiayaSebelumCadangan + cadanganSusut;

  // Validasi yield produksi
  const totalYield = Math.max(0, Number(yieldTotal) || 0);
  const salable = Math.max(0, Number(yieldSalable) || 0);
  const yieldReject = Math.max(0, totalYield - salable);

  if (isNaN(totalYield) || totalYield < 0) {
    errors.push('Jumlah hasil produksi tidak boleh bernilai negatif.');
  }

  if (isNaN(salable) || salable <= 0) {
    errors.push('Jumlah produk layak jual harus lebih besar dari 0.');
  }

  // E. HPP per Unit (presisi float murni)
  // Biaya reject fisik produk sudah diserap oleh produk layak jual melalui pembagian totalHppBatch / salable
  const hppPerUnit = (salable > 0 && errors.length === 0) ? (totalHppBatch / salable) : 0;

  // F. HPP per Kemasan (Pack)
  const isiPack = Math.max(1, Number(unitsPerPack) || 1);
  const extraPack = parseCost(extraPackCost, 'Biaya kemasan tambahan per pack');
  
  // HPP per pack = HPP per unit presisi × isi pack + biaya tambahan per pack yang belum masuk ke batch
  const hppPerKemasan = (hppPerUnit * isiPack) + extraPack;

  // Pack Penuh dan Sisa Unit
  const fullPacks = salable > 0 ? Math.floor(salable / isiPack) : 0;
  const remainderUnits = salable > 0 ? (salable % isiPack) : 0;
  const hasRemainder = remainderUnits > 0;
  const recommendedPackagingCount = salable > 0 ? Math.ceil(salable / isiPack) : 0;
  const totalPacksProduced = salable > 0 ? (salable / isiPack) : 0;

  // Cek potensi double counting
  const warnings = checkDoubleCountingWarnings(ingredients, overheads, extraPack);

  const isValid = errors.length === 0 && salable > 0;

  return {
    totalBahan,
    biayaMinyak,
    totalBiayaKemasan,
    biayaLabel,
    biayaTenagaKerja,
    biayaEnergi,
    biayaTransportasi,
    biayaLainnya,
    totalBiayaSebelumCadangan,
    reservePct,
    cadanganSusut,
    totalHppBatch,
    yieldTotal: totalYield,
    yieldSalable: salable,
    yieldReject,
    unitsPerPack: isiPack,
    fullPacks,
    remainderUnits,
    hasRemainder,
    recommendedPackagingCount,
    extraPackCost: extraPack,
    totalPacksProduced,
    hppPerUnit,
    hppPerKemasan,
    warnings,
    errors,
    isValid
  };
}

/**
 * Pembulatan harga jual berdasarkan opsi konfigurasi
 * @param {number} price
 * @param {string|number} roundingOption - 'none', '100', '500', '1000'
 * @returns {number}
 */
export function roundSellingPrice(price, roundingOption = 'none') {
  const p = Number(price);
  if (isNaN(p) || p <= 0) return 0;

  const opt = String(roundingOption).toLowerCase();
  switch (opt) {
    case '100':
      return Math.ceil(p / 100) * 100;
    case '500':
      return Math.ceil(p / 500) * 500;
    case '1000':
      return Math.ceil(p / 1000) * 1000;
    case 'none':
    default:
      return p; // Presisi penuh tanpa pembulatan
  }
}

/**
 * Menghitung rekomendasi harga jual, margin, markup, laba, dan BEP.
 * Sesuai rumus wajib P5 & Audit 4.
 * 
 * Rumus Baku:
 * Harga jual = (HPP + biaya penjualan tetap) / (1 - persentase biaya penjualan - target margin)
 * Laba per unit = harga jual − HPP − biaya penjualan variabel − biaya penjualan tetap
 * Margin aktual = (laba / harga jual) × 100%
 * Markup aktual = (laba / HPP) × 100%
 * 
 * @param {Object} params
 * @param {number} params.hppPerUnit - HPP per unit atau HPP per pack (dasar perhitungan harga)
 * @param {number} params.targetMarginPct - Target margin keuntungan (%)
 * @param {number} params.platformFeePct - Biaya marketplace/platform (%)
 * @param {number} params.paymentFeePct - Biaya payment gateway/QRIS (%)
 * @param {number} params.fixedSellingFee - Biaya penjualan tetap per unit (Rp)
 * @param {number} [params.manualSellingPrice] - Harga jual manual untuk testing/simulasi
 * @param {number} [params.salableCount] - Jumlah unit/pack untuk kalkulasi laba batch
 * @param {string} [params.roundingOption] - Opsi pembulatan ('none', '100', '500', '1000')
 * @returns {Object} Hasil perhitungan harga jual & laba
 */
export function calculateSellingPriceAndProfit(params = {}) {
  const safeParams = params || {};
  const {
    hppPerUnit = 0,
    targetMarginPct = 30,
    platformFeePct = 0,
    paymentFeePct = 0,
    fixedSellingFee = 0,
    manualSellingPrice = 0,
    salableCount = 1,
    roundingOption = 'none'
  } = safeParams;

  const hpp = Number(hppPerUnit);
  const targetMargin = Number(targetMarginPct);
  const platformFee = Number(platformFeePct);
  const paymentFee = Number(paymentFeePct);
  const fixedFee = Number(fixedSellingFee);
  const qty = Math.max(0, Number(salableCount) || 1);

  // Validasi nilai negatif
  if (hpp < 0 || targetMargin < 0 || platformFee < 0 || paymentFee < 0 || fixedFee < 0) {
    return {
      hpp: Math.max(0, hpp),
      targetMarginPct: Math.max(0, targetMargin),
      platformFeePct: Math.max(0, platformFee),
      paymentFeePct: Math.max(0, paymentFee),
      totalSalesFeePct: 0,
      fixedSellingFee: Math.max(0, fixedFee),
      isRateValid: false,
      validationError: 'Komponen harga, HPP, atau persentase tidak boleh bernilai negatif.',
      rawRecommendedPrice: 0,
      recommendedPrice: 0,
      activeSellingPrice: 0,
      isUsingManualPrice: false,
      biayaPenjualanVariabel: 0,
      totalBiayaPenjualan: 0,
      labaPerUnit: 0,
      labaPerBatch: 0,
      marginAktual: 0,
      markupAktual: 0,
      contributionMarginPerUnit: 0
    };
  }

  // Konversi persentase ke desimal
  const targetMarginRate = targetMargin / 100;
  const platformFeeRate = platformFee / 100;
  const paymentFeeRate = paymentFee / 100;
  const totalSalesFeeRate = platformFeeRate + paymentFeeRate;
  const totalRateSum = totalSalesFeeRate + targetMarginRate;

  // Validasi: Jika total biaya penjualan + target margin >= 100% (Kasus E & P5)
  let isRateValid = true;
  let validationError = null;

  if (totalRateSum >= 1) {
    isRateValid = false;
    validationError = `Total biaya penjualan (${(totalSalesFeeRate * 100).toFixed(1)}%) dan target margin (${targetMargin}%) mencapai ${(totalRateSum * 100).toFixed(1)}% (≥ 100%). Rekomendasi harga tidak dapat dihitung karena pembagi tidak boleh ≤ 0.`;
  }

  let rawRecommendedPrice = 0;
  let recommendedPrice = 0;

  if (isRateValid && hpp > 0) {
    const denominator = 1 - totalSalesFeeRate - targetMarginRate;
    rawRecommendedPrice = (hpp + fixedFee) / denominator;
    recommendedPrice = roundSellingPrice(rawRecommendedPrice, roundingOption);
  }

  // Tentukan harga acuan aktif (manual vs rekomendasi)
  const manual = Number(manualSellingPrice) || 0;
  const activeSellingPrice = manual > 0 ? manual : recommendedPrice;

  // Hitung komponen laba berdasarkan harga aktif
  const biayaPenjualanVariabel = activeSellingPrice * totalSalesFeeRate;
  const totalBiayaPenjualan = biayaPenjualanVariabel + fixedFee;

  // Laba per unit = harga jual - HPP - biaya penjualan variabel - biaya penjualan tetap
  const labaPerUnit = activeSellingPrice - hpp - totalBiayaPenjualan;
  const labaPerBatch = labaPerUnit * qty;

  // Margin aktual = (laba / harga jual) * 100%
  const marginAktual = activeSellingPrice > 0 ? (labaPerUnit / activeSellingPrice) * 100 : 0;

  // Markup aktual = (laba / HPP) * 100%
  const markupAktual = hpp > 0 ? (labaPerUnit / hpp) * 100 : 0;

  // Break-even per unit contribution:
  const contributionMarginPerUnit = activeSellingPrice - (hpp + biayaPenjualanVariabel + fixedFee);

  return {
    hpp,
    targetMarginPct: targetMargin,
    platformFeePct: platformFee,
    paymentFeePct: paymentFee,
    totalSalesFeePct: totalSalesFeeRate * 100,
    fixedSellingFee: fixedFee,
    isRateValid,
    validationError,
    rawRecommendedPrice,
    recommendedPrice,
    activeSellingPrice,
    isUsingManualPrice: manual > 0,
    biayaPenjualanVariabel,
    totalBiayaPenjualan,
    labaPerUnit,
    labaPerBatch,
    marginAktual,
    markupAktual,
    contributionMarginPerUnit
  };
}

/**
 * Format angka ke format mata uang Rupiah Indonesia yang bersih dan rapi.
 * @param {number} amount
 * @param {boolean} [showDecimals=false]
 * @returns {string} Contoh: "Rp 25.000"
 */
export function formatRupiah(amount, showDecimals = false) {
  const val = Number(amount);
  if (isNaN(val)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(val);
}

/**
 * Format persentase dengan 1 angka di belakang koma.
 * @param {number} val
 * @returns {string} Contoh: "25.4%"
 */
export function formatPercent(val) {
  const num = Number(val);
  if (isNaN(num)) return '0%';
  return `${num.toFixed(1)}%`;
}

/**
 * Evaluasi status kelengkapan data dan kalkulasi resep.
 * Membedakan 5 kondisi sesuai audit:
 * 1. Resep belum memiliki data bahan baku (NO_INGREDIENTS)
 * 2. Resep belum memiliki jumlah hasil produksi yang valid (INVALID_YIELD)
 * 3. Resep belum memiliki biaya yang cukup untuk menghitung HPP (INSUFFICIENT_COST)
 * 4. Resep memiliki data lengkap tetapi fungsi kalkulasi gagal (CALCULATION_ERROR)
 * 5. Resep lengkap & kalkulasi valid (VALID)
 * 
 * @param {Object} recipe
 * @returns {Object} { status, label, badgeClass, message, canCalculate, calc }
 */
export function getRecipeStatus(recipe) {
  if (!recipe) {
    return {
      status: 'NO_INGREDIENTS',
      label: 'Lengkapi data resep',
      badgeClass: 'badge-warning',
      message: 'Data resep tidak ditemukan.',
      canCalculate: false,
      calc: null
    };
  }

  const rawIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  // Baris bahan yang aktif diisi (memiliki nama atau harga beli atau pemakaian)
  const filledIngredients = rawIngredients.filter(ing => 
    ing && (
      (typeof ing.name === 'string' && ing.name.trim().length > 0) ||
      (Number(ing.purchasePrice) > 0) ||
      (Number(ing.usageQty) > 0)
    )
  );

  // 1. Resep belum memiliki data bahan
  if (filledIngredients.length === 0) {
    return {
      status: 'NO_INGREDIENTS',
      label: 'Lengkapi data bahan',
      badgeClass: 'badge-warning',
      message: 'Belum ada bahan baku yang dimasukkan.',
      canCalculate: false,
      calc: null
    };
  }

  // 2. Resep belum memiliki jumlah hasil produksi yang valid
  const salable = Number(recipe.yieldSalable);
  if (isNaN(salable) || salable <= 0) {
    return {
      status: 'INVALID_YIELD',
      label: 'Lengkapi hasil produksi',
      badgeClass: 'badge-warning',
      message: 'Jumlah produk layak jual harus lebih besar dari 0.',
      canCalculate: false,
      calc: null
    };
  }

  // Jalankan kalkulasi HPP dengan single source of truth
  const calc = calculateHPP({
    ingredients: recipe.ingredients || [],
    overheads: recipe.overheads || {},
    yieldTotal: recipe.yieldTotal,
    yieldSalable: recipe.yieldSalable,
    unitsPerPack: recipe.unitsPerPack,
    wasteReservePct: recipe.wasteReservePct,
    extraPackCost: recipe.extraPackCost
  });

  // 3. Resep belum memiliki biaya yang cukup untuk menghitung HPP
  if (calc.totalBiayaSebelumCadangan <= 0 && calc.totalHppBatch <= 0) {
    return {
      status: 'INSUFFICIENT_COST',
      label: 'Lengkapi data biaya',
      badgeClass: 'badge-warning',
      message: 'Total biaya bahan baku dan biaya operasional masih Rp 0.',
      canCalculate: false,
      calc
    };
  }

  // 4. Resep memiliki data lengkap tetapi fungsi kalkulasi gagal
  if (!calc.isValid || calc.hppPerUnit <= 0) {
    const errorDetails = calc.errors && calc.errors.length > 0
      ? calc.errors.join('; ')
      : 'Kalkulasi HPP gagal dihitung.';
    return {
      status: 'CALCULATION_ERROR',
      label: 'Periksa satuan/rumus',
      badgeClass: 'badge-danger',
      message: errorDetails,
      canCalculate: false,
      calc
    };
  }

  // 5. Valid & Lengkap
  return {
    status: 'VALID',
    label: 'Lengkap & Valid',
    badgeClass: 'badge-success',
    message: 'Perhitungan HPP lengkap dan akurat.',
    canCalculate: true,
    calc
  };
}

