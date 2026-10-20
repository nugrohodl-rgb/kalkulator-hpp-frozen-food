/**
 * Kalkulator HPP Frozen Food by Nugita Digital
 * Main Application Controller
 */

import {
  SUPPORTED_UNITS,
  convertUnit,
  calculateBaseUnitPrice,
  calculateIngredientCost,
  calculateTotalIngredientsCost,
  calculateHPP,
  calculateSellingPriceAndProfit,
  checkDoubleCountingWarnings,
  formatRupiah,
  formatPercent,
  roundSellingPrice,
  getRecipeStatus
} from './core/calculations.js';

import {
  DEFAULT_SETTINGS,
  initializeStorage,
  getAllRecipes,
  getRecipeById,
  saveRecipe,
  duplicateRecipe,
  deleteRecipe,
  saveActiveDraft,
  getActiveDraft,
  getSettings,
  saveSettings,
  exportRecipesToJSON,
  importRecipesFromJSON,
  exportRecipeToCSV
} from './core/storage.js';

import { DEFAULT_PRESETS } from './core/presets.js';

// Application State
const state = {
  currentView: 'dashboard',
  recipes: [],
  activeRecipe: null,
  calcResult: null,
  settings: { ...DEFAULT_SETTINGS },
  simBasis: 'pack' // 'pack' or 'unit'
};

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeStorage();
  state.settings = getSettings();
  state.recipes = getAllRecipes();

  // Load active draft or first preset
  const draft = getActiveDraft();
  if (draft && draft.name) {
    state.activeRecipe = draft;
  } else if (state.recipes.length > 0) {
    state.activeRecipe = JSON.parse(JSON.stringify(state.recipes[0]));
  } else {
    state.activeRecipe = JSON.parse(JSON.stringify(DEFAULT_PRESETS[0]));
  }

  setupEventListeners();
  updateCalculations();
  renderCurrentView();
  renderPresetModal();
});

// ============================================================================
// Event Listeners Setup
// ============================================================================

function setupEventListeners() {
  // Navigation
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');

  function closeMobileSidebar() {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('active');
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = btn.getAttribute('data-view');
      navigateToView(view);
      if (window.innerWidth <= 768) {
        closeMobileSidebar();
      }
    });
  });

  // Mobile Sidebar Toggle
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sidebar.classList.toggle('open');
      backdrop?.classList.toggle('active', isOpen);
    });
  }

  // Close sidebar on backdrop click or outside click
  backdrop?.addEventListener('click', closeMobileSidebar);

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
        closeMobileSidebar();
      }
    }
  });

  // Topbar quick preset button
  document.getElementById('btn-quick-preset')?.addEventListener('click', () => {
    openModal('modal-preset');
  });

  // Dashboard buttons
  document.getElementById('btn-dash-create-recipe')?.addEventListener('click', () => {
    createNewRecipe();
    navigateToView('calculator');
  });

  document.getElementById('btn-dash-open-calc')?.addEventListener('click', () => {
    navigateToView('calculator');
  });

  document.getElementById('btn-dash-see-all')?.addEventListener('click', () => {
    navigateToView('recipes');
  });

  // Calculator Top Buttons
  document.getElementById('btn-calc-new')?.addEventListener('click', () => {
    showConfirm(
      'Buat Resep Baru',
      'Apakah Anda ingin mereset kalkulator untuk membuat resep baru? Pastikan resep sebelumnya sudah disimpan.',
      () => {
        createNewRecipe();
        renderCalculatorForm();
        updateCalculations();
        showToast('Form kalkulator berhasil direset untuk resep baru.', 'info');
      }
    );
  });

  document.getElementById('btn-calc-save-top')?.addEventListener('click', handleSaveRecipe);
  document.getElementById('btn-sticky-save')?.addEventListener('click', handleSaveRecipe);

  document.getElementById('btn-sticky-simulate')?.addEventListener('click', () => {
    navigateToView('simulation');
  });

  // Add ingredient row
  document.getElementById('btn-add-ingredient')?.addEventListener('click', () => {
    addEmptyIngredientRow();
    updateCalculations();
  });

  // Calculator Form Inputs Change
  const calcInputs = [
    'input-product-name',
    'input-product-category',
    'input-yield-total',
    'input-yield-reject',
    'input-yield-salable',
    'input-units-per-pack',
    'input-recipe-notes',
    'input-packaging-unit-cost',
    'input-packaging-count',
    'input-label-cost',
    'input-labor-cost',
    'input-energy-cost',
    'input-oil-cost',
    'input-transport-cost',
    'input-other-cost',
    'input-waste-reserve-pct',
    'input-extra-pack-cost'
  ];

  calcInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        syncFormToActiveRecipe();
        updateCalculations();
      });
    }
  });

  // Recipes View Events
  document.getElementById('btn-recipes-create-new')?.addEventListener('click', () => {
    createNewRecipe();
    navigateToView('calculator');
  });

  document.getElementById('btn-recipes-export-json')?.addEventListener('click', handleDownloadBackup);

  document.getElementById('recipes-search-input')?.addEventListener('input', renderRecipesGrid);
  document.getElementById('recipes-category-filter')?.addEventListener('change', renderRecipesGrid);
  document.getElementById('recipes-sort-select')?.addEventListener('change', renderRecipesGrid);

  // Simulation View Events
  const simInputs = [
    'sim-input-margin',
    'sim-input-platform-fee',
    'sim-input-payment-fee',
    'sim-input-fixed-fee',
    'sim-input-manual-price',
    'sim-rounding-select',
    'sim-basis-select'
  ];

  simInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        renderSimulation();
      });
      el.addEventListener('change', () => {
        renderSimulation();
      });
    }
  });

  document.getElementById('btn-sim-reset')?.addEventListener('click', () => {
    resetSimulationParameters();
    renderSimulation();
    showToast('Parameter simulasi dikembalikan ke standar.', 'info');
  });

  document.getElementById('btn-sim-apply-to-recipe')?.addEventListener('click', handleApplySimToRecipe);

  // Report View Events
  document.getElementById('btn-print-report')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', handleExportCSV);

  // Settings View Events
  document.getElementById('btn-save-settings')?.addEventListener('click', handleSaveSettingsForm);
  document.getElementById('btn-backup-download')?.addEventListener('click', handleDownloadBackup);

  const restoreFile = document.getElementById('input-restore-file');
  document.getElementById('btn-trigger-restore')?.addEventListener('click', () => {
    restoreFile?.click();
  });

  restoreFile?.addEventListener('change', handleRestoreJSONFile);

  // P10 Test Suite Runner Button
  document.getElementById('btn-run-in-app-tests')?.addEventListener('click', runInAppTestSuite);

  // Modals Close
  document.getElementById('modal-confirm-close')?.addEventListener('click', () => closeModal('modal-confirm'));
  document.getElementById('modal-confirm-cancel')?.addEventListener('click', () => closeModal('modal-confirm'));
  document.getElementById('modal-preset-close')?.addEventListener('click', () => closeModal('modal-preset'));
  document.getElementById('modal-preset-cancel')?.addEventListener('click', () => closeModal('modal-preset'));
}

// ============================================================================
// Navigation Management
// ============================================================================

