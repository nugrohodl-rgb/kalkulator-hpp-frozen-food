# Panduan Publikasi Online (Deployment Guide)
**Kalkulator HPP Frozen Food by Nugita Digital**

Aplikasi ini dibangun menggunakan arsitektur modern berbasis Vanilla JS, HTML, dan CSS murni dengan modul ES6. Aplikasi ini sepenuhnya **serverless & client-side** dengan penyimpanan lokal (`localStorage`), sehingga dapat dihosting secara gratis 100%, cepat, dan memiliki keandalan tinggi.

---

## 🚀 Pilihan Utama: Deploy ke Vercel (Rekomendasi)

Vercel memberikan performa CDN global terbaik, sertifikat SSL (HTTPS) otomatis, serta pembaruan otomatis setiap kali ada perubahan data/kode.

### Langkah-langkah Deploy:

#### 1. Melalui GitHub & Vercel Dashboard (Paling Mudah)
1. **Buat Repositori di GitHub**:
   - Buka [github.com/new](https://github.com/new).
   - Beri nama repository, misalnya: `kalkulator-hpp-frozen-food`.
   - Pilih **Public** atau **Private**, lalu klik **Create repository**.
2. **Unggah File Proyek**:
   - Unggah seluruh isi folder `Kalkulator HPP` ke repositori tersebut (bisa melalui web GitHub dengan klik *Add file > Upload files*, atau melalui aplikasi [GitHub Desktop](https://desktop.github.com/)).
3. **Hubungkan ke Vercel**:
   - Buka [vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
   - Pilih repositori `kalkulator-hpp-frozen-food` yang baru Anda buat, lalu klik **"Import"**.
4. **Deploy**:
   - File konfigurasi [`vercel.json`](./vercel.json) sudah disiapkan secara otomatis.
   - Langsung klik tombol **"Deploy"**.
   - Selesai! Dalam waktu ~20 detik, aplikasi Anda sudah live dengan URL publik (contoh: `https://kalkulator-hpp-frozen-food.vercel.app`).

---

## ⚡ Solusi Instan 10 Detik: Netlify Drop (Tanpa GitHub / Tanpa Setup)

Jika Anda ingin aplikasi ini **langsung online detik ini juga** untuk dibagikan kepada tim atau pelanggan tanpa harus membuat repositori Git:
1. Buka browser dan kunjungi: [app.netlify.com/drop](https://app.netlify.com/drop)
2. Buka Finder di macOS Anda, lalu **tarik & seret (drag and drop)** seluruh folder `Kalkulator HPP` ke kotak yang tersedia di halaman Netlify Drop.
3. Website akan langsung aktif dalam hitungan detik dengan domain gratis HTTPS (misal: `https://kalkulator-hpp-frozen.netlify.app`).

---

## 📁 File Konfigurasi yang Telah Disediakan

- [`vercel.json`](./vercel.json): Konfigurasi routing static dan file serving untuk Vercel.
- [`netlify.toml`](./netlify.toml): Konfigurasi security headers dan routing untuk Netlify.
- [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml): Otomasi deploy jika menggunakan GitHub Pages.
- [`.gitignore`](./.gitignore): Mencegah file cache macOS atau file sementara ikut terunggah.
