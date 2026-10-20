/**
 * Kalkulator HPP Frozen Food by Nugita Digital
 * Storage Manager, Backup, Export & Import
 * 
 * Mengelola penyimpanan lokal (localStorage) dengan fallback aman,
 * migrasi skema, ekspor/impor JSON tervalidasi, dan ekspor CSV.
 */

import { DEFAULT_PRESETS } from './presets.js';
import { calculateIngredientCost } from './calculations.js';

const STORAGE_KEYS = {
  RECIPES: 'nugita_hpp_recipes_v1',
  SETTINGS: 'nugita_hpp_settings_v1',
  ACTIVE_DRAFT: 'nugita_hpp_active_draft_v1'
};

// In-memory fallback untuk lingkungan Node.js (unit testing)
const memoryStorage = new Map();

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key) => (memoryStorage.has(key) ? memoryStorage.get(key) : null),
    setItem: (key, val) => memoryStorage.set(key, String(val)),
    removeItem: (key) => memoryStorage.delete(key),
    clear: () => memoryStorage.clear()
  };
}

export const DEFAULT_SETTINGS = {
  defaultTargetMarginPct: 35,
  defaultPlatformFeePct: 0,
  defaultPaymentFeePct: 0.7,
  defaultRoundingOption: '500', // 'none', '100', '500', '1000'
  autoSaveDraft: true,
  theme: 'nugita-navy-orange'
};

/**
 * Inisialisasi storage dengan preset resep jika belum ada data sama sekali.
 */