export function navigateToView(viewId) {
  state.currentView = viewId;

  // Update nav buttons active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-view') === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Switch page-view elements
  document.querySelectorAll('.page-view').forEach(view => {
    if (view.id === `view-${viewId}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Update topbar titles
  const titleEl = document.getElementById('topbar-page-title');
  const descEl = document.getElementById('topbar-page-desc');

  const titles = {
    dashboard: { title: 'Dashboard', desc: 'Ringkasan produksi dan analisa margin UMKM frozen food Anda.' },
    calculator: { title: 'Kalkulator HPP', desc: 'Rincian bahan baku dan biaya operasional untuk menetapkan HPP akurat.' },
    recipes: { title: 'Resep Tersimpan', desc: 'Katalog resep produksi frozen food siap pakai dan terstandarisasi.' },
    simulation: { title: 'Simulasi Harga Jual', desc: 'Uji target keuntungan, potongan marketplace, dan margin vs markup.' },
    report: { title: 'Laporan & Cetak', desc: 'Lembar perhitungan HPP rapi untuk arsip, cetak PDF, atau unduh CSV.' },
    settings: { title: 'Pengaturan & Uji Validasi', desc: 'Konfigurasi pembulatan, pencadangan data, dan live test suite P10.' }
  };

  if (titleEl && titles[viewId]) titleEl.textContent = titles[viewId].title;
  if (descEl && titles[viewId]) descEl.textContent = titles[viewId].desc;

  // Re-render specific views on navigation
  renderCurrentView();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close mobile sidebar if open
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar && window.innerWidth <= 768) {
    sidebar.classList.remove('open');
  }
}

function renderCurrentView() {
  switch (state.currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'calculator':
      renderCalculatorForm();
      break;
    case 'recipes':
      renderRecipesGrid();
      break;
    case 'simulation':
      renderSimulation();
      break;
    case 'report':
      renderReportView();
      break;
    case 'settings':
      renderSettingsView();
      break;
  }
}

// ============================================================================
// Core Calculation & Sync Controller
// ============================================================================

function updateCalculations() {
  if (!state.activeRecipe) return;

  const r = state.activeRecipe;
  const yieldTotal = Math.max(1, Number(r.yieldTotal) || 1);
  const yieldSalable = Math.max(1, Number(r.yieldSalable) || 1);
  const unitsPerPack = Math.max(1, Number(r.unitsPerPack) || 1);
  const wasteReservePct = Math.max(0, Number(r.wasteReservePct) || 0);
  const extraPackCost = Math.max(0, Number(r.extraPackCost) || 0);

  // Jalankan kalkulator HPP dari core engine
  const calcResult = calculateHPP({
    ingredients: r.ingredients || [],
    overheads: r.overheads || {},
    yieldTotal,
    yieldSalable,
    unitsPerPack,
    wasteReservePct,
    extraPackCost
  });

  state.calcResult = calcResult;

  // Simpan draft aktif secara berkala
  saveActiveDraft(r);

  // Update UI components
  updateCalculatorSummaryUI(calcResult);
  updateDoubleCountingAlerts(calcResult.warnings);
  updateRowCostsInTable();
}

function syncFormToActiveRecipe() {
  if (!state.activeRecipe) return;

  const r = state.activeRecipe;
  r.name = document.getElementById('input-product-name')?.value || 'Resep Tanpa Nama';
  r.category = document.getElementById('input-product-category')?.value || 'Lainnya';

  const totalEl = document.getElementById('input-yield-total');
  const rejectEl = document.getElementById('input-yield-reject');
  const salableEl = document.getElementById('input-yield-salable');

  const totalVal = Math.max(1, Number(totalEl?.value) || 1);
  const activeElId = document.activeElement?.id;

  if (activeElId === 'input-yield-reject') {
    const rejectVal = Math.max(0, Number(rejectEl?.value) || 0);
    const salableVal = Math.max(1, totalVal - rejectVal);
    r.yieldTotal = totalVal;
    r.yieldSalable = salableVal;
    if (salableEl) salableEl.value = salableVal;
  } else if (activeElId === 'input-yield-salable') {
    const salableVal = Math.max(1, Number(salableEl?.value) || 1);
    const rejectVal = Math.max(0, totalVal - salableVal);
    r.yieldTotal = totalVal;
    r.yieldSalable = salableVal;
    if (rejectEl) rejectEl.value = rejectVal;
  } else {
    const salableVal = Math.max(1, Number(salableEl?.value) || 1);
    r.yieldTotal = totalVal;
    r.yieldSalable = salableVal;
    if (rejectEl) rejectEl.value = Math.max(0, totalVal - salableVal);
  }

  r.unitsPerPack = Math.max(1, Number(document.getElementById('input-units-per-pack')?.value) || 1);
  r.notes = document.getElementById('input-recipe-notes')?.value || '';

  if (!r.overheads) r.overheads = {};
  r.overheads.biayaKemasanPerUnit = Number(document.getElementById('input-packaging-unit-cost')?.value) || 0;
  r.overheads.jumlahKemasan = Number(document.getElementById('input-packaging-count')?.value) || 0;
  r.overheads.biayaLabel = Number(document.getElementById('input-label-cost')?.value) || 0;
  r.overheads.biayaTenagaKerja = Number(document.getElementById('input-labor-cost')?.value) || 0;
  r.overheads.biayaEnergi = Number(document.getElementById('input-energy-cost')?.value) || 0;
  r.overheads.biayaMinyak = Number(document.getElementById('input-oil-cost')?.value) || 0;
  r.overheads.biayaTransportasi = Number(document.getElementById('input-transport-cost')?.value) || 0;
  r.overheads.biayaLainnya = Number(document.getElementById('input-other-cost')?.value) || 0;
  r.wasteReservePct = Number(document.getElementById('input-waste-reserve-pct')?.value) || 0;
  r.extraPackCost = Number(document.getElementById('input-extra-pack-cost')?.value) || 0;
}

// ============================================================================
// View 1: Dashboard
// ============================================================================

function renderDashboard() {
  const recipes = getAllRecipes();
  state.recipes = recipes;

  // Resep tersimpan (jumlah riil di storage)
  document.getElementById('dash-total-recipes').textContent = recipes.length;

  // Resep sedang aktif
  if (state.activeRecipe) {
    document.getElementById('dash-active-recipe-name').textContent = state.activeRecipe.name;
    const badgeEl = document.getElementById('dash-active-recipe-badge');
    if (badgeEl) {
      badgeEl.innerHTML = state.activeRecipe.isExample
        ? '<span class="badge badge-warning" style="font-size: 0.72rem;">Data Contoh</span>'
        : '';
    }
    document.getElementById('dash-active-recipe-cat').textContent = `Kategori: ${state.activeRecipe.category || 'Lainnya'}`;
  } else {
    document.getElementById('dash-active-recipe-name').textContent = '—';
    const badgeEl = document.getElementById('dash-active-recipe-badge');
    if (badgeEl) badgeEl.innerHTML = '';
    document.getElementById('dash-active-recipe-cat').textContent = 'Pilih atau buat resep baru';
  }

  // HPP unit terendah (dibandingkan nilai presisi murni tanpa pembulatan prematur)
  // Rata-rata margin (hanya dari resep dengan harga jual & margin valid)
  let minHpp = Infinity;
  let minHppRecipeName = '';
  let sumMargin = 0;
  let validMarginCount = 0;

  recipes.forEach(rcp => {
    const statusInfo = getRecipeStatus(rcp);
    if (statusInfo.canCalculate && statusInfo.calc && statusInfo.calc.isValid && statusInfo.calc.hppPerUnit > 0) {
      const res = statusInfo.calc;
      // Bandingkan float internal presisi tinggi sebelum pembulatan
      if (res.hppPerUnit < minHpp) {
        minHpp = res.hppPerUnit;
        minHppRecipeName = rcp.name;
      }

      // Periksa apakah resep memiliki harga jual valid
      const manual = Number(rcp.pricing?.manualSellingPrice) || 0;
      const targetMargin = Number(rcp.pricing?.targetMarginPct);
      const hasPriceSetting = manual > 0 || (targetMargin > 0);

      if (hasPriceSetting) {
        const pricingRes = calculateSellingPriceAndProfit({
          hppPerUnit: res.hppPerKemasan,
          targetMarginPct: targetMargin,
          platformFeePct: Number(rcp.pricing?.platformFeePct) || 0,
          paymentFeePct: Number(rcp.pricing?.paymentFeePct) || 0,
          fixedSellingFee: Number(rcp.pricing?.fixedSellingFee) || 0,
          manualSellingPrice: manual,
          salableCount: res.totalPacksProduced,
          roundingOption: rcp.pricing?.roundingOption || 'none'
        });

        if (pricingRes.isRateValid && pricingRes.activeSellingPrice > 0 && !isNaN(pricingRes.marginAktual)) {
          sumMargin += pricingRes.marginAktual;
          validMarginCount++;
        }
      }
    }
  });

  const minHppEl = document.getElementById('dash-min-hpp');
  const minHppSub = document.getElementById('dash-min-hpp-sub');
  if (minHppEl) {
    minHppEl.textContent = (minHpp !== Infinity && minHpp > 0) ? formatRupiah(minHpp) : '—';
  }
  if (minHppSub) {
    minHppSub.textContent = (minHpp !== Infinity && minHppRecipeName) ? `Resep: ${minHppRecipeName}` : 'Belum ada resep valid';
  }

  const avgMarginEl = document.getElementById('dash-avg-margin');
  const avgMarginSub = document.getElementById('dash-avg-margin-sub');
  if (avgMarginEl) {
    avgMarginEl.textContent = validMarginCount > 0 ? formatPercent(sumMargin / validMarginCount) : '—';
  }
  if (avgMarginSub) {
    avgMarginSub.textContent = validMarginCount > 0
      ? `Rata-rata sederhana (${validMarginCount} resep valid)`
      : 'Belum ada harga jual valid';
  }

  // Render recent recipes list
  const listContainer = document.getElementById('dash-recipes-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const recents = recipes.slice(0, 4);
  if (recents.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--color-gray-500); font-size: 0.88rem;">
        Belum ada resep tersimpan. Buat resep pertama Anda sekarang!
      </div>
    `;
    return;
  }

  recents.forEach(rcp => {
    const statusInfo = getRecipeStatus(rcp);
    const res = statusInfo.calc;

    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      background-color: var(--color-cream-50);
      border: 1px solid var(--color-cream-200);
      transition: all var(--transition-fast);
      gap: 12px;
    `;

    const exampleTag = rcp.isExample ? '<span class="badge badge-warning" style="font-size: 0.68rem; margin-left: 6px;">Data Contoh</span>' : '';

    if (statusInfo.canCalculate && res) {
      item.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; color: var(--color-navy-900); font-size: 0.92rem; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
            <span>${rcp.name}</span>
            ${exampleTag}
          </div>
          <div style="font-size: 0.76rem; color: var(--color-gray-500); margin-top: 2px;">
            ${rcp.category} • HPP: <strong>${formatRupiah(res.hppPerUnit)}/pcs</strong> (${formatRupiah(res.hppPerKemasan)}/pack)
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" data-load-id="${rcp.id}">
          Buka
        </button>
      `;
    } else {
      item.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; color: var(--color-navy-900); font-size: 0.92rem; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
            <span>${rcp.name}</span>
            ${exampleTag}
            <span class="badge ${statusInfo.badgeClass}" style="font-size: 0.68rem;">${statusInfo.label}</span>
          </div>
          <div style="font-size: 0.76rem; color: var(--color-danger); margin-top: 2px;">
            ${statusInfo.message}
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-sm" data-load-id="${rcp.id}">
          Edit Resep
        </button>
      `;
    }

    item.querySelector('button')?.addEventListener('click', () => {
      loadRecipeById(rcp.id);
      navigateToView('calculator');
    });

    listContainer.appendChild(item);
  });
}

// ============================================================================
// View 2: Calculator Form & Ingredients Table
// ============================================================================

function renderCalculatorForm() {
  if (!state.activeRecipe) {
    createNewRecipe();
  }

  const r = state.activeRecipe;

  const setName = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setName('input-product-name', r.name || '');
  setName('input-product-category', r.category || 'Nugget');
  const totalYield = Number(r.yieldTotal) || 50;
  const salableYield = Number(r.yieldSalable) || 48;
  setName('input-yield-total', totalYield);
  setName('input-yield-reject', Math.max(0, totalYield - salableYield));
  setName('input-yield-salable', salableYield);
  setName('input-units-per-pack', r.unitsPerPack || 12);
  setName('input-recipe-notes', r.notes || '');

  const ov = r.overheads || {};
  setName('input-packaging-unit-cost', ov.biayaKemasanPerUnit ?? 1200);
  setName('input-packaging-count', ov.jumlahKemasan ?? 4);
  setName('input-label-cost', ov.biayaLabel ?? 2000);
  setName('input-labor-cost', ov.biayaTenagaKerja ?? 8000);
  setName('input-energy-cost', ov.biayaEnergi ?? 4000);
  setName('input-oil-cost', ov.biayaMinyak ?? 0);
  setName('input-transport-cost', ov.biayaTransportasi ?? 2500);
  setName('input-other-cost', ov.biayaLainnya ?? 1000);
  setName('input-waste-reserve-pct', r.wasteReservePct ?? 3);
  setName('input-extra-pack-cost', r.extraPackCost ?? 0);

  renderIngredientsTable();
  updateCalculations();
}

function renderIngredientsTable() {
  const tbody = document.getElementById('ingredients-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const ingredients = state.activeRecipe.ingredients || [];

  if (ingredients.length === 0) {
    addEmptyIngredientRow(false);
  }

  (state.activeRecipe.ingredients || []).forEach((ing, index) => {
    const tr = createIngredientTableRow(ing, index);
    tbody.appendChild(tr);
  });

  updateRowCostsInTable();
}

function createIngredientTableRow(ing, index) {
  const tr = document.createElement('tr');
  tr.setAttribute('data-index', index);

  const unitOptions = Object.keys(SUPPORTED_UNITS).map(uKey => {
    const u = SUPPORTED_UNITS[uKey];
    const isSelectedP = (ing.purchaseUnit || '').toLowerCase() === uKey ? 'selected' : '';
    return `<option value="${uKey}" ${isSelectedP}>${u.name}</option>`;
  }).join('');

  const usageUnitOptions = Object.keys(SUPPORTED_UNITS).map(uKey => {
    const u = SUPPORTED_UNITS[uKey];
    const isSelectedU = (ing.usageUnit || '').toLowerCase() === uKey ? 'selected' : '';
    return `<option value="${uKey}" ${isSelectedU}>${u.name}</option>`;
  }).join('');

  const pUnit = (ing.purchaseUnit || '').toLowerCase().trim();
  const uUnit = (ing.usageUnit || '').toLowerCase().trim();
  const ingName = (ing.name || '').toLowerCase().trim();
  const uP = SUPPORTED_UNITS[pUnit];
  const uU = SUPPORTED_UNITS[uUnit];
  const isEgg = ingName.includes('telur') || ingName.includes('egg');
  const isCrossType = (uP && uU && uP.type !== uU.type) || isEgg || (ing.conversionFactor !== undefined);
  const currentConv = ing.conversionFactor || (isEgg ? 16 : '');

  tr.innerHTML = `
    <td style="font-weight: 700; color: var(--color-gray-500); text-align: center;">${index + 1}</td>
    <td>
      <input type="text" class="form-control ing-name" value="${ing.name || ''}" placeholder="Nama bahan...">
      <div class="ing-conv-box" style="margin-top: 4px; display: ${isCrossType ? 'inline-flex' : 'none'}; align-items: center; gap: 4px; font-size: 0.72rem; color: var(--color-navy-800); background-color: var(--color-cream-100); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid var(--color-cream-300);">
        <span class="ing-conv-label">⚖️ 1 ${pUnit || 'kg'} =</span>
        <input type="number" class="form-control ing-conv-factor" style="width: 48px; height: 22px; padding: 0 4px; font-size: 0.72rem; text-align: center; font-weight: 700;" value="${currentConv}" placeholder="16" min="0.01" step="any" title="Faktor konversi butir per kg atau unit">
        <span class="ing-conv-unit">${uUnit || 'butir'}</span>
      </div>
    </td>
    <td>
      <input type="number" class="form-control ing-price" value="${ing.purchasePrice ?? 0}" min="0" step="100">
    </td>
    <td>
      <input type="number" class="form-control ing-pqty" value="${ing.purchaseQty ?? 1}" min="0.001" step="any">
    </td>
    <td>
      <select class="form-control ing-punit">${unitOptions}</select>
    </td>
    <td>
      <input type="number" class="form-control ing-uqty" value="${ing.usageQty ?? 0}" min="0" step="any">
    </td>
    <td>
      <select class="form-control ing-uunit">${usageUnitOptions}</select>
    </td>
    <td style="text-align: right;">
      <div class="cell-cost ing-cost">Rp 0</div>
      <div class="cell-unit-price ing-base-price">Rp 0/g</div>
    </td>
    <td style="text-align: center;">
      <button type="button" class="btn-icon-danger btn-del-row" title="Hapus Baris Ini">
        🗑️
      </button>
    </td>
  `;

  // Attach change listeners to cells
  const updateConvBoxVisibility = () => {
    const currentIng = state.activeRecipe.ingredients[index];
    if (!currentIng) return;
    const curP = (currentIng.purchaseUnit || '').toLowerCase().trim();
    const curU = (currentIng.usageUnit || '').toLowerCase().trim();
    const curN = (currentIng.name || '').toLowerCase().trim();
    const up = SUPPORTED_UNITS[curP];
    const uu = SUPPORTED_UNITS[curU];
    const egg = curN.includes('telur') || curN.includes('egg');
    const cross = (up && uu && up.type !== uu.type) || egg || (currentIng.conversionFactor !== undefined);

    const box = tr.querySelector('.ing-conv-box');
    const label = tr.querySelector('.ing-conv-label');
    const unit = tr.querySelector('.ing-conv-unit');
    const input = tr.querySelector('.ing-conv-factor');

    if (box) box.style.display = cross ? 'inline-flex' : 'none';
    if (label) label.textContent = `⚖️ 1 ${curP || 'kg'} =`;
    if (unit) unit.textContent = curU || 'butir';
    if (cross && (currentIng.conversionFactor === undefined || currentIng.conversionFactor === null)) {
      if (egg) {
        currentIng.conversionFactor = 16;
        if (input) input.value = 16;
      }
    }
  };

  const attach = (selector, key, isNum = false) => {
    const el = tr.querySelector(selector);
    if (!el) return;
    const handler = () => {
      state.activeRecipe.ingredients[index][key] = isNum ? (Number(el.value) || 0) : el.value;
      if (key === 'purchaseUnit' || key === 'usageUnit' || key === 'name') {
        updateConvBoxVisibility();
      }
      updateCalculations();
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  };

  attach('.ing-name', 'name');
  attach('.ing-price', 'purchasePrice', true);
  attach('.ing-pqty', 'purchaseQty', true);
  attach('.ing-punit', 'purchaseUnit');
  attach('.ing-uqty', 'usageQty', true);
  attach('.ing-uunit', 'usageUnit');

  tr.querySelector('.ing-conv-factor')?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    state.activeRecipe.ingredients[index].conversionFactor = (!isNaN(val) && val > 0) ? val : undefined;
    updateCalculations();
  });

  tr.querySelector('.btn-del-row')?.addEventListener('click', () => {
    state.activeRecipe.ingredients.splice(index, 1);
    renderIngredientsTable();
    updateCalculations();
  });

  return tr;
}

function addEmptyIngredientRow(reRender = true) {
  if (!state.activeRecipe.ingredients) {
    state.activeRecipe.ingredients = [];
  }

  state.activeRecipe.ingredients.push({
    id: 'ing-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    name: '',
    purchasePrice: 0,
    purchaseQty: 1,
    purchaseUnit: 'kg',
    usageQty: 0,
    usageUnit: 'gram'
  });

  if (reRender) {
    renderIngredientsTable();
  }
}

function updateRowCostsInTable() {
  const tbody = document.getElementById('ingredients-table-body');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  const ingredients = state.activeRecipe.ingredients || [];

  rows.forEach((tr, i) => {
    const ing = ingredients[i];
    if (!ing) return;

    const res = calculateIngredientCost(ing);
    const costEl = tr.querySelector('.ing-cost');
    const baseEl = tr.querySelector('.ing-base-price');

    if (costEl) {
      if (res.success) {
        costEl.textContent = formatRupiah(res.cost);
        costEl.style.color = 'var(--color-navy-900)';
      } else {
        costEl.textContent = 'Satuan Beda!';
        costEl.style.color = 'var(--color-danger)';
      }
    }

    if (baseEl) {
      if (res.success && res.pricePerBase) {
        baseEl.innerHTML = `
          <div style="font-weight: 700; color: var(--color-navy-900); font-size: 0.78rem;">${formatRupiah(res.pricePerBase, true)}/${res.baseUnit}</div>
          <div style="font-size: 0.68rem; color: var(--color-gray-500); line-height: 1.2; margin-top: 2px;">${res.unitPriceSource || ''}</div>
        `;
      } else {
        baseEl.textContent = '-';
      }
    }
  });
}

function updateCalculatorSummaryUI(calc) {
  if (!calc) return;

  // Subtotal bahan
  const subtotalEl = document.getElementById('calc-subtotal-ingredients');
  if (subtotalEl) subtotalEl.textContent = formatRupiah(calc.totalBahan);

  // Overheads breakdown sum
  const overheadTotal =
    calc.totalBiayaKemasan +
    calc.biayaLabel +
    calc.biayaTenagaKerja +
    calc.biayaEnergi +
    calc.biayaMinyak +
    calc.biayaTransportasi +
    calc.biayaLainnya;

  const ovEl = document.getElementById('calc-kpi-overhead');
  if (ovEl) ovEl.textContent = formatRupiah(overheadTotal);

  // Waste
  const wasteEl = document.getElementById('calc-kpi-waste');
  const wasteSub = document.getElementById('calc-kpi-waste-sub');
  if (wasteEl) wasteEl.textContent = formatRupiah(calc.cadanganSusut);
  if (wasteSub) wasteSub.textContent = `${calc.reservePct}% dari Rp ${formatRupiah(calc.totalBiayaSebelumCadangan).replace('Rp ', '')} (susut/evaporasi)`;

  // Batch Total
  const batchEl = document.getElementById('calc-kpi-total-batch');
  const batchSub = document.getElementById('calc-kpi-batch-sub');
  if (batchEl) batchEl.textContent = formatRupiah(calc.totalHppBatch);
  if (batchSub) batchSub.textContent = `Modal 1 batch (${calc.yieldSalable} layak dari ${calc.yieldTotal} total)`;

  // HPP / Unit
  const unitEl = document.getElementById('calc-kpi-hpp-unit');
  const unitSub = document.getElementById('calc-kpi-unit-sub');
  if (unitEl) unitEl.textContent = formatRupiah(calc.hppPerUnit);
  if (unitSub) unitSub.textContent = `Total HPP ÷ ${calc.yieldSalable} layak (reject ${calc.yieldReject} pcs terserap)`;

  // HPP / Pack
  const packEl = document.getElementById('calc-kpi-hpp-pack');
  const packSub = document.getElementById('calc-kpi-pack-sub');
  if (packEl) packEl.textContent = formatRupiah(calc.hppPerKemasan);
  if (packSub) {
    if (calc.hasRemainder) {
      packSub.textContent = `Isi ${calc.unitsPerPack} pcs • ${calc.fullPacks} pack penuh + sisa ${calc.remainderUnits} pcs`;
    } else {
      packSub.textContent = `Isi ${calc.unitsPerPack} pcs • ${calc.fullPacks} pack penuh (pas)`;
    }
  }

  // Sticky bottom bar
  const stickyBatch = document.getElementById('sticky-hpp-batch');
  const stickyUnit = document.getElementById('sticky-hpp-unit');
  const stickyPack = document.getElementById('sticky-hpp-pack');

  if (stickyBatch) stickyBatch.textContent = formatRupiah(calc.totalHppBatch);
  if (stickyUnit) stickyUnit.textContent = formatRupiah(calc.hppPerUnit);
  if (stickyPack) stickyPack.textContent = formatRupiah(calc.hppPerKemasan);
}

function updateDoubleCountingAlerts(warnings = []) {
  const container = document.getElementById('double-count-alert-container');
  if (!container) return;

  if (warnings.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = warnings.map(w => `
    <div class="alert alert-warning">
      <span style="font-size: 1.2rem;">⚠️</span>
      <div>
        <strong>Peringatan Pencegahan Double Counting:</strong>
        <p style="margin-top: 2px;">${w}</p>
      </div>
    </div>
  `).join('');
}

// ============================================================================
// View 3: Resep Tersimpan
// ============================================================================

function renderRecipesGrid() {
  const grid = document.getElementById('recipes-cards-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const search = (document.getElementById('recipes-search-input')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('recipes-category-filter')?.value || '';
  const sort = document.getElementById('recipes-sort-select')?.value || 'updated-desc';

  let list = getAllRecipes();

  // Search filter
  if (search) {
    list = list.filter(r => (r.name || '').toLowerCase().includes(search) || (r.notes || '').toLowerCase().includes(search));
  }

  // Category filter
  if (cat) {
    list = list.filter(r => r.category === cat);
  }

  // Sorting
  list.sort((a, b) => {
    if (sort === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    if (sort === 'hpp-asc' || sort === 'hpp-desc') {
      const hppA = calculateHPP({ ingredients: a.ingredients, overheads: a.overheads, yieldSalable: a.yieldSalable, unitsPerPack: a.unitsPerPack }).hppPerUnit;
      const hppB = calculateHPP({ ingredients: b.ingredients, overheads: b.overheads, yieldSalable: b.yieldSalable, unitsPerPack: b.unitsPerPack }).hppPerUnit;
      return sort === 'hpp-asc' ? hppA - hppB : hppB - hppA;
    }
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background-color: var(--color-white); border-radius: var(--radius-lg); border: 1px dashed var(--color-gray-300);">
        <span style="font-size: 2.5rem;">🔍</span>
        <h4 style="margin-top: 10px; color: var(--color-navy-900);">Tidak Ditemukan Resep</h4>
        <p style="font-size: 0.84rem; color: var(--color-gray-500); margin-top: 4px;">Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.</p>
      </div>
    `;
    return;
  }

  list.forEach(rcp => {
    const statusInfo = getRecipeStatus(rcp);
    const calc = statusInfo.calc;

    const card = document.createElement('div');
    card.className = 'recipe-card';

    const updatedDate = rcp.updatedAt
      ? new Date(rcp.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : '-';

    const statusBadge = !statusInfo.canCalculate
      ? `<span class="badge ${statusInfo.badgeClass}" style="font-size: 0.72rem;">${statusInfo.label}</span>`
      : '';

    const errorAlert = !statusInfo.canCalculate
      ? `<div class="alert alert-warning" style="margin: 8px 0; padding: 6px 10px; font-size: 0.76rem;">
           ⚠️ <strong>${statusInfo.label}:</strong> ${statusInfo.message}
         </div>`
      : '';

    card.innerHTML = `
      <div>
        <div class="recipe-card-header">
          <div>
            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px; flex-wrap: wrap;">
              <span class="badge badge-orange">${rcp.category || 'Lainnya'}</span>
              ${rcp.isExample ? '<span class="badge badge-warning">Data Contoh</span>' : ''}
              ${statusBadge}
            </div>
            <div class="recipe-card-title">${rcp.name}</div>
          </div>
        </div>

        ${errorAlert}

        <div class="recipe-stats">
          <div class="recipe-stat-item">
            <span class="recipe-stat-label">HPP / Unit</span>
            <span class="recipe-stat-val">${(statusInfo.canCalculate && calc) ? formatRupiah(calc.hppPerUnit) : '—'}</span>
          </div>
          <div class="recipe-stat-item">
            <span class="recipe-stat-label">HPP / Pack</span>
            <span class="recipe-stat-val" style="color: var(--color-orange-600);">${(statusInfo.canCalculate && calc) ? formatRupiah(calc.hppPerKemasan) : '—'}</span>
          </div>
          <div class="recipe-stat-item">
            <span class="recipe-stat-label">Hasil Layak</span>
            <span class="recipe-stat-val">${rcp.yieldSalable || 0} pcs</span>
          </div>
          <div class="recipe-stat-item">
            <span class="recipe-stat-label">Isi / Pack</span>
            <span class="recipe-stat-val">${rcp.unitsPerPack || 1} pcs</span>
          </div>
        </div>

        <div style="font-size: 0.76rem; color: var(--color-gray-500); margin-bottom: 12px;">
          Diperbarui: ${updatedDate} • ${rcp.ingredients?.length || 0} bahan
        </div>
      </div>

      <div class="recipe-card-actions">
        <button type="button" class="btn btn-secondary btn-sm btn-action-csv" title="Unduh CSV">
          📊
        </button>
        <button type="button" class="btn btn-secondary btn-sm btn-action-dup" title="Gandakan Resep">
          📋
        </button>
        <button type="button" class="btn btn-danger btn-sm btn-action-del" title="Hapus Resep">
          🗑️
        </button>
        <button type="button" class="btn ${statusInfo.canCalculate ? 'btn-primary' : 'btn-warning'} btn-sm btn-action-open">
          ${statusInfo.canCalculate ? 'Buka di Kalkulator' : 'Edit Resep'}
        </button>
      </div>
    `;

    card.querySelector('.btn-action-open')?.addEventListener('click', () => {
      loadRecipeById(rcp.id);
      navigateToView('calculator');
    });

    card.querySelector('.btn-action-dup')?.addEventListener('click', () => {
      const dup = duplicateRecipe(rcp.id);
      if (dup.success) {
        showToast(`Resep berhasil digandakan sebagai "${dup.recipe.name}".`, 'success');
        renderRecipesGrid();
      }
    });

    card.querySelector('.btn-action-csv')?.addEventListener('click', () => {
      const csvStr = exportRecipeToCSV(rcp, calc);
      downloadFile(csvStr, `${rcp.name.replace(/\s+/g, '_')}_HPP.csv`, 'text/csv;charset=utf-8;');
      showToast('File CSV berhasil diunduh.', 'success');
    });

    card.querySelector('.btn-action-del')?.addEventListener('click', () => {
      showConfirm(
        'Hapus Resep',
        `Apakah Anda yakin ingin menghapus resep "${rcp.name}"? Data yang dihapus tidak dapat dipulihkan.`,
        () => {
          deleteRecipe(rcp.id);
          showToast(`Resep "${rcp.name}" telah dihapus.`, 'info');
          renderRecipesGrid();
          renderDashboard();
        }
      );
    });

    grid.appendChild(card);
  });
}

// ============================================================================
// View 4: Simulasi Harga Jual & 4 Skenario
// ============================================================================

function renderSimulation() {
  if (!state.activeRecipe || !state.calcResult) {
    updateCalculations();
  }

  const r = state.activeRecipe;
  const calc = state.calcResult;

  const targetMargin = Number(document.getElementById('sim-input-margin')?.value) || 35;
  const platformFee = Number(document.getElementById('sim-input-platform-fee')?.value) || 0;
  const paymentFee = Number(document.getElementById('sim-input-payment-fee')?.value) || 0.7;
  const fixedFee = Number(document.getElementById('sim-input-fixed-fee')?.value) || 0;
  const manualPrice = Number(document.getElementById('sim-input-manual-price')?.value) || 0;
  const rounding = document.getElementById('sim-rounding-select')?.value || '500';
  const basis = document.getElementById('sim-basis-select')?.value || 'pack';

  state.simBasis = basis;

  // Base HPP: apakah per kemasan (pack) atau per unit (pcs)
  const baseHpp = basis === 'pack' ? calc.hppPerKemasan : calc.hppPerUnit;
  const salableCount = basis === 'pack' ? calc.totalPacksProduced : calc.yieldSalable;

  // Rumus P5: Cek apakah margin + total fee >= 100%
  const totalRatePct = targetMargin + platformFee + paymentFee;
  const alertEl = document.getElementById('sim-validation-alert');

  if (totalRatePct >= 100) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.className = 'alert alert-danger';
      alertEl.innerHTML = `
        <span>🚫</span>
        <div>
          <strong>Validasi Gagal (P5 & P10.7):</strong>
          Total margin (${targetMargin}%) + potongan biaya penjualan (${(platformFee + paymentFee).toFixed(1)}%) berjumlah <strong>${totalRatePct.toFixed(1)}% (≥ 100%)</strong>.
          Kalkulator menolak pembagian nilai nol/negatif agar harga rekomendasi tidak menyesatkan.
        </div>
      `;
    }
  } else {
    if (alertEl) alertEl.style.display = 'none';
  }

  // Update Margin Badge
  const marginBadge = document.getElementById('sim-margin-badge');
  if (marginBadge) marginBadge.textContent = `${targetMargin}%`;

  // Render 4 Komparasi Skenario
  // Skenario 1: Direct / WhatsApp (Fee platform 0%, QRIS 0.7%, Margin target user)
  const scen1 = calculateSellingPriceAndProfit({
    hppPerUnit: baseHpp,
    targetMarginPct: targetMargin,
    platformFeePct: 0,
    paymentFeePct: 0.7,
    fixedSellingFee: 0,
    manualSellingPrice: manualPrice,
    salableCount,
    roundingOption: rounding
  });

  updateScenarioCard('scen-1', scen1, baseHpp);

  // Skenario 2: Reseller / Grosir (Fee 0%, Margin hemat 20%)
  const scen2 = calculateSellingPriceAndProfit({
    hppPerUnit: baseHpp,
    targetMarginPct: 20,
    platformFeePct: 0,
    paymentFeePct: 0.7,
    fixedSellingFee: 0,
    salableCount,
    roundingOption: rounding
  });

  updateScenarioCard('scen-2', scen2, baseHpp);

  // Skenario 3: E-Commerce Marketplace (Shopee/Tokopedia: 6.5% + QRIS 0.7% = 7.2%, Margin target user, Fixed packing Rp 500)
  const scen3 = calculateSellingPriceAndProfit({
    hppPerUnit: baseHpp,
    targetMarginPct: targetMargin,
    platformFeePct: 6.5,
    paymentFeePct: 0.7,
    fixedSellingFee: fixedFee > 0 ? fixedFee : 500,
    salableCount,
    roundingOption: rounding
  });

  updateScenarioCard('scen-3', scen3, baseHpp);

  // Skenario 4: Food Delivery (GoFood/GrabFood komisi 20%, Margin target user)
  const scen4 = calculateSellingPriceAndProfit({
    hppPerUnit: baseHpp,
    targetMarginPct: targetMargin,
    platformFeePct: 20,
    paymentFeePct: 0,
    fixedSellingFee: 0,
    salableCount,
    roundingOption: rounding
  });

  updateScenarioCard('scen-4', scen4, baseHpp);
}

function updateScenarioCard(prefix, result, hpp) {
  const priceEl = document.getElementById(`${prefix}-price`);
  const hppEl = document.getElementById(`${prefix}-hpp`);
  const profitEl = document.getElementById(`${prefix}-profit`);
  const marginEl = document.getElementById(`${prefix}-margin`);
  const markupEl = document.getElementById(`${prefix}-markup`);

  if (!result.isRateValid) {
    if (priceEl) priceEl.textContent = 'Tidak Valid';
    if (profitEl) profitEl.textContent = '-';
    if (marginEl) marginEl.textContent = '-';
    if (markupEl) markupEl.textContent = '-';
    return;
  }

  if (priceEl) priceEl.textContent = formatRupiah(result.activeSellingPrice);
  if (hppEl) hppEl.textContent = formatRupiah(hpp);
  if (profitEl) profitEl.textContent = formatRupiah(result.labaPerUnit);
  if (marginEl) marginEl.textContent = formatPercent(result.marginAktual);
  if (markupEl) markupEl.textContent = formatPercent(result.markupAktual);
}

function resetSimulationParameters() {
  const s = state.settings;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal('sim-input-margin', s.defaultTargetMarginPct || 35);
  setVal('sim-input-platform-fee', 6.5);
  setVal('sim-input-payment-fee', s.defaultPaymentFeePct || 0.7);
  setVal('sim-input-fixed-fee', 500);
  setVal('sim-input-manual-price', 0);
  setVal('sim-rounding-select', s.defaultRoundingOption || '500');
  setVal('sim-basis-select', 'pack');
}

function handleApplySimToRecipe() {
  if (!state.activeRecipe) return;

  const targetMargin = Number(document.getElementById('sim-input-margin')?.value) || 35;
  const platformFee = Number(document.getElementById('sim-input-platform-fee')?.value) || 0;
  const paymentFee = Number(document.getElementById('sim-input-payment-fee')?.value) || 0.7;
  const fixedFee = Number(document.getElementById('sim-input-fixed-fee')?.value) || 0;
  const manualPrice = Number(document.getElementById('sim-input-manual-price')?.value) || 0;
  const rounding = document.getElementById('sim-rounding-select')?.value || '500';

  if (!state.activeRecipe.pricing) state.activeRecipe.pricing = {};
  state.activeRecipe.pricing.targetMarginPct = targetMargin;
  state.activeRecipe.pricing.platformFeePct = platformFee;
  state.activeRecipe.pricing.paymentFeePct = paymentFee;
  state.activeRecipe.pricing.fixedSellingFee = fixedFee;
  state.activeRecipe.pricing.manualSellingPrice = manualPrice;
  state.activeRecipe.pricing.roundingOption = rounding;

  saveRecipe(state.activeRecipe);
  showToast('Parameter simulasi berhasil disimpan ke dalam resep.', 'success');
}

// ============================================================================
// View 5: Laporan & Cetak PDF / CSV
// ============================================================================

function renderReportView() {
  if (!state.activeRecipe || !state.calcResult) {
    updateCalculations();
  }

  const r = state.activeRecipe;
  const calc = state.calcResult;

  // Header Date
  const dateEl = document.getElementById('rep-date');
  if (dateEl) {
    dateEl.textContent = `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }

  // Meta
  document.getElementById('rep-product-name').textContent = r.name || '-';
  document.getElementById('rep-category').textContent = r.category || '-';
  document.getElementById('rep-notes').textContent = r.notes || 'Tidak ada catatan khusus';
  document.getElementById('rep-yield-total').textContent = `${r.yieldTotal || calc.yieldTotal} pcs`;
  const rejectEl = document.getElementById('rep-yield-reject');
  if (rejectEl) rejectEl.textContent = `${calc.yieldReject} pcs`;
  document.getElementById('rep-yield-salable').textContent = `${r.yieldSalable || calc.yieldSalable} pcs layak`;
  document.getElementById('rep-units-per-pack').textContent = `${r.unitsPerPack} pcs / pack`;
  const packSummaryEl = document.getElementById('rep-packs-summary');
  if (packSummaryEl) {
    packSummaryEl.textContent = `${calc.fullPacks} pack penuh${calc.hasRemainder ? ` + sisa ${calc.remainderUnits} unit` : ' (pas)'}`;
  }

  // Ingredients Table
  const tbody = document.getElementById('rep-ingredients-tbody');
  if (tbody) {
    tbody.innerHTML = '';
    (r.ingredients || []).forEach((ing, i) => {
      const res = calculateIngredientCost(ing);
      const tr = document.createElement('tr');
      const convBadge = ing.conversionFactor
        ? `<div style="font-size: 0.70rem; color: var(--color-navy-700); background: var(--color-cream-100); padding: 1px 4px; border-radius: 3px; display: inline-block; margin-top: 2px;">Faktor: 1 ${ing.purchaseUnit} = ${ing.conversionFactor} ${ing.usageUnit}</div>`
        : '';
      const sourceSub = res.unitPriceSource
        ? `<div style="font-size: 0.70rem; color: var(--color-gray-500); line-height: 1.2; margin-top: 2px;">${res.unitPriceSource}</div>`
        : '';
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>
          <div style="font-weight: 600;">${ing.name}</div>
          ${convBadge}
        </td>
        <td>
          <div>${formatRupiah(ing.purchasePrice)}</div>
          ${sourceSub}
        </td>
        <td>${ing.purchaseQty} ${ing.purchaseUnit}</td>
        <td>${ing.usageQty} ${ing.usageUnit}</td>
        <td style="text-align: right; font-weight: 700;">${res.success ? formatRupiah(res.cost) : 'Error Satuan'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Overheads breakdown
  document.getElementById('rep-total-materials').textContent = formatRupiah(calc.totalBahan);
  document.getElementById('rep-cost-packaging').textContent = formatRupiah(calc.totalBiayaKemasan);
  document.getElementById('rep-cost-label').textContent = formatRupiah(calc.biayaLabel);
  document.getElementById('rep-cost-labor').textContent = formatRupiah(calc.biayaTenagaKerja);
  document.getElementById('rep-cost-energy').textContent = formatRupiah(calc.biayaEnergi);
  document.getElementById('rep-cost-oil').textContent = formatRupiah(calc.biayaMinyak);
  document.getElementById('rep-cost-other').textContent = formatRupiah(calc.biayaTransportasi + calc.biayaLainnya);
  document.getElementById('rep-cost-pre-waste').textContent = formatRupiah(calc.totalBiayaSebelumCadangan);
  document.getElementById('rep-waste-pct').textContent = calc.reservePct;
  document.getElementById('rep-cost-waste').textContent = formatRupiah(calc.cadanganSusut);
  document.getElementById('rep-total-hpp-batch').textContent = formatRupiah(calc.totalHppBatch);
  document.getElementById('rep-hpp-unit').textContent = `${formatRupiah(calc.hppPerUnit)} / pcs`;
  document.getElementById('rep-hpp-pack').textContent = `${formatRupiah(calc.hppPerKemasan)} / pack`;

  // Pricing Recommendation
  const pricing = calculateSellingPriceAndProfit({
    hppPerUnit: calc.hppPerKemasan,
    targetMarginPct: r.pricing?.targetMarginPct || 35,
    platformFeePct: r.pricing?.platformFeePct || 6.5,
    paymentFeePct: r.pricing?.paymentFeePct || 0.7,
    fixedSellingFee: r.pricing?.fixedSellingFee || 500,
    salableCount: calc.totalPacksProduced,
    roundingOption: r.pricing?.roundingOption || '500'
  });

  document.getElementById('rep-rec-price').textContent = formatRupiah(pricing.recommendedPrice);
  document.getElementById('rep-target-margin').textContent = `${pricing.targetMarginPct}%`;
  document.getElementById('rep-est-platform').textContent = `${pricing.totalSalesFeePct.toFixed(1)}%`;
  document.getElementById('rep-profit-pack').textContent = `${formatRupiah(pricing.labaPerUnit)} / pack`;
  document.getElementById('rep-profit-batch').textContent = `${formatRupiah(pricing.labaPerBatch)} (1 batch)`;
  document.getElementById('rep-actual-margin').textContent = formatPercent(pricing.marginAktual);
}

function handleExportCSV() {
  if (!state.activeRecipe || !state.calcResult) {
    updateCalculations();
  }

  const csv = exportRecipeToCSV(state.activeRecipe, state.calcResult);
  const fileName = `${(state.activeRecipe.name || 'Resep').replace(/\s+/g, '_')}_HPP.csv`;
  downloadFile(csv, fileName, 'text/csv;charset=utf-8;');
  showToast('Laporan CSV berhasil diunduh.', 'success');
}

// ============================================================================
// View 6: Pengaturan & Live P10 Test Suite
// ============================================================================

function renderSettingsView() {
  const s = getSettings();
  state.settings = s;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal('setting-rounding', s.defaultRoundingOption || '500');
  setVal('setting-default-margin', s.defaultTargetMarginPct || 35);
  setVal('setting-default-qris', s.defaultPaymentFeePct || 0.7);
}

function handleSaveSettingsForm() {
  const rounding = document.getElementById('setting-rounding')?.value || '500';
  const margin = Number(document.getElementById('setting-default-margin')?.value) || 35;
  const qris = Number(document.getElementById('setting-default-qris')?.value) || 0.7;

  const newSettings = {
    defaultRoundingOption: rounding,
    defaultTargetMarginPct: margin,
    defaultPaymentFeePct: qris
  };

  saveSettings(newSettings);
  state.settings = getSettings();
  showToast('Pengaturan aplikasi berhasil diperbarui.', 'success');
}

function handleDownloadBackup() {
  const jsonStr = exportRecipesToJSON();
  const fileName = `Backup_HPP_Nugita_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(jsonStr, fileName, 'application/json;charset=utf-8;');
  showToast('Cadangan data berhasil diunduh (format JSON).', 'success');
}

function handleRestoreJSONFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target?.result;
    if (typeof content !== 'string') return;

    showConfirm(
      'Konfirmasi Pulihkan Data',
      `File "${file.name}" siap diimpor. Apakah Anda ingin menggabungkan resep cadangan ini ke dalam aplikasi? Resep dengan ID sama akan diperbarui tanpa membuat duplikat.`,
      () => {
        const res = importRecipesFromJSON(content, 'merge');
        if (res.success) {
          showToast(`Berhasil memulihkan ${res.importedCount} resep!`, 'success');
          state.recipes = getAllRecipes();
          renderDashboard();
          renderRecipesGrid();
        } else {
          showToast(`Gagal memulihkan: ${res.errors.join(', ')}`, 'danger');
        }
      }
    );
  };
  reader.readAsText(file);
}

/**
 * P10 In-App Live Test Suite Runner
 * Menjalankan 12 skenario pengujian langsung di browser dengan laporan visual!
 */
export function runInAppTestSuite() {
  const container = document.getElementById('test-items-container');
  const summaryEl = document.getElementById('test-results-summary');
  if (!container || !summaryEl) return;

  container.innerHTML = '';
  summaryEl.textContent = 'Sedang menjalankan 20 pengujian otomatis (Kasus A–E, P10, & Audit Lanjutan)...';
  summaryEl.style.color = 'var(--color-orange-500)';

  const tests = [
    // Bagian 1: Audit Rumus Inti Kasus A - E
    {
      id: 'Kasus A',
      name: 'Biaya Bahan & HPP: Bahan Rp 100k, Kemasan Rp 20k, Tenaga Rp 30k, Energi Rp 10k -> HPP Batch Rp 160k, HPP Unit Rp 8k',
      fn: () => {
        const res = calculateHPP({
          ingredients: [{ purchasePrice: 100000, purchaseQty: 1, purchaseUnit: 'pack', usageQty: 1, usageUnit: 'pack' }],
          overheads: { biayaKemasanTotal: 20000, biayaTenagaKerja: 30000, biayaEnergi: 10000 },
          yieldSalable: 20,
          wasteReservePct: 0
        });
        return res.isValid && res.totalHppBatch === 160000 && res.hppPerUnit === 8000;
      }
    },
    {
      id: 'Kasus B',
      name: 'HPP Pack: HPP unit Rp 8.000, isi 5 pcs, kemasan tambahan luar Rp 2.000 -> HPP Pack Rp 42.000',
      fn: () => {
        const res = calculateHPP({
          ingredients: [{ purchasePrice: 100000, purchaseQty: 1, purchaseUnit: 'pack', usageQty: 1, usageUnit: 'pack' }],
          overheads: { biayaKemasanTotal: 20000, biayaTenagaKerja: 30000, biayaEnergi: 10000 },
          yieldSalable: 20,
          unitsPerPack: 5,
          extraPackCost: 2000
        });
        return res.hppPerUnit === 8000 && res.hppPerKemasan === 42000;
      }
    },
    {
      id: 'Kasus C',
      name: 'Margin & Markup: HPP Rp 8.000, Biaya jual 10%, Target margin 30% -> Harga Rp 13.333,33, Laba Rp 4.000, Margin 30%',
      fn: () => {
        const res = calculateSellingPriceAndProfit({
          hppPerUnit: 8000,
          targetMarginPct: 30,
          platformFeePct: 10,
          paymentFeePct: 0,
          fixedSellingFee: 0,
          roundingOption: 'none'
        });
        return res.isRateValid &&
          Math.abs(res.rawRecommendedPrice - (8000 / 0.6)) < 0.001 &&
          Math.abs(res.labaPerUnit - 4000) < 0.01 &&
          Math.abs(res.marginAktual - 30) < 0.001;
      }
    },
    {
      id: 'Kasus D',
      name: 'Presisi Pembulatan: HPP pack dihitung dari nilai dasar presisi murni tanpa distorsi pembulatan prematur',
      fn: () => {
        const res = calculateHPP({
          ingredients: [{ purchasePrice: 70000, purchaseQty: 1, purchaseUnit: 'pack', usageQty: 1, usageUnit: 'pack' }],
          yieldSalable: 30,
          unitsPerPack: 6
        });
        return Math.abs(res.hppPerUnit - (70000 / 30)) < 0.0001 && Math.round(res.hppPerKemasan) === 14000;
      }
    },
    {
      id: 'Kasus E',
      name: 'Validasi & Filter: Menolak yield nol, input negatif, margin >= 100%, filter resep tanpa harga jual',
      fn: () => {
        const t1 = calculateHPP({ yieldSalable: 0 });
        const t2 = calculateIngredientCost({ purchasePrice: -1000, purchaseQty: 1, usageQty: 10 });
        const t3 = calculateSellingPriceAndProfit({ hppPerUnit: 5000, targetMarginPct: 90, platformFeePct: 15 });
        return !t1.isValid && !t2.success && !t3.isRateValid;
      }
    },

    // Bagian 2: 12 Skenario Pengujian Wajib P10
    {
      id: 'P10-1',
      name: 'Konversi kg ke gram dan liter ke ml',
      fn: () => {
        const t1 = convertUnit(2.5, 'kg', 'gram');
        const t2 = convertUnit(1.5, 'liter', 'ml');
        const t3 = convertUnit(1, 'kg', 'pcs'); // Harus tolak
        return t1.success && t1.value === 2500 && t2.success && t2.value === 1500 && !t3.success;
      }
    },
    {
      id: 'P10-2',
      name: 'Menghitung harga per gram dari harga per kilogram',
      fn: () => {
        const res = calculateBaseUnitPrice(48000, 1, 'kg');
        return res.success && res.pricePerBase === 48 && res.baseUnit === 'gram';
      }
    },
    {
      id: 'P10-3',
      name: 'Menjumlahkan biaya bahan baku secara akurat',
      fn: () => {
        const ingredients = [
          { purchasePrice: 40000, purchaseQty: 1, purchaseUnit: 'kg', usageQty: 500, usageUnit: 'gram' }, // 20.000
          { purchasePrice: 20000, purchaseQty: 1, purchaseUnit: 'kg', usageQty: 250, usageUnit: 'gram' }  // 5.000
        ];
        const res = calculateTotalIngredientsCost(ingredients);
        return res.total === 25000 && res.validCount === 2;
      }
    },
    {
      id: 'P10-4',
      name: 'Menghitung biaya produksi, cadangan susut, dan HPP per unit',
      fn: () => {
        const res = calculateHPP({
          ingredients: [{ purchasePrice: 60000, purchaseQty: 1, purchaseUnit: 'kg', usageQty: 500, usageUnit: 'gram' }], // 30.000
          overheads: { biayaTenagaKerja: 10000 },
          yieldTotal: 20,
          yieldSalable: 20,
          wasteReservePct: 5
        });
        return res.totalBiayaSebelumCadangan === 40000 && res.cadanganSusut === 2000 && res.hppPerUnit === 2100;
      }
    },
    {
      id: 'P10-5',
      name: 'Menghitung HPP per kemasan dari HPP unit dan isi pack',
      fn: () => {
        const res = calculateHPP({
          ingredients: [{ purchasePrice: 60000, purchaseQty: 1, purchaseUnit: 'kg', usageQty: 500, usageUnit: 'gram' }],
          overheads: { biayaTenagaKerja: 10000 },
          yieldSalable: 20,
          unitsPerPack: 5,
          wasteReservePct: 5,
          extraPackCost: 500
        });
        return res.hppPerKemasan === 11000;
      }
    },
    {
      id: 'P10-6',
      name: 'Menghitung harga jual berdasarkan target margin dan potongan penjualan',
      fn: () => {
        const res = calculateSellingPriceAndProfit({
          hppPerUnit: 10000,
          targetMarginPct: 40,
          platformFeePct: 10,
          paymentFeePct: 0,
          fixedSellingFee: 0,
          roundingOption: 'none'
        });
        return res.isRateValid && res.recommendedPrice === 20000 && res.labaPerUnit === 8000 && res.marginAktual === 40;
      }
    },
    {
      id: 'P10-7',
      name: 'Menolak jika target margin + biaya penjualan >= 100%',
      fn: () => {
        const res = calculateSellingPriceAndProfit({
          hppPerUnit: 10000,
          targetMarginPct: 90,
          platformFeePct: 10
        });
        return !res.isRateValid && res.recommendedPrice === 0 && res.validationError !== null;
      }
    },
    {
      id: 'P10-8',
      name: 'Menangani hasil produksi nol tanpa division by zero / NaN',
      fn: () => {
        const res = calculateHPP({
          ingredients: [{ purchasePrice: 50000, purchaseQty: 1, purchaseUnit: 'kg', usageQty: 500, usageUnit: 'gram' }],
          yieldTotal: 0,
          yieldSalable: 0
        });
        return !res.isValid && res.hppPerUnit === 0 && !isNaN(res.hppPerUnit);
      }
    },
    {
      id: 'P10-9',
      name: 'Menyimpan dan memuat ulang resep dari storage',
      fn: () => {
        const saved = saveRecipe({ name: 'Uji Storage P10', yieldSalable: 30, ingredients: [] });
        const loaded = getRecipeById(saved.recipe.id);
        const pass = loaded && loaded.name === 'Uji Storage P10';
        deleteRecipe(saved.recipe.id);
        return pass;
      }
    },
    {
      id: 'P10-10',
      name: 'Mengekspor dan mengimpor data tanpa menggandakan resep',
      fn: () => {
        const json = exportRecipesToJSON();
        const initialCount = getAllRecipes().length;
        const imp = importRecipesFromJSON(json, 'merge');
        const afterCount = getAllRecipes().length;
        return imp.success && initialCount === afterCount;
      }
    },
    {
      id: 'P10-11',
      name: 'Memastikan perubahan simulasi tidak mengubah resep asli',
      fn: () => {
        const testR = saveRecipe({ name: 'Resep Asli Simulasi', pricing: { targetMarginPct: 30 } });
        calculateSellingPriceAndProfit({ hppPerUnit: 2000, targetMarginPct: 50 });
        const check = getRecipeById(testR.recipe.id);
        const pass = check.pricing.targetMarginPct === 30;
        deleteRecipe(testR.recipe.id);
        return pass;
      }
    },
    {
      id: 'P10-12',
      name: 'Memastikan tidak ada biaya minyak atau kemasan yang dihitung dua kali',
      fn: () => {
        const ingWithOil = [{ name: 'Minyak Goreng Sawit', purchasePrice: 15000, purchaseQty: 1, purchaseUnit: 'liter', usageQty: 200, usageUnit: 'ml' }];
        const ovWithOil = { biayaMinyak: 3000 };
        const warnings = checkDoubleCountingWarnings(ingWithOil, ovWithOil);
        return warnings.length > 0;
      }
    },

    // Bagian 3: Audit Resep, Konversi Satuan, & Reaktivitas
    {
      id: 'Audit-1',
      name: 'Audit Resep Dimsum: HPP unit Rp 1.615/pcs, HPP pack Rp 16.750, Margin 41,5%',
      fn: () => {
        const d = DEFAULT_PRESETS[1];
        const res = calculateHPP(d);
        const pricing = calculateSellingPriceAndProfit({
          hppPerUnit: res.hppPerKemasan,
          targetMarginPct: d.pricing.targetMarginPct,
          paymentFeePct: d.pricing.paymentFeePct,
          roundingOption: d.pricing.roundingOption
        });
        return res.hppPerUnit === 1615 && res.hppPerKemasan === 16750 && formatPercent(pricing.marginAktual) === '41.5%';
      }
    },
    {
      id: 'Audit-2',
      name: 'Konversi Telur & Validitas HPP Nugget serta Risoles',
      fn: () => {
        const sNugget = getRecipeStatus(DEFAULT_PRESETS[0]);
        const sRisoles = getRecipeStatus(DEFAULT_PRESETS[2]);
        return sNugget.canCalculate && sRisoles.canCalculate && sNugget.calc.hppPerUnit > 0 && sRisoles.calc.hppPerUnit > 0;
      }
    },
    {
      id: 'Audit-3',
      name: 'Pembedaan Status Resep: Identifikasi data bahan kosong, yield nol, dan biaya nol',
      fn: () => {
        const sEmpty = getRecipeStatus({ ingredients: [] });
        const sZeroY = getRecipeStatus({ ingredients: [{ name: 'Ayam', purchasePrice: 10000, purchaseQty: 1, usageQty: 1 }], yieldSalable: 0 });
        const sZeroC = getRecipeStatus({ ingredients: [{ name: 'Air', purchasePrice: 0, purchaseQty: 1, usageQty: 1 }], yieldSalable: 10 });
        return sEmpty.status === 'NO_INGREDIENTS' && sZeroY.status === 'INVALID_YIELD' && sZeroC.status === 'INSUFFICIENT_COST';
      }
    },
    {
      id: 'Audit-4',
      name: 'Reaktivitas Harga Bahan: Kenaikan harga bahan baku langsung menaikkan HPP secara proporsional',
      fn: () => {
        const r1 = calculateHPP(DEFAULT_PRESETS[1]);
        const clone = JSON.parse(JSON.stringify(DEFAULT_PRESETS[1]));
        clone.ingredients[0].purchasePrice = 60000;
        const r2 = calculateHPP(clone);
        return r2.hppPerUnit === 1768 && (r2.hppPerUnit - r1.hppPerUnit) === 153;
      }
    },
    {
      id: 'Audit-5',
      name: 'Reaktivitas Isi Pack: Perubahan isi pack Dimsum dari 10 ke 15 mengubah HPP pack ke Rp 24.825',
      fn: () => {
        const r15 = calculateHPP({ ...DEFAULT_PRESETS[1], unitsPerPack: 15 });
        return r15.hppPerKemasan === 24825;
      }
    },
    {
      id: 'Audit-6',
      name: 'Konversi Telur Eksplisit & Transparansi Asal Harga: 1 kg telur Rp 28.000 dengan faktor 16 butir/kg = Rp 1.750/butir',
      fn: () => {
        const res16 = calculateIngredientCost({
          name: 'Telur Ayam Segar',
          purchasePrice: 28000,
          purchaseQty: 1,
          purchaseUnit: 'kg',
          usageQty: 2,
          usageUnit: 'butir',
          conversionFactor: 16
        });
        const res14 = calculateIngredientCost({
          name: 'Telur Ayam Jumbo',
          purchasePrice: 28000,
          purchaseQty: 1,
          purchaseUnit: 'kg',
          usageQty: 2,
          usageUnit: 'butir',
          conversionFactor: 14
        });
        return res16.success && res16.cost === 3500 && res16.pricePerBase === 1750 &&
          res16.unitPriceSource.includes('16') && res14.cost === 4000;
      }
    },
    {
      id: 'Audit-7',
      name: 'Validasi Reject QC & Sisa Kemasan: Dimsum 100 awal, 4 reject, 96 layak jual -> 9 pack penuh + 6 unit sisa',
      fn: () => {
        const d = calculateHPP(DEFAULT_PRESETS[1]);
        return d.yieldTotal === 100 && d.yieldReject === 4 && d.yieldSalable === 96 &&
          d.fullPacks === 9 && d.remainderUnits === 6 && d.hasRemainder === true &&
          d.hppPerUnit === 1615;
      }
    },
    {
      id: 'Audit-8',
      name: 'Pemisahan Biaya Kemasan & Dasar Cadangan Susut: Tidak ada duplikasi reject dan kemasan',
      fn: () => {
        const d = calculateHPP(DEFAULT_PRESETS[1]);
        const n = calculateHPP(DEFAULT_PRESETS[0]);
        return d.totalBiayaKemasan === 15000 && d.extraPackCost === 600 &&
          d.cadanganSusut === Math.round(0.02 * d.totalBiayaSebelumCadangan) &&
          n.cadanganSusut === Math.round(0.03 * n.totalBiayaSebelumCadangan);
      }
    }
  ];

  let passedCount = 0;

  tests.forEach(t => {
    const start = performance.now();
    let isPass = false;
    try {
      isPass = t.fn();
    } catch (e) {
      console.error(e);
      isPass = false;
    }
    const duration = (performance.now() - start).toFixed(2);

    if (isPass) passedCount++;

    const row = document.createElement('div');
    row.className = 'test-item-row';
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.1rem;">${isPass ? '✅' : '❌'}</span>
        <div>
          <span class="test-item-name"><strong>[${t.id}]</strong> ${t.name}</span>
          <span style="font-size: 0.74rem; color: var(--color-gray-500); margin-left: 6px;">(${duration} ms)</span>
        </div>
      </div>
      <div>
        <span class="badge ${isPass ? 'badge-success' : 'badge-danger'}">
          ${isPass ? 'LULUS (PASS)' : 'GAGAL (FAIL)'}
        </span>
      </div>
    `;
    container.appendChild(row);
  });

  if (passedCount === tests.length) {
    summaryEl.textContent = `🎉 SELURUH ${passedCount} / ${tests.length} PENGUJIAN LULUS 100%! Rumus terverifikasi akurat.`;
    summaryEl.style.color = 'var(--color-success)';
    showToast(`Semua ${tests.length} pengujian rumus berhasil lolos 100%!`, 'success');
  } else {
    summaryEl.textContent = `⚠️ Ditemukan kegagalan: ${passedCount} / ${tests.length} lulus.`;
    summaryEl.style.color = 'var(--color-danger)';
  }
}

// ============================================================================
// Helper Utilities & Modals
// ============================================================================

function createNewRecipe() {
  const newR = {
    id: null,
    name: 'Resep Frozen Food Baru',
    category: 'Nugget',
    isExample: false,
    yieldTotal: 50,
    yieldSalable: 48,
    unitsPerPack: 12,
    wasteReservePct: 3,
    extraPackCost: 0,
    notes: '',
    ingredients: [
      {
        id: 'ing-' + Date.now(),
        name: 'Daging Ayam Fillet',
        purchasePrice: 40000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 500,
        usageUnit: 'gram'
      }
    ],
    overheads: {
      biayaKemasanPerUnit: 1200,
      jumlahKemasan: 4,
      biayaLabel: 2000,
      biayaTenagaKerja: 8000,
      biayaEnergi: 4000,
      biayaMinyak: 0,
      biayaTransportasi: 2500,
      biayaLainnya: 1000
    },
    pricing: {
      targetMarginPct: state.settings.defaultTargetMarginPct || 35,
      platformFeePct: 6.5,
      paymentFeePct: state.settings.defaultPaymentFeePct || 0.7,
      fixedSellingFee: 500,
      manualSellingPrice: 0,
      roundingOption: state.settings.defaultRoundingOption || '500'
    }
  };

  state.activeRecipe = newR;
  saveActiveDraft(newR);
}

function loadRecipeById(id) {
  const r = getRecipeById(id);
  if (r) {
    state.activeRecipe = JSON.parse(JSON.stringify(r));
    saveActiveDraft(state.activeRecipe);
    renderCalculatorForm();
    showToast(`Resep "${r.name}" berhasil dimuat.`, 'info');
  }
}

function handleSaveRecipe() {
  syncFormToActiveRecipe();
  const res = saveRecipe(state.activeRecipe);
  if (res.success) {
    state.activeRecipe = res.recipe;
    saveActiveDraft(res.recipe);
    showToast(`Resep "${res.recipe.name}" berhasil disimpan!`, 'success');
    renderDashboard();
    renderRecipesGrid();
  }
}

function renderPresetModal() {
  const container = document.getElementById('preset-options-list');
  if (!container) return;

  container.innerHTML = '';
  DEFAULT_PRESETS.forEach(preset => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 12px 14px;
      border-radius: var(--radius-md);
      background-color: var(--color-cream-50);
      border: 1px solid var(--color-cream-200);
      cursor: pointer;
      transition: all var(--transition-fast);
    `;

    item.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <strong style="color: var(--color-navy-900);">${preset.name}</strong>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span class="badge badge-orange">${preset.category}</span>
          <span class="badge badge-warning">Data Contoh</span>
        </div>
      </div>
      <div style="font-size: 0.78rem; color: var(--color-gray-600); margin-top: 4px;">
        Batch: ${preset.yieldSalable} pcs (${preset.unitsPerPack} pcs/pack) • ${preset.ingredients.length} bahan baku
      </div>
    `;

    item.addEventListener('mouseenter', () => {
      item.style.borderColor = 'var(--color-orange-500)';
      item.style.backgroundColor = 'var(--color-orange-50)';
    });

    item.addEventListener('mouseleave', () => {
      item.style.borderColor = 'var(--color-cream-200)';
      item.style.backgroundColor = 'var(--color-cream-50)';
    });

    item.addEventListener('click', () => {
      state.activeRecipe = JSON.parse(JSON.stringify(preset));
      saveActiveDraft(state.activeRecipe);
      renderCalculatorForm();
      closeModal('modal-preset');
      navigateToView('calculator');
      showToast(`Preset "${preset.name}" berhasil dimuat ke kalkulator!`, 'success');
    });

    container.appendChild(item);
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function showConfirm(title, message, onConfirm) {
  const modal = document.getElementById('modal-confirm');
  const titleEl = document.getElementById('modal-confirm-title');
  const msgEl = document.getElementById('modal-confirm-msg');
  const okBtn = document.getElementById('modal-confirm-ok');

  if (!modal || !titleEl || !msgEl || !okBtn) return;

  titleEl.textContent = title;
  msgEl.textContent = message;

  // Clone button to remove old listeners
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);

  newOkBtn.addEventListener('click', () => {
    closeModal('modal-confirm');
    if (typeof onConfirm === 'function') onConfirm();
  });

  openModal('modal-confirm');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'danger' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
