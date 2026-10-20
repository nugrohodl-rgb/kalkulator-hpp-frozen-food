/**
 * Kalkulator HPP Frozen Food by Nugita Digital
 * Preset Resep Standar UMKM Frozen Food (Data Contoh)
 */

export const DEFAULT_PRESETS = [
  {
    id: 'preset-nugget-ayam-keju',
    name: 'Nugget Ayam Keju Crispy',
    category: 'Nugget',
    isExample: true,
    yieldTotal: 50,
    yieldSalable: 48,
    unitsPerPack: 12,
    wasteReservePct: 3,
    extraPackCost: 0, // Kemasan pouch vacuum sudah dihitung dalam biaya operasional batch di bawah
    notes: 'Resep nugget ayam fillet dengan isian keju cheddar potong dadu. Simpan beku di freezer -18°C.',
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-10-10T08:00:00.000Z',
    ingredients: [
      {
        id: 'ing-1',
        name: 'Daging Dada Ayam Fillet',
        purchasePrice: 42000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 600,
        usageUnit: 'gram'
      },
      {
        id: 'ing-2',
        name: 'Tepung Roti / Breadcrumbs Halus',
        purchasePrice: 18000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 250,
        usageUnit: 'gram'
      },
      {
        id: 'ing-3',
        name: 'Keju Cheddar Quick Melt',
        purchasePrice: 24000,
        purchaseQty: 250,
        purchaseUnit: 'gram',
        usageQty: 120,
        usageUnit: 'gram'
      },
      {
        id: 'ing-4',
        name: 'Telur Ayam Segar',
        purchasePrice: 28000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 2,
        usageUnit: 'butir',
        conversionFactor: 16 // Faktor konversi: 1 kg = 16 butir telur ayam ras (~62,5g/butir)
      },
      {
        id: 'ing-5',
        name: 'Bawang Putih Bubuk & Bumbu Rempah',
        purchasePrice: 15000,
        purchaseQty: 100,
        purchaseUnit: 'gram',
        usageQty: 25,
        usageUnit: 'gram'
      },
      {
        id: 'ing-6',
        name: 'Tepung Tapioka / Pati Jagung',
        purchasePrice: 14000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 80,
        usageUnit: 'gram'
      }
    ],
    overheads: {
      biayaMinyak: 3500, // minyak celup precook
      biayaKemasanPerUnit: 1200, // vacuum pouch per pack
      jumlahKemasan: 4, // 48 pcs / 12 per pack = 4 pack
      biayaKemasanTotal: 0,
      biayaLabel: 2000, // 4 stiker x Rp 500
      biayaTenagaKerja: 8000,
      biayaEnergi: 4000, // gas & listrik freezer batch
      biayaTransportasi: 2500,
      biayaLainnya: 1000
    },
    pricing: {
      targetMarginPct: 35,
      platformFeePct: 6.5, // Tokopedia / Shopee
      paymentFeePct: 0.7, // QRIS
      fixedSellingFee: 500, // packing kardus / bubble wrap per pack
      manualSellingPrice: 0,
      roundingOption: '500'
    }
  },
  {
    id: 'preset-dimsum-siomay-ayam',
    name: 'Dimsum Siomay Ayam Udang Premium',
    category: 'Dimsum',
    isExample: true,
    yieldTotal: 100,
    yieldSalable: 96,
    unitsPerPack: 10,
    wasteReservePct: 2,
    extraPackCost: 600, // Kemasan sekunder / paper bag & sauce cup per pack (menghasilkan HPP pack Rp 16.750)
    notes: 'Siomay ayam bertekstur kenyal dengan potongan udang segar dan topping wortel parut.',
    createdAt: '2026-10-11T09:00:00.000Z',
    updatedAt: '2026-10-11T09:00:00.000Z',
    ingredients: [
      {
        id: 'ing-11',
        name: 'Daging Paha Ayam Giling',
        purchasePrice: 48000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 1.2,
        usageUnit: 'kg'
      },
      {
        id: 'ing-12',
        name: 'Udang Kupas Bersih',
        purchasePrice: 85000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 300,
        usageUnit: 'gram'
      },
      {
        id: 'ing-13',
        name: 'Kulit Dimsum Siomay Kuning',
        purchasePrice: 15000,
        purchaseQty: 100,
        purchaseUnit: 'lembar',
        usageQty: 100,
        usageUnit: 'lembar'
      },
      {
        id: 'ing-14',
        name: 'Minyak Wijen & Saus Tiram',
        purchasePrice: 32000,
        purchaseQty: 300,
        purchaseUnit: 'ml',
        usageQty: 45,
        usageUnit: 'ml'
      },
      {
        id: 'ing-15',
        name: 'Tepung Sagu Tani',
        purchasePrice: 18000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 200,
        usageUnit: 'gram'
      }
    ],
    overheads: {
      biayaMinyak: 0,
      biayaKemasanPerUnit: 1500, // thinwall mika microwave safe
      jumlahKemasan: 10,
      biayaKemasanTotal: 0,
      biayaLabel: 4000,
      biayaTenagaKerja: 15000,
      biayaEnergi: 6000, // kukusan gas
      biayaTransportasi: 4000,
      biayaLainnya: 1500
    },
    pricing: {
      targetMarginPct: 40,
      platformFeePct: 0, // Direct offline / WhatsApp
      paymentFeePct: 0.7,
      fixedSellingFee: 0,
      manualSellingPrice: 0,
      roundingOption: '1000'
    }
  },
  {
    id: 'preset-risol-mayo-beef',
    name: 'Risoles Mayo Smoked Beef Keju',
    category: 'Pastel / Risoles',
    isExample: true,
    yieldTotal: 40,
    yieldSalable: 38,
    unitsPerPack: 5,
    wasteReservePct: 3,
    extraPackCost: 0, // Kemasan mika sudah dihitung di operasional batch
    notes: 'Kulit lembut anti robek, isian mayones manis gurih, telur rebus, dan lembaran smoked beef.',
    createdAt: '2026-10-12T10:00:00.000Z',
    updatedAt: '2026-10-12T10:00:00.000Z',
    ingredients: [
      {
        id: 'ing-21',
        name: 'Tepung Terigu Segitiga Biru',
        purchasePrice: 12500,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 400,
        usageUnit: 'gram'
      },
      {
        id: 'ing-22',
        name: 'Smoked Beef Slice',
        purchasePrice: 45000,
        purchaseQty: 20,
        purchaseUnit: 'lembar',
        usageQty: 10,
        usageUnit: 'lembar'
      },
      {
        id: 'ing-23',
        name: 'Mayones Mamasuka / Maestro',
        purchasePrice: 28000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 350,
        usageUnit: 'gram'
      },
      {
        id: 'ing-24',
        name: 'Telur Ayam (Adonan Kulit & Isian)',
        purchasePrice: 28000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 4,
        usageUnit: 'butir',
        conversionFactor: 16 // Faktor konversi: 1 kg = 16 butir telur ayam ras (~62,5g/butir)
      },
      {
        id: 'ing-25',
        name: 'Tepung Panir Orange',
        purchasePrice: 16000,
        purchaseQty: 1,
        purchaseUnit: 'kg',
        usageQty: 250,
        usageUnit: 'gram'
      }
    ],
    overheads: {
      biayaMinyak: 0,
      biayaKemasanPerUnit: 1000,
      jumlahKemasan: 8,
      biayaKemasanTotal: 0,
      biayaLabel: 3000,
      biayaTenagaKerja: 7500,
      biayaEnergi: 3500,
      biayaTransportasi: 2000,
      biayaLainnya: 1000
    },
    pricing: {
      targetMarginPct: 35,
      platformFeePct: 5,
      paymentFeePct: 0.7,
      fixedSellingFee: 0,
      manualSellingPrice: 0,
      roundingOption: '500'
    }
  }
];

export const PRODUCT_CATEGORIES = [
  'Semua Kategori',
  'Nugget',
  'Dimsum',
  'Pastel / Risoles',
  'Bakso',
  'Sosis',
  'Kebab & Roti',
  'Olahan Ikan & Seafood',
  'Lauk Siap Saji',
  'Lainnya'
];