export function initializeStorage() {
  const storage = getStorage();
  const existing = storage.getItem(STORAGE_KEYS.RECIPES);
  if (!existing) {
    storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(DEFAULT_PRESETS));
  }
  const existingSettings = storage.getItem(STORAGE_KEYS.SETTINGS);
  if (!existingSettings) {
    storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

/**
 * Mengambil semua resep tersimpan.
 * @returns {Array<Object>}
 */
export function getAllRecipes() {
  try {
    const storage = getStorage();
    const data = storage.getItem(STORAGE_KEYS.RECIPES);
    if (!data) {
      initializeStorage();
      const fresh = storage.getItem(STORAGE_KEYS.RECIPES);
      return fresh ? JSON.parse(fresh) : [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // Verifikasi integritas preset contoh (tanpa mengubah resep kustom pengguna)
    let needsSync = false;
    parsed.forEach(r => {
      if (r && r.id === 'preset-dimsum-siomay-ayam' && r.isExample && (!r.extraPackCost || r.extraPackCost === 0)) {
        r.extraPackCost = 600;
        needsSync = true;
      }
      if (r && r.isExample && Array.isArray(r.ingredients)) {
        r.ingredients.forEach(ing => {
          if (ing && ing.name && (ing.name.toLowerCase().includes('telur')) && !ing.conversionFactor) {
            ing.conversionFactor = 16;
            needsSync = true;
          }
        });
      }
    });

    if (needsSync) {
      storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.error('Gagal membaca data resep:', err);
    return [];
  }
}

/**
 * Mengambil satu resep berdasarkan ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getRecipeById(id) {
  const recipes = getAllRecipes();
  return recipes.find(r => r.id === id) || null;
}

/**
 * Menyimpan resep baru atau memperbarui resep yang sudah ada.
 * @param {Object} recipeData
 * @returns {{ success: boolean, recipe: Object, isNew: boolean }}
 */
export function saveRecipe(recipeData) {
  const storage = getStorage();
  const recipes = getAllRecipes();
  const now = new Date().toISOString();

  let targetId = recipeData.id;
  let isNew = false;

  if (!targetId) {
    targetId = 'recipe-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    isNew = true;
  }

  const existingIndex = recipes.findIndex(r => r.id === targetId);

  // Deep clone untuk keamanan agar tidak ada referensi luar yang termutasi
  const recipeToSave = {
    ...JSON.parse(JSON.stringify(recipeData)),
    id: targetId,
    name: (recipeData.name || 'Resep Baru Tanpa Nama').trim(),
    category: recipeData.category || 'Lainnya',
    isExample: recipeData.isExample === true,
    yieldTotal: Math.max(1, Number(recipeData.yieldTotal) || 1),
    yieldSalable: Math.max(1, Number(recipeData.yieldSalable) || 1),
    unitsPerPack: Math.max(1, Number(recipeData.unitsPerPack) || 1),
    wasteReservePct: Math.max(0, Number(recipeData.wasteReservePct) || 0),
    extraPackCost: Math.max(0, Number(recipeData.extraPackCost) || 0),
    notes: recipeData.notes || '',
    ingredients: Array.isArray(recipeData.ingredients)
      ? JSON.parse(JSON.stringify(recipeData.ingredients))
      : [],
    overheads: {
      biayaMinyak: Math.max(0, Number(recipeData.overheads?.biayaMinyak) || 0),
      biayaKemasanPerUnit: Math.max(0, Number(recipeData.overheads?.biayaKemasanPerUnit) || 0),
      jumlahKemasan: Math.max(0, Number(recipeData.overheads?.jumlahKemasan) || 0),
      biayaKemasanTotal: Math.max(0, Number(recipeData.overheads?.biayaKemasanTotal) || 0),
      biayaLabel: Math.max(0, Number(recipeData.overheads?.biayaLabel) || 0),
      biayaTenagaKerja: Math.max(0, Number(recipeData.overheads?.biayaTenagaKerja) || 0),
      biayaEnergi: Math.max(0, Number(recipeData.overheads?.biayaEnergi) || 0),
      biayaTransportasi: Math.max(0, Number(recipeData.overheads?.biayaTransportasi) || 0),
      biayaLainnya: Math.max(0, Number(recipeData.overheads?.biayaLainnya) || 0)
    },
    pricing: {
      targetMarginPct: Math.max(0, Number(recipeData.pricing?.targetMarginPct) || 30),
      platformFeePct: Math.max(0, Number(recipeData.pricing?.platformFeePct) || 0),
      paymentFeePct: Math.max(0, Number(recipeData.pricing?.paymentFeePct) || 0),
      fixedSellingFee: Math.max(0, Number(recipeData.pricing?.fixedSellingFee) || 0),
      manualSellingPrice: Math.max(0, Number(recipeData.pricing?.manualSellingPrice) || 0),
      roundingOption: recipeData.pricing?.roundingOption || '500'
    },
    updatedAt: now
  };

  if (existingIndex >= 0) {
    recipeToSave.createdAt = recipes[existingIndex].createdAt || now;
    recipes[existingIndex] = recipeToSave;
    isNew = false;
  } else {
    recipeToSave.createdAt = now;
    recipes.unshift(recipeToSave);
    isNew = true;
  }

  storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  return { success: true, recipe: recipeToSave, isNew };
}

/**
 * Menggandakan resep yang sudah ada dengan ID baru dan nama "(Salinan)".
 * @param {string} sourceId
 * @returns {{ success: boolean, recipe?: Object, error?: string }}
 */
export function duplicateRecipe(sourceId) {
  const original = getRecipeById(sourceId);
  if (!original) {
    return { success: false, error: 'Resep sumber tidak ditemukan.' };
  }

  const copyData = JSON.parse(JSON.stringify(original));
  delete copyData.id;
  copyData.name = `${copyData.name} (Salinan)`;
  copyData.isExample = false;
  const result = saveRecipe(copyData);
  return { success: true, recipe: result.recipe };
}

/**
 * Menghapus resep berdasarkan ID.
 * @param {string} id
 * @returns {{ success: boolean, deletedId: string }}
 */
export function deleteRecipe(id) {
  const storage = getStorage();
  const recipes = getAllRecipes();
  const filtered = recipes.filter(r => r.id !== id);
  storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(filtered));
  return { success: true, deletedId: id };
}

/**
 * Menyimpan draft aktif saat pengguna sedang mengedit agar tidak hilang jika browser tertutup.
 * @param {Object} draftData
 */
export function saveActiveDraft(draftData) {
  try {
    const storage = getStorage();
    storage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, JSON.stringify(draftData));
  } catch (err) {
    console.warn('Gagal menyimpan draft:', err);
  }
}

/**
 * Mengambil draft aktif.
 * @returns {Object|null}
 */
export function getActiveDraft() {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEYS.ACTIVE_DRAFT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Bersihkan draft aktif.
 */
export function clearActiveDraft() {
  try {
    const storage = getStorage();
    storage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT);
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Mengambil pengaturan aplikasi.
 * @returns {Object}
 */
export function getSettings() {
  try {
    const storage = getStorage();
    const data = storage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Menyimpan pengaturan aplikasi.
 * @param {Object} newSettings
 */
export function saveSettings(newSettings) {
  const storage = getStorage();
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

/**
 * Ekspor seluruh resep ke format JSON String cadangan Nugita Digital.
 * @returns {string}
 */
export function exportRecipesToJSON() {
  const recipes = getAllRecipes();
  const settings = getSettings();
  const backupPayload = {
    version: '1.0.0',
    appName: 'Kalkulator HPP Frozen Food by Nugita Digital',
    exportedAt: new Date().toISOString(),
    recipesCount: recipes.length,
    recipes,
    settings
  };
  return JSON.stringify(backupPayload, null, 2);
}

/**
 * Validasi dan Impor data cadangan JSON.
 * Mencegah penggandaan yang tidak disengaja dan memvalidasi integritas data.
 * 
 * @param {string} jsonString - String JSON dari file yang diunggah
 * @param {'merge'|'replace'} mode - Mode import: 'merge' (gabung tanpa duplikat ID) atau 'replace' (timpa semua)
 * @returns {{ success: boolean, importedCount: number, errors: Array<string> }}
 */
export function importRecipesFromJSON(jsonString, mode = 'merge') {
  const errors = [];
  let parsed;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, importedCount: 0, errors: ['Format file bukan JSON yang valid.'] };
  }

  let incomingRecipes = [];
  if (Array.isArray(parsed)) {
    incomingRecipes = parsed;
  } else if (parsed && Array.isArray(parsed.recipes)) {
    incomingRecipes = parsed.recipes;
  } else {
    return { success: false, importedCount: 0, errors: ['File JSON tidak memuat daftar resep yang valid.'] };
  }

  if (incomingRecipes.length === 0) {
    return { success: false, importedCount: 0, errors: ['Tidak ada data resep yang ditemukan dalam file.'] };
  }

  const storage = getStorage();
  const existingRecipes = mode === 'replace' ? [] : getAllRecipes();
  const existingIdMap = new Map(existingRecipes.map(r => [r.id, r]));

  let importedCount = 0;

  for (let i = 0; i < incomingRecipes.length; i++) {
    const raw = incomingRecipes[i];
    if (!raw || typeof raw !== 'object') {
      errors.push(`Baris ${i + 1}: Data resep tidak valid.`);
      continue;
    }

    if (!raw.name || typeof raw.name !== 'string' || raw.name.trim() === '') {
      errors.push(`Baris ${i + 1}: Nama resep kosong.`);
      continue;
    }

    // Hindari duplikasi ID jika ID sudah ada:
    let finalId = raw.id;
    if (!finalId) {
      finalId = 'recipe-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    } else if (mode === 'merge' && existingIdMap.has(finalId)) {
      // Jika ID sudah ada saat merge: perbarui resep yang ada tanpa membuat baris ganda
      // Atau jika diinginkan resep baru: berikan ID baru. Di sini kita perbarui (upsert by ID).
    }

    const sanitizedRecipe = {
      id: finalId,
      name: raw.name.trim(),
      category: raw.category || 'Lainnya',
      yieldTotal: Math.max(1, Number(raw.yieldTotal) || 1),
      yieldSalable: Math.max(1, Number(raw.yieldSalable) || 1),
      unitsPerPack: Math.max(1, Number(raw.unitsPerPack) || 1),
      wasteReservePct: Math.max(0, Number(raw.wasteReservePct) || 0),
      extraPackCost: Math.max(0, Number(raw.extraPackCost) || 0),
      notes: raw.notes || '',
      ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : [],
      overheads: raw.overheads || {},
      pricing: raw.pricing || {},
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    existingIdMap.set(finalId, sanitizedRecipe);
    importedCount++;
  }

  const finalRecipeList = Array.from(existingIdMap.values());
  storage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(finalRecipeList));

  // Impor pengaturan jika ada
  if (parsed.settings && typeof parsed.settings === 'object') {
    saveSettings(parsed.settings);
  }

  return {
    success: importedCount > 0,
    importedCount,
    errors
  };
}

/**
 * Ekspor satu resep beserta detail bahan ke format CSV spreadsheet.
 * @param {Object} recipe
 * @param {Object} calculationResult
 * @returns {string} Konten CSV
 */
export function exportRecipeToCSV(recipe, calculationResult) {
  const rows = [];
  rows.push(['KALKULATOR HPP FROZEN FOOD BY NUGITA DIGITAL']);
  rows.push(['Tanggal Cetak', new Date().toLocaleString('id-ID')]);
  rows.push([]);
  rows.push(['INFORMASI PRODUK']);
  rows.push(['Nama Produk', `"${recipe.name}"`]);
  rows.push(['Kategori', `"${recipe.category}"`]);
  rows.push(['Produksi Awal (Total Batch)', recipe.yieldTotal]);
  rows.push(['Produk Ditolak (Reject QC)', calculationResult?.yieldReject ?? Math.max(0, (recipe.yieldTotal || 0) - (recipe.yieldSalable || 0))]);
  rows.push(['Produk Layak Jual (Bersih)', recipe.yieldSalable]);
  rows.push(['Isi per Kemasan (Pack)', recipe.unitsPerPack]);
  rows.push(['Jumlah Pack Penuh', calculationResult?.fullPacks ?? Math.floor((recipe.yieldSalable || 0) / (recipe.unitsPerPack || 1))]);
  rows.push(['Sisa Unit (Belum Penuh)', calculationResult?.remainderUnits ?? ((recipe.yieldSalable || 0) % (recipe.unitsPerPack || 1))]);
  rows.push(['Catatan Resep', `"${(recipe.notes || '').replace(/"/g, '""')}"`]);
  rows.push([]);

  rows.push(['RINCIAN BAHAN BAKU']);
  rows.push(['No', 'Nama Bahan', 'Harga Beli (Rp)', 'Jumlah Beli', 'Satuan Beli', 'Jumlah Pakai', 'Satuan Pakai', 'Biaya Pakai (Rp)', 'Asal Harga Satuan']);

  const ingredients = recipe.ingredients || [];
  ingredients.forEach((ing, idx) => {
    const price = Number(ing.purchasePrice) || 0;
    const pQty = Number(ing.purchaseQty) || 1;
    const uQty = Number(ing.usageQty) || 0;
    const costRes = calculateIngredientCost(ing);
    const costVal = costRes.success ? costRes.cost : 0;
    const sourceInfo = costRes.unitPriceSource ? `"${costRes.unitPriceSource}"` : '""';
    rows.push([
      idx + 1,
      `"${ing.name}"`,
      price,
      pQty,
      ing.purchaseUnit,
      uQty,
      ing.usageUnit,
      costVal,
      sourceInfo
    ]);
  });

  rows.push([]);
  rows.push(['RINGKASAN BIAYA & HPP']);
  if (calculationResult) {
    rows.push(['Total Biaya Bahan Baku', calculationResult.totalBahan]);
    rows.push(['Biaya Minyak Operasional', calculationResult.biayaMinyak]);
    rows.push(['Biaya Kemasan', calculationResult.totalBiayaKemasan]);
    rows.push(['Biaya Label & Stiker', calculationResult.biayaLabel]);
    rows.push(['Biaya Tenaga Kerja', calculationResult.biayaTenagaKerja]);
    rows.push(['Biaya Energi (Gas, Listrik, Air)', calculationResult.biayaEnergi]);
    rows.push(['Biaya Transportasi', calculationResult.biayaTransportasi]);
    rows.push(['Biaya Lain-lain', calculationResult.biayaLainnya]);
    rows.push(['Total Biaya Sebelum Cadangan', calculationResult.totalBiayaSebelumCadangan]);
    rows.push([`Cadangan Susut (${calculationResult.reservePct}%)`, calculationResult.cadanganSusut]);
    rows.push(['TOTAL HPP BATCH', calculationResult.totalHppBatch]);
    rows.push(['HPP PER UNIT (Pcs)', calculationResult.hppPerUnit]);
    rows.push(['HPP PER KEMASAN (Pack)', calculationResult.hppPerKemasan]);
  }

  return rows.map(r => r.join(';')).join('\n');
}
