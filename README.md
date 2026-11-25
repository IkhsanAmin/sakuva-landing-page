# Sakuva Landing Page

Landing page Sakuva berbasis React, TypeScript, Vite, dan Tailwind CSS.

## Menjalankan project

Pastikan Node.js dan npm sudah terpasang.

```bash
npm install
npm run dev
```

Vite akan menampilkan alamat lokal, biasanya `http://localhost:5173`.

## Build production

```bash
npm run build
npm run preview
```

## Aset

Letakkan aset gambar asli di `public/assets/`. Nama file harus mengikuti daftar di `public/assets/ASSET_GUIDE.md`.

## Catatan

- Struktur project menggunakan Vite + React + TypeScript.
- Komponen dan helper dari kode sumber awal dipertahankan di `src/App.tsx` untuk menjaga perilaku serta desain tetap utuh.
- Animasi GSAP dan font Plus Jakarta Sans dimuat dari CDN/Google Fonts saat halaman dibuka, sehingga fitur tersebut memerlukan koneksi internet.
