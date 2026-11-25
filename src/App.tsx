import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ============================================================================
// 1. SECURITY-HARDENED URL ALLOWLIST & SAFE STORAGE HELPERS
// ============================================================================

const ALLOWED_EXTERNAL_HOSTS = new Set(['github.com', 'www.instagram.com']);

/**
 * Validates that external URLs strictly use HTTPS and belong to allowlisted hosts.
 * Falls back to '#top' if validation fails.
 */
function sanitizeExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return '#top';
    if (!ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname)) return '#top';
    return parsed.toString();
  } catch {
    return '#top';
  }
}

const SAFE_LINKS = Object.freeze({
  apkDownload: sanitizeExternalUrl(
    'https://github.com/IkhsanAmin/sakuva-android/releases/download/v1.1.0/Sakuva-v1.1.0.apk'
  ),
  githubRepo: sanitizeExternalUrl('https://github.com/IkhsanAmin/sakuva-android'),
  githubRelease: sanitizeExternalUrl(
    'https://github.com/IkhsanAmin/sakuva-android/releases/tag/v1.1.0'
  ),
  instagram: sanitizeExternalUrl(
    'https://www.instagram.com/ikhs4nn.n?lqvp=MThwNG9oZWtsa2loeA%3D%3D&utm_source=qr'
  )
});

/**
 * Safely reads an allowlisted enum value from localStorage inside try/catch.
 */
function readSafeEnumStorage(key, allowedValues, fallback) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const value = window.localStorage.getItem(key);
    if (value && allowedValues.includes(value)) return value;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely persists an allowlisted enum value to localStorage inside try/catch.
 */
function writeSafeEnumStorage(key, value, allowedValues) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (allowedValues.includes(value)) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota or private-browsing restrictions
  }
}

// ============================================================================
// 2. EXACT LOCAL ASSET MAPPING (DROP FILES INTO public/assets/ WITHOUT RENAMING)
// ============================================================================

const ASSETS = Object.freeze({
  icon: '/assets/sakuva_icon_transparent.svg',
  logo: '/assets/sakuva_logo_transparent.svg',
  light: Object.freeze({
    dashboard: '/assets/beranda.webp',
    wallets: '/assets/dompet.webp',
    category: '/assets/kelola_dan_tambahkategori.webp',
    data: '/assets/manajemendata.webp',
    settings: '/assets/pengaturan.webp',
    history: '/assets/riwayat.webp',
    transaction: '/assets/tambahtransaksi.webp',
    reminder: '/assets/pengingat.webp'
  }),
  dark: Object.freeze({
    dashboard: '/assets/beranda_dark.webp',
    wallets: '/assets/dompet_dark.webp',
    category: '/assets/kelola_dan_tambahkategori_dark.webp',
    data: '/assets/manajemendata_dark.webp',
    settings: '/assets/pengaturan_dark.webp',
    history: '/assets/riwayat_dark.webp',
    transaction: '/assets/tambahtransaksi_dark.webp',
    reminder: '/assets/pengingat_dark.webp'
  })
});

// ============================================================================
// 3. SOFT STRUCTURALISM DESIGN TOKENS (COOL SILVER LIGHT & DEEP SLATE DARK)
// ============================================================================

const THEME_TOKENS = Object.freeze({
  light: {
    mode: 'light',
    bg: '#F4F6F8',
    sectionAlt: '#EDF1F5',
    surface: '#FFFFFF',
    surfaceLow: '#E9EEF2',
    surfaceContainer: '#E5EBF1',
    surfacePill: '#DCE4EC',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    emerald: '#059669',
    emeraldHover: '#047857',
    emeraldText: '#047857',
    emeraldBg: 'rgba(16, 185, 129, 0.11)',
    emeraldGlowStart: 'rgba(16, 185, 129, 0.14)',
    emeraldGlowMid: 'rgba(16, 185, 129, 0.04)',
    watermarkColor: 'rgba(15, 23, 42, 0.045)',
    border: 'rgba(15, 23, 42, 0.06)',
    hairline: 'rgba(15, 23, 42, 0.06)',
    borderStrong: 'rgba(15, 23, 42, 0.14)',
    expense: '#E11D48',
    navBg: 'rgba(255, 255, 255, 0.88)',
    navShadow: '0 8px 24px -10px rgba(15, 23, 42, 0.08)',
    phoneNavBg: '#F1F4F7',
    phoneActivePill: '#DCE4EC',
    shadowCard: '0 6px 20px -12px rgba(15, 23, 42, 0.06)'
  },
  dark: {
    mode: 'dark',
    bg: '#0B1120',
    sectionAlt: '#0E1629',
    surface: '#111827',
    surfaceLow: '#162032',
    surfaceContainer: '#1B273C',
    surfacePill: '#263449',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    emerald: '#059669',
    emeraldHover: '#047857',
    emeraldText: '#10B981',
    emeraldBg: 'rgba(16, 185, 129, 0.15)',
    emeraldGlowStart: 'rgba(16, 185, 129, 0.17)',
    emeraldGlowMid: 'rgba(16, 185, 129, 0.05)',
    watermarkColor: 'rgba(248, 250, 252, 0.045)',
    border: 'rgba(148, 163, 184, 0.14)',
    hairline: 'rgba(148, 163, 184, 0.10)',
    borderStrong: 'rgba(148, 163, 184, 0.22)',
    expense: '#FB7185',
    navBg: 'rgba(17, 24, 39, 0.86)',
    navShadow: '0 10px 28px -12px rgba(2, 6, 23, 0.55)',
    phoneNavBg: '#111827',
    phoneActivePill: '#22314A',
    shadowCard: '0 10px 26px -14px rgba(2, 6, 23, 0.45)'
  }
});

// ============================================================================
// 4. GSAP 3.12.7 + SCROLLTRIGGER SAFE LOADER
// ============================================================================

const GSAP_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js';
const SCROLLTRIGGER_SCRIPT_URL =
  'https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js';

function loadVerifiedScript(id, src) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document unavailable'));
      return;
    }
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true
      });
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// ============================================================================
// 5. INLINE SVG ICONS (ZERO EXTERNAL ICON DEPENDENCIES)
// ============================================================================

function IconDownload({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconGithub({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function IconInstagram({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function IconSun({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function IconMoon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function IconMenu({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function IconX({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconChevronDown({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconChevronLeft({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconSearch({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconPlus({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconDashboard({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function IconList({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function IconWallet({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function IconSettings({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function IconArrowLeft({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconDatabase({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function IconBell({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconShield({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// ============================================================================
// 6. BRAND ICON (/assets/sakuva_icon_transparent.svg + INLINE SVG FALLBACK)
// ============================================================================

function BrandIcon({ dark = false, size = 30, failedImages, onImageError }) {
  const isFailed = Boolean(failedImages[ASSETS.icon]);

  if (!isFailed) {
    return (
      <img
        src={ASSETS.icon}
        width={size}
        height={size}
        alt="Sakuva"
        onError={() => onImageError(ASSETS.icon)}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  const ribbonStroke = dark ? '#F8FAFC' : '#0F172A';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M72 28C66 20 56 16 44 16C28 16 18 25 18 37C18 48 26 54 42 58L55 61C63 63 67 67 67 73C67 80 59 85 47 85C36 85 28 80 23 73L16 79C23 88 34 93 47 93C65 93 76 84 76 71C76 60 68 53 52 49L39 46C31 44 27 40 27 35C27 28 34 24 45 24C54 24 61 27 65 33L72 28Z"
        stroke={ribbonStroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31 71L47 55L58 65L79 44"
        stroke="#10B981"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M66 42H81V57"
        stroke="#10B981"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// 7. BILINGUAL COPY DICTIONARY (ID & EN, ZERO EM DASHES, NO BUZZWORDS)
// ============================================================================

const COPY = Object.freeze({
  id: {
    skipToContent: 'Lewati ke konten utama',
    nav: {
      features: 'Fitur',
      about: 'Tentang',
      faq: 'FAQ',
      contact: 'Contact',
      downloadShort: 'Unduh APK',
      openMenu: 'Buka menu navigasi',
      closeMenu: 'Tutup menu navigasi',
      toggleThemeToDark: 'Aktifkan mode gelap',
      toggleThemeToLight: 'Aktifkan mode terang',
      switchLangLabel: 'Pilih bahasa'
    },
    hero: {
      headline: 'Catat keuangan harian tanpa login, tanpa cloud.',
      subtitle:
        'Aplikasi pencatat keuangan Android ringan (2.13 MB) yang menyimpan seluruh catatan secara lokal di perangkatmu. Pantau saldo lintas dompet, lihat tren pengeluaran, dan cadangkan data kapan saja tanpa iklan.',
      primaryCta: 'Unduh Sakuva v1.1.0',
      secondaryCta: 'Lihat Alur Fitur'
    },
    walkthrough: {
      eyebrow: 'Alur Fitur Utama',
      title: 'Enam layar inti yang terstruktur untuk pencatatan kas harian.',
      subtitle:
        'Gulir halaman atau ketuk setiap bab untuk melihat langsung tampilan masing-masing layar di perangkat Android.',
      subScreenLabel: 'Lihat layar terkait:',
      prevChapter: 'Bab sebelumnya',
      nextChapter: 'Bab berikutnya',
      chapters: [
        {
          num: '01',
          screen: 'dashboard',
          title: 'Beranda',
          desc: 'Ringkasan total saldo lintas dompet, arus kas masuk dan keluar, serta grafik tren pengeluaran untuk periode Harian, Mingguan, Bulanan, dan Tahunan.',
          highlights: [
            'Total saldo lintas dompet dengan angka tabular yang sejajar',
            'Grafik kurva tren pengeluaran berdasarkan periode waktu',
            'Ringkasan kategori pengeluaran terbesar di bagian bawah'
          ]
        },
        {
          num: '02',
          screen: 'history',
          title: 'Riwayat',
          desc: 'Daftar transaksi harian per bulan lengkap dengan pencarian catatan, filter dompet, filter kategori, dan tombol Hapus filter yang sudah diperbaiki di v1.1.0.',
          highlights: [
            'Pencarian catatan transaksi instan dalam bulan aktif',
            'Filter kombinasi berdasarkan dompet, kategori, dan tipe',
            'Tombol Hapus filter satu ketukan untuk mengatur ulang seluruh filter'
          ]
        },
        {
          num: '03',
          screen: 'wallets',
          title: 'Dompet',
          desc: 'Pisahkan saldo Tunai, rekening Bank (BCA, BRI, BNI, BSI), hingga e-wallet seperti DANA dalam kartu terpisah agar mudah dicocokkan dengan saldo asli.',
          highlights: [
            'Total akumulasi seluruh dompet aktif di bagian teratas',
            'Daftar kartu dompet terpisah untuk Tunai, Bank, dan E-Wallet',
            'Tambah atau ubah dompet kapan saja tanpa batas jumlah'
          ]
        },
        {
          num: '04',
          screen: 'transaction',
          title: 'Catat Transaksi',
          desc: 'Input nominal cepat untuk Pemasukan, Pengeluaran, maupun Transfer antar dompet lengkap dengan pemilih sumber dana, kategori, tanggal, dan catatan.',
          highlights: [
            'Peralihan langsung antara Pemasukan, Pengeluaran, dan Transfer',
            'Pilihan sumber dana dan kategori yang jelas dalam satu layar',
            'Pemilih tanggal transaksi serta catatan hingga 200 karakter'
          ]
        },
        {
          num: '05',
          screen: 'category',
          title: 'Kategori Kustom',
          desc: 'Kelola dan tambah kategori pemasukan maupun pengeluaran sesuai kebiasaan belanja harianmu, lengkap dengan penanda warna masing-masing kategori.',
          highlights: [
            'Tab terpisah untuk kategori Pemasukan dan Pengeluaran',
            'Kategori bawaan siap pakai seperti Makan & Minum, Hiburan, dan Transportasi',
            'Tambah, ubah, atau arsipkan kategori kustom kapan saja'
          ]
        },
        {
          num: '06',
          screen: 'data',
          subScreens: ['data', 'settings', 'reminder'],
          title: 'Manajemen Data & Pengingat',
          desc: 'Ekspor dan impor cadangan data lokal (.json), ekspor laporan tabel (.csv) untuk Excel atau Google Sheets, serta aktifkan pengingat pencatatan harian tanpa perlu akun cloud.',
          highlights: [
            'Cadangkan dan pulihkan seluruh database melalui berkas lokal (.json)',
            'Ekspor riwayat transaksi ke format .csv untuk olah data lanjutan',
            'Pengingat Catat Harian pada jam pilihan serta pengingat cadangan rutin'
          ]
        }
      ]
    },
    parity: {
      eyebrow: 'Paritas Mode Terang & Gelap',
      title: 'Tampilan konsisten di Cool Silver (Terang) dan Deep Slate (Gelap).',
      subtitle:
        'Bandingkan tampilan layar Beranda Sakuva pada kedua tema secara langsung. Ketuk tombol di bawah masing-masing kartu untuk mengubah tema halaman ini.',
      lightTitle: 'Cool Silver (Terang)',
      lightDesc: 'Latar #F4F6F8 dengan permukaan kartu #FFFFFF dan garis batas halus untuk keterbacaan siang hari.',
      darkTitle: 'Deep Slate (Gelap)',
      darkDesc: 'Latar #0B1120 dengan permukaan kartu #111827 yang nyaman dipandang di ruangan redup.',
      applyLight: 'Gunakan Mode Terang',
      applyDark: 'Gunakan Mode Gelap',
      activeBadge: 'Aktif'
    },
    about: {
      eyebrow: 'Tentang Sakuva & Rilis v1.1.0',
      title: 'Data disimpan 100% di perangkat, tanpa login dan tanpa iklan.',
      p1: 'Sakuva dibuat untuk pencatatan keuangan pribadi yang jujur, ringan (2.13 MB), dan cepat. Seluruh data transaksi, dompet, dan kategori tersimpan langsung di penyimpanan lokal Android tanpa sinkronisasi cloud, tanpa pelacak analitik, dan tanpa biaya langganan.',
      p2: 'Kode sumber Sakuva terbuka di repositori GitHub IkhsanAmin/sakuva-android sehingga cara penyimpanan dan pemrosesan data dapat diperiksa secara transparan.',
      releaseCardTitle: 'Changelog v1.1.0',
      releaseCardBadge: 'Rilis Terbaru',
      releaseNotes: [
        'Perbaikan skala ikon launcher adaptif agar tampil tajam dan proporsional di berbagai launcher Android.',
        'Pemulihan fungsi tombol Hapus filter di halaman Riwayat agar pencarian dan filter aktif dapat diatur ulang sekaligus.',
        'Paritas tampilan Mode Terang (Cool Silver) dan Mode Gelap (Deep Slate) di seluruh layar utama.',
        'Dukungan penuh Manajemen Data lokal (cadangan JSON & ekspor CSV) serta Pengingat Catat Harian.'
      ]
    },
    faq: {
      eyebrow: 'Pertanyaan Umum (FAQ)',
      title: 'Hal yang sering ditanyakan seputar Sakuva.',
      items: [
        {
          q: 'Apakah data keuangan saya disimpan secara offline dan aman?',
          a: 'Ya. Seluruh transaksi, saldo dompet, dan kategori disimpan 100% di database lokal perangkat Android kamu. Tidak ada akun login, tidak ada server cloud, dan tidak ada pengumpulan data pribadi.'
        },
        {
          q: 'Bagaimana cara menginstal file APK Sakuva di Android?',
          a: 'Unduh berkas Sakuva-v1.1.0.apk (2.13 MB) melalui tombol Unduh Sakuva v1.1.0 di halaman ini, buka berkas dari pengelola unduhan Android, izinkan instalasi dari sumber tidak dikenal jika diminta sistem, lalu ketuk Instal.'
        },
        {
          q: 'Bagaimana cara memindahkan data jika saya ganti HP?',
          a: 'Buka menu Pengaturan lalu masuk ke Manajemen Data dan pilih Cadangkan Data (.json). Salin berkas cadangan tersebut ke HP baru, lalu pilih Pulihkan Data (.json) untuk mengembalikan seluruh catatanmu.'
        },
        {
          q: 'Apakah Sakuva mendukung banyak dompet sekaligus?',
          a: 'Ya. Kamu bisa membuat dan memisahkan saldo untuk Tunai, rekening Bank (seperti BCA, BRI, BNI, BSI), dan E-Wallet (seperti DANA atau GoPay), serta mencatat transfer antar dompet.'
        },
        {
          q: 'Apakah tersedia Mode Terang dan Mode Gelap?',
          a: 'Tersedia. Melalui halaman Pengaturan, kamu dapat memilih tema Sistem, Terang (Cool Silver), atau Gelap (Deep Slate), sekaligus mengganti bahasa antara Bahasa Indonesia dan English.'
        }
      ]
    },
    contact: {
      eyebrow: 'Unduh & Contact',
      title: 'Siap mencatat arus kas harian dengan lebih rapi?',
      subtitle:
        'Unduh rilis resmi Sakuva v1.1.0 (2.13 MB) dari GitHub Releases, periksa kode sumbernya, atau hubungi pengembang melalui Instagram untuk masukan dan laporan kendala.',
      apkBtn: 'Unduh Sakuva v1.1.0 (2.13 MB)',
      githubBtn: 'GitHub Repository',
      igBtn: 'Instagram @ikhs4nn.n'
    },
    footer: {
      credit: 'Sakuva v1.1.0 · Oleh Ikhsan Noor Amin',
      releases: 'Rilis v1.1.0'
    },
    screens: {
      dashboard: 'Beranda',
      history: 'Riwayat',
      wallets: 'Dompet',
      transaction: 'Transaksi',
      category: 'Kategori',
      data: 'Manajemen Data',
      settings: 'Pengaturan',
      reminder: 'Pengingat'
    },
    phone: {
      totalBalance: 'Total Saldo',
      income: 'Pemasukan',
      expense: 'Pengeluaran',
      periods: ['Harian', 'Mingguan', 'Bulanan', 'Tahunan'],
      spendingTrend: 'Tren Pengeluaran',
      topCategories: 'Kategori Teratas',
      searchPlaceholder: 'Cari catatan transaksi',
      filterAll: 'Semua',
      filterIncome: 'Masuk',
      filterExpense: 'Keluar',
      clearFilters: 'Hapus filter',
      emptyHistoryTitle: 'Tidak ada transaksi yang cocok',
      emptyHistorySub: 'Ubah kata kunci pencarian atau ketuk Hapus filter.',
      activeWalletTotal: 'Total saldo dompet aktif',
      addWallet: 'Tambah Dompet',
      newTxTitle: 'Transaksi Baru',
      txModes: ['Pemasukan', 'Pengeluaran', 'Transfer'],
      amountLabel: 'Nominal',
      walletLabel: 'Sumber Dana',
      categoryLabel: 'Kategori',
      manageCategory: 'Kelola Kategori',
      addCategory: 'Tambah Kategori',
      defaultLabel: 'Bawaan',
      saveTx: 'Simpan Transaksi',
      savedTx: 'Transaksi tersimpan',
      appearance: 'Tampilan',
      themeLabel: 'Tema',
      langLabel: 'Bahasa',
      dataMgmt: 'Manajemen Data',
      backupJson: 'Cadangkan Data (.json)',
      restoreJson: 'Pulihkan Data (.json)',
      exportCsv: 'Ekspor Laporan (.csv)',
      resetData: 'Reset Semua Data',
      dailyReminder: 'Pengingat Catat Harian',
      dailyReminderSub: 'Dapatkan notifikasi harian untuk mencatat transaksi.',
      timeLabel: 'Waktu',
      backupReminder: 'Waktunya mencadangkan data',
      backupReminderSub: 'Cadangan terakhir lebih dari 7 hari lalu.',
      aboutLabel: 'Tentang',
      appVersionLabel: 'Versi aplikasi'
    }
  },
  en: {
    skipToContent: 'Skip to main content',
    nav: {
      features: 'Features',
      about: 'About',
      faq: 'FAQ',
      contact: 'Contact',
      downloadShort: 'Download APK',
      openMenu: 'Open navigation menu',
      closeMenu: 'Close navigation menu',
      toggleThemeToDark: 'Switch to dark mode',
      toggleThemeToLight: 'Switch to light mode',
      switchLangLabel: 'Select language'
    },
    hero: {
      headline: 'Track daily finances with no login, no cloud.',
      subtitle:
        'A lightweight offline-first Android personal finance app (2.13 MB) that keeps every record locally on your device. Monitor multiple wallets, inspect spending trends, and back up your data anytime with zero ads.',
      primaryCta: 'Download Sakuva v1.1.0',
      secondaryCta: 'Explore Features'
    },
    walkthrough: {
      eyebrow: 'Feature Walkthrough',
      title: 'Six structured screens built for daily cashflow tracking.',
      subtitle:
        'Scroll through or tap any chapter to inspect each screen inside the Android mockup.',
      subScreenLabel: 'Inspect related screen:',
      prevChapter: 'Previous chapter',
      nextChapter: 'Next chapter',
      chapters: [
        {
          num: '01',
          screen: 'dashboard',
          title: 'Dashboard',
          desc: 'Review your combined balance across all active wallets, income and expense totals, and spending trend charts across Daily, Weekly, Monthly, and Yearly periods.',
          highlights: [
            'Total balance across wallets rendered with aligned tabular numerals',
            'Spending trend chart across 4 selectable time periods',
            'Top spending categories breakdown right on the Dashboard'
          ]
        },
        {
          num: '02',
          screen: 'history',
          title: 'History',
          desc: 'Monthly chronological transaction list with keyword search, wallet and category filters, and the restored Clear filters button in v1.1.0.',
          highlights: [
            'Instant search across transaction notes within the active month',
            'Filter by wallet, category, and transaction type',
            'Restored one-tap Clear filters button to reset active filters at once'
          ]
        },
        {
          num: '03',
          screen: 'wallets',
          title: 'Wallets',
          desc: 'Separate Cash, Bank accounts (BCA, BRI, BNI, BSI), and E-Wallets (such as DANA) into individual cards so balances stay easy to reconcile.',
          highlights: [
            'Combined active wallet balance displayed at the top',
            'Dedicated cards for Cash, Bank accounts, and E-Wallets',
            'Add or edit wallets anytime with no account limit'
          ]
        },
        {
          num: '04',
          screen: 'transaction',
          title: 'Add Transaction',
          desc: 'Fast amount entry for Income, Expense, or Wallet Transfers with source wallet selection, category picker, date selector, and notes.',
          highlights: [
            'Direct switcher for Income, Expense, and Transfer modes',
            'Clear source wallet and category selectors on one screen',
            'Date picker and transaction notes up to 200 characters'
          ]
        },
        {
          num: '05',
          screen: 'category',
          title: 'Custom Categories',
          desc: 'Manage default categories or add custom Income and Expense categories with distinct color markers that fit your everyday spending.',
          highlights: [
            'Dedicated tabs for Income and Expense categories',
            'Ready-to-use default categories such as Food & Drink, Entertainment, and Transport',
            'Add, rename, or archive custom categories anytime'
          ]
        },
        {
          num: '06',
          screen: 'data',
          subScreens: ['data', 'settings', 'reminder'],
          title: 'Data & Reminders',
          desc: 'Export and restore local JSON backups, generate spreadsheet-ready CSV reports for Excel or Google Sheets, and schedule daily logging reminders with no cloud account.',
          highlights: [
            'Back up and restore your complete database via local .json files',
            'Export transaction history to .csv for spreadsheet analysis',
            'Daily logging notification reminder and 7-day backup reminder'
          ]
        }
      ]
    },
    parity: {
      eyebrow: 'Light & Dark Mode Parity',
      title: 'Consistent clarity in Cool Silver (Light) and Deep Slate (Dark).',
      subtitle:
        'Compare Sakuva Dashboard screens across both themes side by side. Tap either button below to switch the active theme of this page.',
      lightTitle: 'Cool Silver (Light)',
      lightDesc: 'Subtle #F4F6F8 canvas with crisp #FFFFFF cards and structural borders for daylight reading.',
      darkTitle: 'Deep Slate (Dark)',
      darkDesc: 'Deep #0B1120 canvas with #111827 elevated cards tuned for low-glare evening use.',
      applyLight: 'Use Light Mode',
      applyDark: 'Use Dark Mode',
      activeBadge: 'Active'
    },
    about: {
      eyebrow: 'About Sakuva & Release v1.1.0',
      title: 'Stored 100% locally on your device, with no login and no ads.',
      p1: 'Sakuva is built for straightforward, lightweight (2.13 MB), and private personal bookkeeping. Every transaction, wallet, and category stays in your Android device local storage with no cloud sync, no analytics trackers, and no subscription fees.',
      p2: 'The source code is open on GitHub at IkhsanAmin/sakuva-android so anyone can inspect how local data is structured and handled.',
      releaseCardTitle: 'Changelog v1.1.0',
      releaseCardBadge: 'Latest Release',
      releaseNotes: [
        'Fixed adaptive launcher icon scaling so the icon renders crisp and balanced across Android launchers.',
        'Restored the Clear filters button on the History screen to reset search and active filters together.',
        'Full Cool Silver (Light) and Deep Slate (Dark) visual parity across every screen.',
        'Local Data Management (JSON backup/restore and CSV export) plus Daily Reminder notifications.'
      ]
    },
    faq: {
      eyebrow: 'Frequently Asked Questions',
      title: 'Common questions about privacy, backups, and installation.',
      items: [
        {
          q: 'Is my financial data stored completely offline?',
          a: 'Yes. All transactions, wallet balances, and categories live 100% locally on your Android device. There is no account login, no cloud sync, and no personal data collection.'
        },
        {
          q: 'How do I install the Sakuva APK on Android?',
          a: 'Download Sakuva-v1.1.0.apk (2.13 MB) using the Download Sakuva v1.1.0 button on this page, open the downloaded file in your Android file manager, allow installation from unknown sources if prompted, and tap Install.'
        },
        {
          q: 'How do I move my data to a new phone?',
          a: 'Open Settings, go to Data Management, and select Backup Data (.json). Copy that backup file to your new phone, then choose Restore Data (.json) to bring back all of your records.'
        },
        {
          q: 'Does Sakuva support multiple wallets?',
          a: 'Yes. You can track separate balances for Cash, Bank accounts (such as BCA, BRI, BNI, BSI), and E-Wallets (such as DANA or GoPay), and record transfers between wallets.'
        },
        {
          q: 'Are Light Mode and Dark Mode both supported?',
          a: 'Yes. In Settings you can choose System, Light (Cool Silver), or Dark (Deep Slate), as well as switch the app language between Bahasa Indonesia and English.'
        }
      ]
    },
    contact: {
      eyebrow: 'Download & Contact',
      title: 'Ready to keep your daily cashflow organized locally?',
      subtitle:
        'Download the official Sakuva v1.1.0 APK (2.13 MB) from GitHub Releases, browse the repository, or reach out via Instagram for feedback and bug reports.',
      apkBtn: 'Download Sakuva v1.1.0 (2.13 MB)',
      githubBtn: 'GitHub Repository',
      igBtn: 'Instagram @ikhs4nn.n'
    },
    footer: {
      credit: 'Sakuva v1.1.0 · By Ikhsan Noor Amin',
      releases: 'Releases v1.1.0'
    },
    screens: {
      dashboard: 'Dashboard',
      history: 'History',
      wallets: 'Wallets',
      transaction: 'Transaction',
      category: 'Categories',
      data: 'Data Management',
      settings: 'Settings',
      reminder: 'Reminders'
    },
    phone: {
      totalBalance: 'Total Balance',
      income: 'Income',
      expense: 'Expense',
      periods: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
      spendingTrend: 'Spending Trend',
      topCategories: 'Top Categories',
      searchPlaceholder: 'Search transaction notes',
      filterAll: 'All',
      filterIncome: 'Income',
      filterExpense: 'Expense',
      clearFilters: 'Clear filters',
      emptyHistoryTitle: 'No matching transactions',
      emptyHistorySub: 'Change your search keyword or tap Clear filters.',
      activeWalletTotal: 'Total active wallet balance',
      addWallet: 'Add Wallet',
      newTxTitle: 'New Transaction',
      txModes: ['Income', 'Expense', 'Transfer'],
      amountLabel: 'Amount',
      walletLabel: 'Source Wallet',
      categoryLabel: 'Category',
      manageCategory: 'Manage Categories',
      addCategory: 'Add Category',
      defaultLabel: 'Default',
      saveTx: 'Save Transaction',
      savedTx: 'Transaction saved',
      appearance: 'Appearance',
      themeLabel: 'Theme',
      langLabel: 'Language',
      dataMgmt: 'Data Management',
      backupJson: 'Backup Data (.json)',
      restoreJson: 'Restore Data (.json)',
      exportCsv: 'Export Report (.csv)',
      resetData: 'Reset All Data',
      dailyReminder: 'Daily Logging Reminder',
      dailyReminderSub: 'Receive a daily notification to log transactions.',
      timeLabel: 'Time',
      backupReminder: 'Time to back up data',
      backupReminderSub: 'Last backup was over 7 days ago.',
      aboutLabel: 'About',
      appVersionLabel: 'App version'
    }
  }
});

// ============================================================================
// 8. REALISTIC FALLBACK DATA (MATCHING REAL SAKUVA v1.1.0 SCREENSHOTS)
// ============================================================================

const PERIOD_SERIES = Object.freeze([
  {
    income: '0 IDR',
    expense: '57.000 IDR',
    labels: ['06:00', '10:00', '14:00', '18:00', '22:00'],
    points: [
      [16, 88],
      [72, 66],
      [134, 28],
      [196, 74],
      [254, 84]
    ]
  },
  {
    income: '3.000.000 IDR',
    expense: '140.000 IDR',
    labels: ['5/10', '19/10', '2/11', '16/11', '23/11'],
    points: [
      [16, 92],
      [50, 34],
      [84, 58],
      [118, 72],
      [152, 18],
      [186, 74],
      [220, 56],
      [254, 88]
    ]
  },
  {
    income: '7.500.000 IDR',
    expense: '1.240.000 IDR',
    labels: ['1', '7', '14', '21', '28'],
    points: [
      [16, 76],
      [62, 42],
      [108, 56],
      [154, 24],
      [204, 48],
      [254, 62]
    ]
  },
  {
    income: '54.000.000 IDR',
    expense: '14.850.000 IDR',
    labels: ['Jan', 'Apr', 'Jul', 'Oct', 'Dec'],
    points: [
      [16, 66],
      [68, 52],
      [118, 30],
      [168, 44],
      [212, 22],
      [254, 50]
    ]
  }
]);

const INITIAL_TRANSACTIONS = [
  {
    id: 1,
    catId: 'Gaji',
    catEn: 'Salary',
    walletId: 'BCA',
    walletEn: 'BCA',
    typeKey: 'income',
    noteId: 'Gaji bulanan',
    noteEn: 'Monthly salary',
    amount: 3000000
  },
  {
    id: 2,
    catId: 'Hiburan',
    catEn: 'Entertainment',
    walletId: 'DANA',
    walletEn: 'DANA',
    typeKey: 'expense',
    noteId: 'Beli buku catatan',
    noteEn: 'Notebook purchase',
    amount: 65000
  },
  {
    id: 3,
    catId: 'Makan & Minum',
    catEn: 'Food & Drink',
    walletId: 'Tunai',
    walletEn: 'Cash',
    typeKey: 'expense',
    noteId: 'Makan siang nasi padang',
    noteEn: 'Lunch meal',
    amount: 35000
  },
  {
    id: 4,
    catId: 'Transportasi',
    catEn: 'Transport',
    walletId: 'DANA',
    walletEn: 'DANA',
    typeKey: 'expense',
    noteId: 'Transportasi pagi',
    noteEn: 'Morning commute',
    amount: 18000
  },
  {
    id: 5,
    catId: 'Makan & Minum',
    catEn: 'Food & Drink',
    walletId: 'DANA',
    walletEn: 'DANA',
    typeKey: 'expense',
    noteId: 'Kopi susu & roti',
    noteEn: 'Iced coffee & bread',
    amount: 22000
  }
];

const INITIAL_WALLETS = [
  {
    id: 'cash',
    nameId: 'Tunai',
    nameEn: 'Cash',
    typeId: 'Tunai',
    typeEn: 'Cash',
    balance: 370000,
    badgeBg: 'rgba(16, 185, 129, 0.16)',
    badgeColor: '#10B981'
  },
  {
    id: 'bca',
    nameId: 'BCA',
    nameEn: 'BCA',
    typeId: 'Bank',
    typeEn: 'Bank',
    balance: 26700000,
    badgeBg: 'rgba(59, 130, 246, 0.16)',
    badgeColor: '#3B82F6'
  },
  {
    id: 'bri',
    nameId: 'BRI',
    nameEn: 'BRI',
    typeId: 'Bank',
    typeEn: 'Bank',
    balance: 2140000,
    badgeBg: 'rgba(14, 165, 233, 0.16)',
    badgeColor: '#0EA5E9'
  },
  {
    id: 'bni',
    nameId: 'BNI',
    nameEn: 'BNI',
    typeId: 'Bank',
    typeEn: 'Bank',
    balance: 5380000,
    badgeBg: 'rgba(249, 115, 22, 0.16)',
    badgeColor: '#F97316'
  },
  {
    id: 'bsi',
    nameId: 'BSI',
    nameEn: 'BSI',
    typeId: 'Bank',
    typeEn: 'Bank',
    balance: 3500000,
    badgeBg: 'rgba(20, 184, 166, 0.16)',
    badgeColor: '#14B8A6'
  },
  {
    id: 'dana',
    nameId: 'DANA',
    nameEn: 'DANA',
    typeId: 'E-Wallet',
    typeEn: 'E-Wallet',
    balance: 490000,
    badgeBg: 'rgba(139, 92, 246, 0.16)',
    badgeColor: '#8B5CF6'
  }
];

const EXPENSE_CATEGORIES = Object.freeze([
  { id: 'Belanja', en: 'Shopping', color: '#EC4899' },
  { id: 'Hiburan', en: 'Entertainment', color: '#8B5CF6' },
  { id: 'Kesehatan', en: 'Health', color: '#EF4444' },
  { id: 'Makan & Minum', en: 'Food & Drink', color: '#F97316' },
  { id: 'Tagihan & Utilitas', en: 'Bills & Utilities', color: '#EAB308' },
  { id: 'Transportasi', en: 'Transport', color: '#3B82F6' }
]);

const INCOME_CATEGORIES = Object.freeze([
  { id: 'Gaji', en: 'Salary', color: '#10B981' },
  { id: 'Bonus', en: 'Bonus', color: '#0EA5E9' },
  { id: 'Usaha', en: 'Business', color: '#8B5CF6' }
]);

function formatIdr(num) {
  return `${Math.abs(num).toLocaleString('id-ID')} IDR`;
}

// ============================================================================
// 9. DOUBLE BEZEL CARD (SOFT STRUCTURALISM SIGNATURE MOTIF)
// ============================================================================

function DoubleBezelCard({
  tokens,
  children,
  className = '',
  innerClassName = '',
  active = false
}) {
  return (
    <div
      className={`rounded-[22px] p-[4px] transition-all duration-300 ${className}`}
      style={{
        backgroundColor: tokens.surfaceLow,
        border: `1px solid ${active ? 'rgba(16, 185, 129, 0.42)' : tokens.border}`,
        boxShadow: active
          ? '0 12px 28px -14px rgba(16, 185, 129, 0.18)'
          : tokens.shadowCard
      }}
    >
      <div
        className={`rounded-[18px] transition-colors duration-300 ${innerClassName}`}
        style={{ backgroundColor: tokens.surface }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// 10. SMOOTH BEZIER CHART FOR FALLBACK SIMULATOR
// ============================================================================

function buildSmoothPath(points) {
  if (!points || points.length === 0) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const midX = (x0 + x1) / 2;
    d += ` C ${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

function PhoneTrendChart({ tokens, series, instanceId }) {
  const linePath = useMemo(() => buildSmoothPath(series.points), [series]);
  const lastPt = series.points[series.points.length - 1];
  const firstPt = series.points[0];
  const areaPath = `${linePath} L ${lastPt[0]} 100 L ${firstPt[0]} 100 Z`;
  const gradId = `sakuva-grad-${instanceId}-${tokens.mode}`;
  const lineStroke = tokens.mode === 'dark' ? '#CBD5E1' : '#1E293B';

  return (
    <div className="w-full pt-1">
      <svg viewBox="0 0 270 108" className="w-full h-[84px] overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineStroke} stopOpacity="0.26" />
            <stop offset="100%" stopColor={lineStroke} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[24, 50, 76, 100].map((y) => (
          <line
            key={y}
            x1="14"
            y1={y}
            x2="256"
            y2={y}
            stroke={tokens.border}
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={lineStroke}
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        {series.points.map(([x, y], idx) => (
          <circle key={idx} cx={x} cy={y} r="2.6" fill={lineStroke} />
        ))}
      </svg>

      <div
        className="flex items-center justify-between px-1 text-[9.5px] font-medium tabular-nums"
        style={{ color: tokens.textSecondary }}
      >
        {series.labels.map((lbl) => (
          <span key={lbl}>{lbl}</span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 11. RESPONSIVE PHONE MOCKUP (REAL /assets/*.webp + INTERACTIVE FALLBACK)
// ============================================================================

function PhoneMockup({
  tokens,
  lang,
  tScreens,
  tPhone,
  activeScreen,
  onScreenChange,
  onToggleTheme,
  onToggleLang,
  failedImages,
  onImageError,
  isHero = false,
  instanceId = 'hero'
}) {
  const [periodIdx, setPeriodIdx] = useState(1);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [wallets, setWallets] = useState(INITIAL_WALLETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [txModeIdx, setTxModeIdx] = useState(0);
  const [txAmountInput, setTxAmountInput] = useState('4.500.000');
  const [txWalletId, setTxWalletId] = useState('cash');
  const [txCatIdx, setTxCatIdx] = useState(0);
  const [txSaved, setTxSaved] = useState(false);
  const [catTab, setCatTab] = useState('expense');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [backupReminder, setBackupReminder] = useState(true);
  const screenStageRef = useRef(null);

  const imgSrc = ASSETS[tokens.mode]?.[activeScreen] || ASSETS[tokens.mode].dashboard;
  const screenLabel = tScreens[activeScreen] || tScreens.dashboard;
  const isImageFailed = Boolean(failedImages[imgSrc]);

  useEffect(() => {
    const el = screenStageRef.current;
    if (!el || typeof window === 'undefined' || !window.gsap) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    window.gsap.fromTo(
      el,
      { opacity: 0.45, y: 6 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', overwrite: true }
    );
  }, [activeScreen, tokens.mode]);

  const totalBalance = useMemo(
    () => wallets.reduce((acc, w) => acc + w.balance, 0),
    [wallets]
  );

  const hasActiveFilter = searchQuery.trim() !== '' || typeFilter !== 'all';

  const resetHistoryFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.typeKey !== typeFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const haystack =
          `${tx.catId} ${tx.catEn} ${tx.walletId} ${tx.walletEn} ${tx.noteId} ${tx.noteEn}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, searchQuery]);

  const handleSaveTx = () => {
    const numeric = parseInt(txAmountInput.replace(/\D/g, ''), 10) || 45000;
    const isIncome = txModeIdx === 0;
    const chosenWallet = wallets.find((w) => w.id === txWalletId) || wallets[0];
    const chosenCat = EXPENSE_CATEGORIES[txCatIdx] || EXPENSE_CATEGORIES[0];

    const newEntry = {
      id: Date.now(),
      catId: isIncome ? 'Gaji' : chosenCat.id,
      catEn: isIncome ? 'Salary' : chosenCat.en,
      walletId: chosenWallet.nameId,
      walletEn: chosenWallet.nameEn,
      typeKey: isIncome ? 'income' : 'expense',
      noteId: isIncome ? 'Gaji bulanan' : 'Catatan cepat',
      noteEn: isIncome ? 'Monthly salary' : 'Quick note',
      amount: numeric
    };

    setTransactions((prev) => [newEntry, ...prev]);
    setWallets((prev) =>
      prev.map((w) =>
        w.id === chosenWallet.id
          ? { ...w, balance: Math.max(0, w.balance + (isIncome ? numeric : -numeric)) }
          : w
      )
    );
    setTxSaved(true);
    setTimeout(() => {
      setTxSaved(false);
      onScreenChange('history');
    }, 600);
  };

  const series = PERIOD_SERIES[periodIdx];
  const visibleCategories =
    catTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="relative mx-auto w-[272px] sm:w-[308px] md:w-[324px] max-w-full">
      <div
        className="relative rounded-[42px] sm:rounded-[44px] p-[9px] sm:p-[10px] transition-all duration-300"
        style={{
          backgroundColor: '#1E293B',
          boxShadow:
            tokens.mode === 'dark'
              ? '0 32px 72px -16px rgba(2, 6, 23, 0.88), inset 0 1px 1px rgba(255,255,255,0.16)'
              : '0 32px 68px -18px rgba(15, 23, 42, 0.28), inset 0 1px 1px rgba(255,255,255,0.22)'
        }}
      >
        <div
          ref={screenStageRef}
          className="relative rounded-[34px] sm:rounded-[35px] overflow-hidden flex flex-col h-[572px] sm:h-[624px]"
          style={{
            backgroundColor: tokens.bg,
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {!isImageFailed ? (
            <img
              key={imgSrc}
              src={imgSrc}
              width={360}
              height={780}
              alt={`Sakuva ${screenLabel}`}
              {...(isHero ? { fetchPriority: 'high' } : { loading: 'lazy' })}
              onError={() => onImageError(imgSrc)}
              className="w-full h-full object-cover object-top block"
            />
          ) : (
            <>
              <div
                className="px-4 sm:px-5 pt-2.5 pb-1.5 flex items-center justify-between text-[11px] font-semibold tabular-nums shrink-0"
                style={{ backgroundColor: tokens.bg, color: tokens.textPrimary }}
              >
                <span>4:15</span>
                <div className="w-3.5 h-3.5 rounded-full bg-black/90 border border-white/10" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div
                    className="w-4 h-2.5 rounded-[3px] p-[1.5px] flex items-center"
                    style={{ border: `1px solid ${tokens.textPrimary}` }}
                  >
                    <div
                      className="w-full h-full rounded-[1px]"
                      style={{ backgroundColor: tokens.textPrimary }}
                    />
                  </div>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto px-3 sm:px-3.5 pt-1 pb-20 space-y-2.5 sm:space-y-3 select-none"
                style={{
                  backgroundColor: tokens.bg,
                  color: tokens.textPrimary,
                  scrollbarWidth: 'none'
                }}
              >
                {activeScreen === 'dashboard' && (
                  <>
                    <div className="pt-0.5 flex items-center justify-between">
                      <p className="text-[18px] sm:text-[19px] font-bold tracking-tight">
                        {tScreens.dashboard}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
                        style={{
                          backgroundColor: tokens.emeraldBg,
                          color: tokens.emeraldText
                        }}
                      >
                        100% Offline
                      </span>
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div
                        className="rounded-[15px] p-3 sm:p-3.5"
                        style={{ backgroundColor: tokens.surface }}
                      >
                        <p className="text-[11px] font-medium" style={{ color: tokens.textSecondary }}>
                          {tPhone.totalBalance}
                        </p>
                        <p className="text-[17.5px] sm:text-[19px] font-bold tracking-tight tabular-nums mt-0.5">
                          {formatIdr(totalBalance)}
                        </p>
                        <div className="my-2 h-px w-full" style={{ backgroundColor: tokens.border }} />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px]" style={{ color: tokens.textSecondary }}>
                              {tPhone.income}
                            </p>
                            <p className="text-[11px] sm:text-[11.5px] font-semibold tabular-nums mt-0.5" style={{ color: tokens.emeraldText }}>
                              {series.income}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px]" style={{ color: tokens.textSecondary }}>
                              {tPhone.expense}
                            </p>
                            <p className="text-[11px] sm:text-[11.5px] font-semibold tabular-nums mt-0.5" style={{ color: tokens.expense }}>
                              {series.expense}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {tPhone.periods.map((lbl, idx) => {
                        const active = periodIdx === idx;
                        return (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setPeriodIdx(idx)}
                            className="min-h-[34px] px-1 rounded-[9px] text-[10px] font-semibold transition-colors text-center"
                            style={{
                              backgroundColor: active ? tokens.phoneActivePill : 'transparent',
                              color: active ? tokens.textPrimary : tokens.textSecondary,
                              border: `1px solid ${active ? 'transparent' : tokens.borderStrong}`
                            }}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div className="rounded-[15px] p-3" style={{ backgroundColor: tokens.surface }}>
                        <p className="text-[12px] font-semibold">{tPhone.spendingTrend}</p>
                        <PhoneTrendChart tokens={tokens} series={series} instanceId={instanceId} />
                      </div>
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div className="rounded-[15px] p-3 space-y-2" style={{ backgroundColor: tokens.surface }}>
                        <p className="text-[11.5px] font-semibold">{tPhone.topCategories}</p>
                        {[
                          { nameId: 'Hiburan', nameEn: 'Entertainment', amt: '65.000 IDR', pct: '46%', color: '#8B5CF6' },
                          { nameId: 'Makan & Minum', nameEn: 'Food & Drink', amt: '57.000 IDR', pct: '40%', color: '#F97316' }
                        ].map((row) => (
                          <div key={row.nameId} className="space-y-1">
                            <div className="flex items-center justify-between text-[10.5px]">
                              <span className="flex items-center gap-1.5 font-medium">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                                {lang === 'id' ? row.nameId : row.nameEn}
                              </span>
                              <span className="font-semibold tabular-nums">{row.amt}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: tokens.surfaceLow }}>
                              <div className="h-full rounded-full" style={{ width: row.pct, backgroundColor: row.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeScreen === 'history' && (
                  <>
                    <div className="pt-0.5 flex items-center justify-between">
                      <p className="text-[18px] sm:text-[19px] font-bold tracking-tight">{tScreens.history}</p>
                      <span className="text-[10.5px] font-semibold tabular-nums" style={{ color: tokens.textSecondary }}>
                        Nov 2026
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2 px-3 min-h-[38px] rounded-[12px]"
                      style={{
                        backgroundColor: tokens.surface,
                        border: `1px solid ${tokens.borderStrong}`
                      }}
                    >
                      <IconSearch className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tPhone.searchPlaceholder}
                        aria-label={tPhone.searchPlaceholder}
                        className="w-full bg-transparent text-[11px] focus:outline-none"
                        style={{ color: tokens.textPrimary }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[
                        { key: 'all', label: tPhone.filterAll },
                        { key: 'income', label: tPhone.filterIncome },
                        { key: 'expense', label: tPhone.filterExpense }
                      ].map((pill) => {
                        const active = typeFilter === pill.key;
                        return (
                          <button
                            key={pill.key}
                            type="button"
                            onClick={() => setTypeFilter(pill.key)}
                            className="px-2.5 min-h-[32px] rounded-[9px] text-[10px] font-semibold transition-colors"
                            style={{
                              backgroundColor: active ? tokens.emeraldBg : 'transparent',
                              color: active ? tokens.emeraldText : tokens.textSecondary,
                              border: `1px solid ${active ? 'rgba(16,185,129,0.35)' : tokens.borderStrong}`
                            }}
                          >
                            {pill.label}
                          </button>
                        );
                      })}
                    </div>

                    {hasActiveFilter && (
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] tabular-nums" style={{ color: tokens.textSecondary }}>
                          {filteredTransactions.length} item
                        </span>
                        <button
                          type="button"
                          onClick={resetHistoryFilters}
                          className="text-[10.5px] font-bold underline underline-offset-2 min-h-[32px]"
                          style={{ color: tokens.emeraldText }}
                        >
                          {tPhone.clearFilters}
                        </button>
                      </div>
                    )}

                    {filteredTransactions.length === 0 ? (
                      <div
                        className="rounded-[16px] p-4 text-center space-y-2"
                        style={{
                          backgroundColor: tokens.surface,
                          border: `1px solid ${tokens.border}`
                        }}
                      >
                        <p className="text-[11.5px] font-semibold">{tPhone.emptyHistoryTitle}</p>
                        <p className="text-[10px] leading-relaxed" style={{ color: tokens.textSecondary }}>
                          {tPhone.emptyHistorySub}
                        </p>
                        <button
                          type="button"
                          onClick={resetHistoryFilters}
                          className="mt-1 px-3.5 min-h-[34px] rounded-full text-[10.5px] font-semibold text-white"
                          style={{ backgroundColor: tokens.emerald }}
                        >
                          {tPhone.clearFilters}
                        </button>
                      </div>
                    ) : (
                      <div
                        className="rounded-[18px] p-[3px]"
                        style={{
                          backgroundColor: tokens.surfaceLow,
                          border: `1px solid ${tokens.border}`
                        }}
                      >
                        <div
                          className="rounded-[15px] divide-y"
                          style={{
                            backgroundColor: tokens.surface,
                            borderColor: tokens.border
                          }}
                        >
                          {filteredTransactions.map((tx) => (
                            <div key={tx.id} className="px-3 py-2 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold truncate">
                                  {lang === 'id' ? tx.catId : tx.catEn}
                                </p>
                                <p className="text-[9.5px] truncate" style={{ color: tokens.textSecondary }}>
                                  {lang === 'id' ? tx.walletId : tx.walletEn} ·{' '}
                                  {lang === 'id' ? tx.noteId : tx.noteEn}
                                </p>
                              </div>
                              <span
                                className="text-[10.5px] font-semibold tabular-nums shrink-0"
                                style={{
                                  color: tx.typeKey === 'income' ? tokens.emeraldText : tokens.expense
                                }}
                              >
                                {tx.typeKey === 'income' ? '+' : '-'}
                                {formatIdr(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeScreen === 'wallets' && (
                  <>
                    <div className="pt-0.5">
                      <p className="text-[18px] sm:text-[19px] font-bold tracking-tight">{tScreens.wallets}</p>
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div className="rounded-[15px] p-3" style={{ backgroundColor: tokens.surface }}>
                        <p className="text-[10px]" style={{ color: tokens.textSecondary }}>
                          {tPhone.activeWalletTotal}
                        </p>
                        <p className="text-[17.5px] sm:text-[18.5px] font-bold tabular-nums mt-0.5">
                          {formatIdr(totalBalance)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {wallets.map((w) => (
                        <div
                          key={w.id}
                          className="rounded-[16px] p-[3px]"
                          style={{
                            backgroundColor: tokens.surfaceLow,
                            border: `1px solid ${tokens.border}`
                          }}
                        >
                          <div
                            className="rounded-[13px] px-2.5 py-2 flex items-center justify-between"
                            style={{ backgroundColor: tokens.surface }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: w.badgeBg, color: w.badgeColor }}
                              >
                                <IconWallet className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold">
                                  {lang === 'id' ? w.nameId : w.nameEn}
                                </p>
                                <p className="text-[9px]" style={{ color: tokens.textSecondary }}>
                                  {lang === 'id' ? w.typeId : w.typeEn}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10.5px] font-semibold tabular-nums">
                              {formatIdr(w.balance)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeScreen === 'transaction' && (
                  <>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => onScreenChange('dashboard')}
                        aria-label={tScreens.dashboard}
                        className="p-1.5 rounded-lg"
                      >
                        <IconArrowLeft className="w-4 h-4" />
                      </button>
                      <p className="text-[16px] sm:text-[17px] font-bold tracking-tight">{tPhone.newTxTitle}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {tPhone.txModes.map((modeLbl, idx) => {
                        const active = txModeIdx === idx;
                        return (
                          <button
                            key={modeLbl}
                            type="button"
                            onClick={() => setTxModeIdx(idx)}
                            className="min-h-[32px] rounded-[9px] text-[9.5px] font-semibold text-center"
                            style={{
                              backgroundColor: active ? tokens.phoneActivePill : 'transparent',
                              color: active ? tokens.textPrimary : tokens.textSecondary,
                              border: `1px solid ${active ? 'transparent' : tokens.borderStrong}`
                            }}
                          >
                            {modeLbl}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="rounded-[12px] px-3 py-2"
                      style={{
                        backgroundColor: tokens.surface,
                        border: `1px solid ${tokens.borderStrong}`
                      }}
                    >
                      <label
                        htmlFor={`sim-amount-${instanceId}`}
                        className="text-[9.5px] block"
                        style={{ color: tokens.textSecondary }}
                      >
                        {tPhone.amountLabel}
                      </label>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11.5px] font-semibold" style={{ color: tokens.textSecondary }}>
                          IDR
                        </span>
                        <input
                          id={`sim-amount-${instanceId}`}
                          type="text"
                          value={txAmountInput}
                          onChange={(e) => setTxAmountInput(e.target.value)}
                          className="w-full bg-transparent text-[14px] font-bold tabular-nums focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-medium px-0.5" style={{ color: tokens.textSecondary }}>
                        {tPhone.walletLabel}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {wallets.slice(0, 3).map((w) => {
                          const selected = txWalletId === w.id;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => setTxWalletId(w.id)}
                              className="px-2 min-h-[32px] rounded-[10px] text-[10px] font-semibold truncate"
                              style={{
                                backgroundColor: selected ? tokens.phoneActivePill : tokens.surface,
                                border: `1px solid ${selected ? tokens.emerald : tokens.border}`
                              }}
                            >
                              {lang === 'id' ? w.nameId : w.nameEn}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-0.5">
                        <p className="text-[10px] font-medium" style={{ color: tokens.textSecondary }}>
                          {tPhone.categoryLabel}
                        </p>
                        <button
                          type="button"
                          onClick={() => onScreenChange('category')}
                          className="text-[9.5px] font-semibold"
                          style={{ color: tokens.emeraldText }}
                        >
                          + {tPhone.manageCategory}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {EXPENSE_CATEGORIES.slice(0, 4).map((cat, idx) => {
                          const selected = txCatIdx === idx;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setTxCatIdx(idx)}
                              className="px-2 min-h-[34px] rounded-[10px] text-[10px] font-medium flex items-center gap-1.5 truncate"
                              style={{
                                backgroundColor: selected ? tokens.phoneActivePill : tokens.surface,
                                border: `1px solid ${selected ? tokens.emerald : tokens.border}`
                              }}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="truncate">{lang === 'id' ? cat.id : cat.en}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveTx}
                      className="w-full min-h-[38px] rounded-full text-[11px] font-semibold flex items-center justify-center gap-1.5 text-white"
                      style={{ backgroundColor: tokens.emerald }}
                    >
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>{txSaved ? tPhone.savedTx : tPhone.saveTx}</span>
                    </button>
                  </>
                )}

                {activeScreen === 'category' && (
                  <>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => onScreenChange('settings')}
                        aria-label={tScreens.settings}
                        className="p-1.5 rounded-lg"
                      >
                        <IconArrowLeft className="w-4 h-4" />
                      </button>
                      <p className="text-[16px] sm:text-[17px] font-bold tracking-tight">{tPhone.manageCategory}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCatTab('income')}
                        className="min-h-[32px] rounded-[9px] text-[10px] font-semibold"
                        style={{
                          backgroundColor: catTab === 'income' ? tokens.phoneActivePill : 'transparent',
                          border: `1px solid ${catTab === 'income' ? 'transparent' : tokens.borderStrong}`
                        }}
                      >
                        {tPhone.income}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatTab('expense')}
                        className="min-h-[32px] rounded-[9px] text-[10px] font-semibold"
                        style={{
                          backgroundColor: catTab === 'expense' ? tokens.phoneActivePill : 'transparent',
                          border: `1px solid ${catTab === 'expense' ? 'transparent' : tokens.borderStrong}`
                        }}
                      >
                        {tPhone.expense}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {visibleCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="rounded-[16px] p-[3px]"
                          style={{
                            backgroundColor: tokens.surfaceLow,
                            border: `1px solid ${tokens.border}`
                          }}
                        >
                          <div
                            className="rounded-[13px] px-3 py-2 flex items-center gap-2.5"
                            style={{ backgroundColor: tokens.surface }}
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <div>
                              <p className="text-[11px] font-semibold">
                                {lang === 'id' ? cat.id : cat.en}
                              </p>
                              <p className="text-[9px]" style={{ color: tokens.textSecondary }}>
                                {tPhone.defaultLabel}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeScreen === 'data' && (
                  <>
                    <div className="pt-0.5">
                      <p className="text-[18px] sm:text-[19px] font-bold tracking-tight">{tPhone.dataMgmt}</p>
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div className="rounded-[15px] p-3 space-y-2.5" style={{ backgroundColor: tokens.surface }}>
                        {[
                          { label: tPhone.backupJson, danger: false },
                          { label: tPhone.restoreJson, danger: false },
                          { label: tPhone.exportCsv, danger: false },
                          { label: tPhone.manageCategory, danger: false },
                          { label: tPhone.resetData, danger: true }
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between text-[10.5px] pb-2 last:pb-0"
                            style={{ borderBottom: `1px solid ${tokens.border}` }}
                          >
                            <span
                              className="flex items-center gap-2 font-semibold"
                              style={{ color: row.danger ? tokens.expense : tokens.textPrimary }}
                            >
                              <IconDatabase className="w-3.5 h-3.5 opacity-75 shrink-0" />
                              {row.label}
                            </span>
                            <IconChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeScreen === 'settings' && (
                  <>
                    <div className="pt-0.5">
                      <p className="text-[18px] sm:text-[19px] font-bold tracking-tight">{tScreens.settings}</p>
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div className="rounded-[15px] p-3 space-y-2.5" style={{ backgroundColor: tokens.surface }}>
                        <p className="text-[11.5px] font-semibold">{tPhone.appearance}</p>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px]" style={{ color: tokens.textSecondary }}>
                            {tPhone.themeLabel}
                          </span>
                          <div className="inline-flex rounded-full p-0.5" style={{ backgroundColor: tokens.surfaceLow }}>
                            <button
                              type="button"
                              onClick={() => onToggleTheme('light')}
                              className="px-2.5 min-h-[28px] rounded-full text-[9.5px] font-semibold"
                              style={{
                                backgroundColor: tokens.mode === 'light' ? tokens.surface : 'transparent'
                              }}
                            >
                              Light
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleTheme('dark')}
                              className="px-2.5 min-h-[28px] rounded-full text-[9.5px] font-semibold"
                              style={{
                                backgroundColor: tokens.mode === 'dark' ? tokens.surface : 'transparent'
                              }}
                            >
                              Dark
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px]" style={{ color: tokens.textSecondary }}>
                            {tPhone.langLabel}
                          </span>
                          <div className="inline-flex rounded-full p-0.5" style={{ backgroundColor: tokens.surfaceLow }}>
                            <button
                              type="button"
                              onClick={() => onToggleLang('id')}
                              className="px-2.5 min-h-[28px] rounded-full text-[9.5px] font-semibold"
                              style={{
                                backgroundColor: lang === 'id' ? tokens.surface : 'transparent'
                              }}
                            >
                              ID
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleLang('en')}
                              className="px-2.5 min-h-[28px] rounded-full text-[9.5px] font-semibold"
                              style={{
                                backgroundColor: lang === 'en' ? tokens.surface : 'transparent'
                              }}
                            >
                              EN
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div className="rounded-[15px] p-3 space-y-2" style={{ backgroundColor: tokens.surface }}>
                        <p className="text-[11.5px] font-semibold">{tPhone.dataMgmt}</p>
                        {[tPhone.backupJson, tPhone.restoreJson, tPhone.exportCsv].map((label) => (
                          <div key={label} className="flex items-center justify-between text-[10.5px]">
                            <span className="flex items-center gap-2 font-medium">
                              <IconDatabase className="w-3.5 h-3.5 opacity-70" />
                              {label}
                            </span>
                            <IconChevronRight className="w-3.5 h-3.5 opacity-50" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeScreen === 'reminder' && (
                  <>
                    <div className="pt-0.5">
                      <p className="text-[18px] sm:text-[19px] font-bold tracking-tight">{tScreens.reminder}</p>
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div className="rounded-[15px] p-3 space-y-2.5" style={{ backgroundColor: tokens.surface }}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold flex items-center gap-1.5">
                              <IconBell className="w-3.5 h-3.5" />
                              {tPhone.dailyReminder}
                            </p>
                            <p className="text-[9.5px] mt-0.5" style={{ color: tokens.textSecondary }}>
                              {tPhone.dailyReminderSub}
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={dailyReminder}
                            aria-label={tPhone.dailyReminder}
                            onClick={() => setDailyReminder((v) => !v)}
                            className="w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0"
                            style={{
                              backgroundColor: dailyReminder ? tokens.emerald : tokens.surfacePill,
                              justifyContent: dailyReminder ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <span className="w-4 h-4 rounded-full bg-white block" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] pt-1" style={{ borderTop: `1px solid ${tokens.border}` }}>
                          <span style={{ color: tokens.textSecondary }}>{tPhone.timeLabel}</span>
                          <span className="font-semibold tabular-nums">20:00</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2" style={{ borderTop: `1px solid ${tokens.border}` }}>
                          <div>
                            <p className="text-[11px] font-semibold">{tPhone.backupReminder}</p>
                            <p className="text-[9.5px] mt-0.5" style={{ color: tokens.textSecondary }}>
                              {tPhone.backupReminderSub}
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={backupReminder}
                            aria-label={tPhone.backupReminder}
                            onClick={() => setBackupReminder((v) => !v)}
                            className="w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0"
                            style={{
                              backgroundColor: backupReminder ? tokens.emerald : tokens.surfacePill,
                              justifyContent: backupReminder ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <span className="w-4 h-4 rounded-full bg-white block" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      className="rounded-[18px] p-[3px]"
                      style={{
                        backgroundColor: tokens.surfaceLow,
                        border: `1px solid ${tokens.border}`
                      }}
                    >
                      <div className="rounded-[15px] p-3 space-y-1" style={{ backgroundColor: tokens.surface }}>
                        <p className="text-[11.5px] font-semibold">{tPhone.aboutLabel}</p>
                        <p className="text-[10.5px]" style={{ color: tokens.textSecondary }}>
                          {tPhone.appVersionLabel}: <span className="font-semibold tabular-nums">1.1.0</span>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div
                className="absolute bottom-0 inset-x-0 px-1 pt-1.5 pb-2 grid grid-cols-5 items-end"
                style={{
                  backgroundColor: tokens.phoneNavBg,
                  borderTop: `1px solid ${tokens.border}`
                }}
              >
                <button
                  type="button"
                  onClick={() => onScreenChange('dashboard')}
                  className="flex flex-col items-center gap-0.5 py-0.5"
                >
                  <div
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: activeScreen === 'dashboard' ? tokens.phoneActivePill : 'transparent'
                    }}
                  >
                    <IconDashboard className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8.5px] font-medium truncate max-w-full">
                    {tScreens.dashboard}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onScreenChange('history')}
                  className="flex flex-col items-center gap-0.5 py-0.5"
                >
                  <div
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: activeScreen === 'history' ? tokens.phoneActivePill : 'transparent'
                    }}
                  >
                    <IconList className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8.5px] font-medium truncate max-w-full">
                    {tScreens.history}
                  </span>
                </button>

                <div className="flex flex-col items-center justify-center -mt-3">
                  <button
                    type="button"
                    onClick={() => onScreenChange('transaction')}
                    aria-label={tPhone.newTxTitle}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: tokens.emerald }}
                  >
                    <IconPlus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onScreenChange('wallets')}
                  className="flex flex-col items-center gap-0.5 py-0.5"
                >
                  <div
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: activeScreen === 'wallets' ? tokens.phoneActivePill : 'transparent'
                    }}
                  >
                    <IconWallet className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8.5px] font-medium truncate max-w-full">
                    {tScreens.wallets}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onScreenChange('settings')}
                  className="flex flex-col items-center gap-0.5 py-0.5"
                >
                  <div
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        activeScreen === 'settings' || activeScreen === 'data' || activeScreen === 'reminder'
                          ? tokens.phoneActivePill
                          : 'transparent'
                    }}
                  >
                    <IconSettings className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8.5px] font-medium truncate max-w-full">
                    {tScreens.settings}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 12. PARITY PREVIEW CARD (/assets/beranda.webp & /assets/beranda_dark.webp)
// ============================================================================

function ParityPreviewCard({
  mode,
  isActive,
  title,
  desc,
  buttonLabel,
  activeBadge,
  balanceLabel,
  onSelect,
  failedImages,
  onImageError
}) {
  const cardTokens = THEME_TOKENS[mode];
  const imgSrc = ASSETS[mode].dashboard;
  const isImageFailed = Boolean(failedImages[imgSrc]);

  return (
    <div
      className="gsap-reveal rounded-[24px] p-5 sm:p-7 flex flex-col justify-between gap-6 transition-all"
      style={{
        backgroundColor: cardTokens.bg,
        color: cardTokens.textPrimary,
        border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.45)' : cardTokens.borderStrong}`
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {mode === 'light' ? (
              <IconSun className="w-4 h-4 text-amber-500" />
            ) : (
              <IconMoon className="w-4 h-4 text-emerald-400" />
            )}
            <h3 className="text-[16px] sm:text-[17px] font-bold">{title}</h3>
          </div>
          {isActive && (
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: cardTokens.emeraldBg,
                color: cardTokens.emeraldText
              }}
            >
              {activeBadge}
            </span>
          )}
        </div>

        <p className="text-[13.5px] leading-relaxed" style={{ color: cardTokens.textSecondary }}>
          {desc}
        </p>

        <div
          className="rounded-[20px] p-[4px] overflow-hidden"
          style={{
            backgroundColor: cardTokens.surfaceLow,
            border: `1px solid ${cardTokens.border}`
          }}
        >
          {!isImageFailed ? (
            <div className="rounded-[16px] overflow-hidden h-[210px] sm:h-[220px] bg-black/5">
              <img
                src={imgSrc}
                width={360}
                height={780}
                alt={`Sakuva ${title}`}
                loading="lazy"
                onError={() => onImageError(imgSrc)}
                className="w-full h-full object-cover object-top block"
              />
            </div>
          ) : (
            <div className="rounded-[16px] p-4 space-y-3" style={{ backgroundColor: cardTokens.surface }}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium" style={{ color: cardTokens.textSecondary }}>
                    {balanceLabel}
                  </p>
                  <p className="text-[17px] sm:text-[19px] font-extrabold tabular-nums mt-0.5">
                    38.580.000 IDR
                  </p>
                </div>
                <span
                  className="text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-lg shrink-0"
                  style={{
                    backgroundColor: cardTokens.emeraldBg,
                    color: cardTokens.emeraldText
                  }}
                >
                  +3.000.000 IDR
                </span>
              </div>
              <div className="h-px w-full" style={{ backgroundColor: cardTokens.border }} />
              <div className="flex items-center justify-between text-[11.5px] tabular-nums">
                <span style={{ color: cardTokens.emeraldText }}>3.000.000 IDR</span>
                <span style={{ color: cardTokens.expense }}>140.000 IDR</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="w-full sm:w-auto sm:self-start px-5 min-h-[44px] rounded-full text-[13px] font-semibold transition-colors"
        style={{
          backgroundColor: isActive ? cardTokens.emerald : cardTokens.surface,
          color: isActive ? '#FFFFFF' : cardTokens.textPrimary,
          border: `1px solid ${isActive ? cardTokens.emerald : cardTokens.borderStrong}`
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// ============================================================================
// 13. MAIN APP COMPONENT
// ============================================================================

export default function App() {
  const [themeMode, setThemeMode] = useState(() =>
    readSafeEnumStorage('sakuva_theme', ['light', 'dark'], 'light')
  );
  const [lang, setLang] = useState(() =>
    readSafeEnumStorage('sakuva_lang', ['id', 'en'], 'id')
  );
  const [heroScreen, setHeroScreen] = useState('dashboard');
  const [walkthroughScreen, setWalkthroughScreen] = useState('dashboard');
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [gsapReady, setGsapReady] = useState(false);

  const rootRef = useRef(null);
  const heroHeadlineRef = useRef(null);
  const heroSubtitleRef = useRef(null);
  const heroCtasRef = useRef(null);
  const heroWatermarkRef = useRef(null);
  const heroPhoneRef = useRef(null);
  const walkthroughSectionRef = useRef(null);
  const stickyPhoneRef = useRef(null);
  const progressRailRef = useRef(null);
  const chapterRefs = useRef([]);
  const mobileMenuBtnRef = useRef(null);

  const handleImageError = useCallback((src) => {
    setFailedImages((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }, []);

  const handleThemeChange = useCallback((nextMode) => {
    setThemeMode(nextMode);
    writeSafeEnumStorage('sakuva_theme', nextMode, ['light', 'dark']);
  }, []);

  const handleLangChange = useCallback((nextLang) => {
    setLang(nextLang);
    writeSafeEnumStorage('sakuva_lang', nextLang, ['id', 'en']);
  }, []);

  const tokens = THEME_TOKENS[themeMode];
  const t = COPY[lang];

  useEffect(() => {
    const fontId = 'sakuva-plus-jakarta-font';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initGsap() {
      try {
        await loadVerifiedScript('sakuva-gsap-core', GSAP_SCRIPT_URL);
        await loadVerifiedScript('sakuva-gsap-st', SCROLLTRIGGER_SCRIPT_URL);
        if (cancelled) return;
        if (window.gsap && window.ScrollTrigger) {
          if (!window.__sakuvaScrollTriggerRegistered) {
            window.gsap.registerPlugin(window.ScrollTrigger);
            window.__sakuvaScrollTriggerRegistered = true;
          }
          setGsapReady(true);
        }
      } catch {
        // Fallback scroll observer still operates seamlessly
      }
    }

    initGsap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        requestAnimationFrame(() => {
          mobileMenuBtnRef.current?.focus();
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!gsapReady || !window.gsap || !window.ScrollTrigger) return;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        isMobile: '(max-width: 1023px)',
        reduceMotion: '(prefers-reduced-motion: reduce)'
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions;

        if (!reduceMotion) {
          const heroTargets = [
            heroHeadlineRef.current,
            heroSubtitleRef.current,
            heroCtasRef.current,
            heroPhoneRef.current
          ].filter(Boolean);

          gsap.fromTo(
            heroTargets,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: 'power3.out',
              clearProps: 'transform'
            }
          );

          if (heroWatermarkRef.current) {
            gsap.to(heroWatermarkRef.current, {
              y: isDesktop ? 55 : 28,
              ease: 'none',
              scrollTrigger: {
                trigger: heroWatermarkRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2
              }
            });
          }

          if (heroPhoneRef.current && isDesktop) {
            gsap.to(heroPhoneRef.current, {
              y: -22,
              ease: 'none',
              scrollTrigger: {
                trigger: heroPhoneRef.current,
                start: 'top 80%',
                end: 'bottom top',
                scrub: 1
              }
            });
          }
        }

        if (walkthroughSectionRef.current) {
          if (progressRailRef.current && isDesktop && !reduceMotion) {
            gsap.fromTo(
              progressRailRef.current,
              { scaleY: 0 },
              {
                scaleY: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: walkthroughSectionRef.current,
                  start: 'top 25%',
                  end: 'bottom 75%',
                  scrub: 0.6
                }
              }
            );
          }

          if (stickyPhoneRef.current && isDesktop && !reduceMotion) {
            gsap.fromTo(
              stickyPhoneRef.current,
              { y: 12 },
              {
                y: -12,
                ease: 'none',
                scrollTrigger: {
                  trigger: walkthroughSectionRef.current,
                  start: 'top 30%',
                  end: 'bottom 70%',
                  scrub: 0.8
                }
              }
            );
          }

          chapterRefs.current.forEach((el, idx) => {
            if (!el) return;
            ScrollTrigger.create({
              trigger: el,
              start: isDesktop ? 'top 52%' : 'top 62%',
              end: isDesktop ? 'bottom 48%' : 'bottom 38%',
              onEnter: () => {
                setActiveChapterIdx(idx);
                const nextScreen = COPY.id.walkthrough.chapters[idx]?.screen;
                if (nextScreen) setWalkthroughScreen(nextScreen);
              },
              onEnterBack: () => {
                setActiveChapterIdx(idx);
                const nextScreen = COPY.id.walkthrough.chapters[idx]?.screen;
                if (nextScreen) setWalkthroughScreen(nextScreen);
              }
            });
          });
        }

        if (!reduceMotion) {
          const revealNodes = gsap.utils.toArray('.gsap-reveal');
          if (revealNodes.length > 0) {
            gsap.set(revealNodes, { opacity: 0, y: 22 });
            ScrollTrigger.batch(revealNodes, {
              start: 'top 88%',
              once: true,
              onEnter: (batch) => {
                gsap.to(batch, {
                  opacity: 1,
                  y: 0,
                  duration: 0.65,
                  stagger: 0.08,
                  ease: 'power2.out',
                  clearProps: 'transform'
                });
              }
            });
          }
        }
      },
      rootRef
    );

    return () => {
      mm.revert();
    };
  }, [gsapReady]);

  useEffect(() => {
    if (gsapReady) return;
    const syncChapterFromScroll = () => {
      const viewportCenter = window.innerHeight * 0.48;
      let closestIdx = -1;
      let minDist = Infinity;

      chapterRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom >= 80 && rect.top <= window.innerHeight - 80) {
          const elCenter = rect.top + rect.height / 2;
          const dist = Math.abs(elCenter - viewportCenter);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        }
      });

      if (closestIdx !== -1) {
        setActiveChapterIdx((prevIdx) => {
          if (prevIdx !== closestIdx) {
            const nextScreen = COPY.id.walkthrough.chapters[closestIdx]?.screen;
            if (nextScreen) setWalkthroughScreen(nextScreen);
          }
          return closestIdx;
        });
      }
    };

    window.addEventListener('scroll', syncChapterFromScroll, { passive: true });
    return () => window.removeEventListener('scroll', syncChapterFromScroll);
  }, [gsapReady]);

  useEffect(() => {
    if (!gsapReady || !window.ScrollTrigger) return;
    const timer = setTimeout(() => {
      window.ScrollTrigger.refresh();
    }, 120);
    return () => clearTimeout(timer);
  }, [gsapReady, lang, themeMode, openFaqIndex, failedImages]);

  const navLinks = [
    { href: '#fitur', label: t.nav.features },
    { href: '#tentang', label: t.nav.about },
    { href: '#faq', label: t.nav.faq },
    { href: '#contact', label: t.nav.contact }
  ];

  const heroScreenTabs = [
    { key: 'dashboard', label: t.screens.dashboard },
    { key: 'history', label: t.screens.history },
    { key: 'wallets', label: t.screens.wallets },
    { key: 'settings', label: t.screens.settings }
  ];

  const resolvedHeroScreen =
    heroScreen === 'transaction' ? 'dashboard' : heroScreen;

  const handleSelectChapter = (idx, screenKey, shouldScroll = false) => {
    setActiveChapterIdx(idx);
    setWalkthroughScreen(screenKey);
    if (shouldScroll && chapterRefs.current[idx]) {
      chapterRefs.current[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const activeChapter =
    t.walkthrough.chapters[activeChapterIdx] || t.walkthrough.chapters[0];

  return (
    <div
      id="top"
      ref={rootRef}
      className="min-h-screen relative overflow-x-clip transition-colors duration-300 antialiased selection:bg-emerald-500/20"
      style={{
        backgroundColor: tokens.bg,
        color: tokens.textPrimary,
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <style>{`
        html { scroll-behavior: smooth; }
        button, a, [role="button"], [role="switch"] { cursor: pointer; }
        button:focus-visible, a:focus-visible, input:focus-visible {
          outline: 2px solid #10B981;
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-3 focus:rounded-full focus:text-[13px] focus:font-semibold focus:text-white"
        style={{ backgroundColor: tokens.emerald }}
      >
        {t.skipToContent}
      </a>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-[680px] sm:h-[740px] z-0"
        style={{
          background: `radial-gradient(66% 52% at 50% 0%, ${tokens.emeraldGlowStart} 0%, ${tokens.emeraldGlowMid} 42%, transparent 74%)`
        }}
      />

      {mobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]"
        />
      )}

      <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] max-w-5xl">
        <nav
          aria-label="Primary navigation"
          className="w-full rounded-full px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 backdrop-blur-md transition-all duration-300"
          style={{
            backgroundColor: tokens.navBg,
            border: `1px solid ${tokens.border}`,
            boxShadow: tokens.navShadow
          }}
        >
          <a
            href="#top"
            className="flex items-center gap-2 pl-1 min-h-[44px] rounded-full shrink-0"
          >
            <BrandIcon
              dark={themeMode === 'dark'}
              size={28}
              failedImages={failedImages}
              onImageError={handleImageError}
            />
            <span className="text-[16px] sm:text-[18px] font-extrabold tracking-tight">
              Sakuva
            </span>
            <span
              className="hidden min-[380px]:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums"
              style={{
                backgroundColor: tokens.emeraldBg,
                color: tokens.emeraldText,
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              v1.1.0
            </span>
          </a>

          <div className="hidden md:flex items-center gap-6 lg:gap-7 text-[14px] font-semibold">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-emerald-600 px-1.5 min-h-[44px] flex items-center rounded"
                style={{ color: tokens.textSecondary }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div
              role="group"
              aria-label={t.nav.switchLangLabel}
              className="inline-flex items-center rounded-full p-0.5 text-[11px] font-bold"
              style={{
                backgroundColor: tokens.surfaceContainer,
                border: `1px solid ${tokens.border}`
              }}
            >
              <button
                type="button"
                onClick={() => handleLangChange('id')}
                className="px-2 sm:px-2.5 min-h-[44px] min-w-[36px] rounded-full transition-colors"
                style={{
                  backgroundColor: lang === 'id' ? tokens.surface : 'transparent',
                  color: lang === 'id' ? tokens.textPrimary : tokens.textSecondary
                }}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('en')}
                className="px-2 sm:px-2.5 min-h-[44px] min-w-[36px] rounded-full transition-colors"
                style={{
                  backgroundColor: lang === 'en' ? tokens.surface : 'transparent',
                  color: lang === 'en' ? tokens.textPrimary : tokens.textSecondary
                }}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleThemeChange(themeMode === 'light' ? 'dark' : 'light')}
              aria-label={
                themeMode === 'light' ? t.nav.toggleThemeToDark : t.nav.toggleThemeToLight
              }
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: tokens.surfaceContainer,
                color: tokens.textPrimary,
                border: `1px solid ${tokens.border}`
              }}
            >
              {themeMode === 'light' ? (
                <IconMoon className="w-4 h-4" />
              ) : (
                <IconSun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <a
              href={SAFE_LINKS.apkDownload}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex px-4 sm:px-5 min-h-[44px] rounded-full text-[13px] font-semibold items-center gap-1.5 text-white transition-colors hover:bg-[#047857]"
              style={{ backgroundColor: tokens.emerald }}
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>{t.nav.downloadShort}</span>
            </a>

            <button
              ref={mobileMenuBtnRef}
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
              style={{
                backgroundColor: tokens.surfaceContainer,
                color: tokens.textPrimary,
                border: `1px solid ${tokens.border}`
              }}
            >
              {mobileMenuOpen ? <IconX className="w-4 h-4" /> : <IconMenu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div
            id="mobile-nav-drawer"
            className="md:hidden mt-2 rounded-[24px] p-4 space-y-3 backdrop-blur-md"
            style={{
              backgroundColor: tokens.navBg,
              border: `1px solid ${tokens.border}`,
              boxShadow: tokens.navShadow
            }}
          >
            <div
              className="flex items-center justify-between px-3.5 pb-2.5 text-[12px] font-semibold tabular-nums"
              style={{
                borderBottom: `1px solid ${tokens.border}`,
                color: tokens.textSecondary
              }}
            >
              <span>Sakuva Android</span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px]"
                style={{
                  backgroundColor: tokens.emeraldBg,
                  color: tokens.emeraldText
                }}
              >
                v1.1.0 · 2.13 MB
              </span>
            </div>

            <div className="flex flex-col gap-1 text-[15px] font-semibold">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3.5 min-h-[44px] flex items-center rounded-xl transition-colors"
                  style={{ color: tokens.textPrimary }}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <a
              href={SAFE_LINKS.apkDownload}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full min-h-[48px] py-2.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: tokens.emerald }}
            >
              <IconDownload className="w-4 h-4" />
              <span className="tabular-nums">{t.hero.primaryCta} (2.13 MB)</span>
            </a>
          </div>
        )}
      </header>

      <main id="main-content" className="relative z-10">
        <section className="pt-32 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <h1
              ref={heroHeadlineRef}
              className="text-[32px] min-[375px]:text-[36px] sm:text-5xl md:text-[56px] font-extrabold tracking-tight leading-[1.1]"
            >
              {t.hero.headline}
            </h1>

            <p
              ref={heroSubtitleRef}
              className="text-[15px] sm:text-[17.5px] leading-relaxed max-w-2xl mx-auto tabular-nums"
              style={{ color: tokens.textSecondary }}
            >
              {t.hero.subtitle}
            </p>

            <div
              ref={heroCtasRef}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <a
                href={SAFE_LINKS.apkDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 min-h-[48px] py-3 rounded-full text-[14.5px] font-semibold flex items-center justify-center gap-2 text-white shadow-sm transition-colors hover:bg-[#047857]"
                style={{ backgroundColor: tokens.emerald }}
              >
                <IconDownload className="w-4 h-4" />
                <span className="tabular-nums">{t.hero.primaryCta}</span>
              </a>

              <a
                href="#fitur"
                className="w-full sm:w-auto px-6 min-h-[48px] py-3 rounded-full text-[14.5px] font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: tokens.surface,
                  border: `1px solid ${tokens.borderStrong}`,
                  color: tokens.textPrimary
                }}
              >
                <span>{t.hero.secondaryCta}</span>
                <IconChevronDown className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="relative mt-11 sm:mt-16 max-w-6xl mx-auto flex flex-col items-center">
            <div
              ref={heroWatermarkRef}
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center overflow-hidden"
            >
              <span
                className="font-extrabold tracking-[-0.04em] leading-none whitespace-nowrap"
                style={{
                  fontSize: 'clamp(4.4rem, 21vw, 17.5rem)',
                  color: tokens.watermarkColor
                }}
              >
                SAKUVA
              </span>
            </div>

            <div ref={heroPhoneRef} className="relative z-10">
              <PhoneMockup
                tokens={tokens}
                lang={lang}
                tScreens={t.screens}
                tPhone={t.phone}
                activeScreen={resolvedHeroScreen}
                onScreenChange={setHeroScreen}
                onToggleTheme={handleThemeChange}
                onToggleLang={handleLangChange}
                failedImages={failedImages}
                onImageError={handleImageError}
                isHero={true}
                instanceId="hero"
              />
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-2 max-w-full">
              {heroScreenTabs.map((tab) => {
                const active = resolvedHeroScreen === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setHeroScreen(tab.key)}
                    className="px-4 min-h-[44px] rounded-full text-[12.5px] sm:text-[13px] font-semibold transition-all"
                    style={{
                      backgroundColor: active ? tokens.emerald : tokens.surface,
                      color: active ? '#FFFFFF' : tokens.textSecondary,
                      border: `1px solid ${active ? tokens.emerald : tokens.borderStrong}`
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="fitur"
          ref={walkthroughSectionRef}
          className="py-16 sm:py-20 lg:py-28 px-4 sm:px-8 transition-colors duration-300"
          style={{
            backgroundColor: tokens.sectionAlt,
            borderTop: `1px solid ${tokens.hairline}`,
            borderBottom: `1px solid ${tokens.hairline}`
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-10 lg:mb-16">
              <p
                className="text-[12px] font-bold uppercase tracking-widest"
                style={{ color: tokens.emeraldText }}
              >
                {t.walkthrough.eyebrow}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
                {t.walkthrough.title}
              </h2>
              <p
                className="text-[14.5px] sm:text-[15px] mt-3 leading-relaxed"
                style={{ color: tokens.textSecondary }}
              >
                {t.walkthrough.subtitle}
              </p>
            </div>

            <div
              className="lg:hidden sticky top-[74px] z-30 mb-8 rounded-[20px] p-2 backdrop-blur-md flex items-center justify-between gap-2"
              style={{
                backgroundColor: tokens.navBg,
                border: `1px solid ${tokens.border}`,
                boxShadow: tokens.navShadow
              }}
            >
              <button
                type="button"
                aria-label={t.walkthrough.prevChapter}
                onClick={() => {
                  const prevIdx =
                    (activeChapterIdx - 1 + t.walkthrough.chapters.length) %
                    t.walkthrough.chapters.length;
                  handleSelectChapter(
                    prevIdx,
                    t.walkthrough.chapters[prevIdx].screen,
                    true
                  );
                }}
                className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: tokens.surfaceContainer,
                  color: tokens.textPrimary
                }}
              >
                <IconChevronLeft className="w-4 h-4" />
              </button>

              <div className="min-w-0 text-center px-1">
                <p
                  className="text-[11px] font-bold uppercase tracking-wider tabular-nums"
                  style={{ color: tokens.emeraldText }}
                >
                  {activeChapter.num} / 06 · {t.screens[activeChapter.screen]}
                </p>
                <p className="text-[13.5px] font-bold truncate">
                  {activeChapter.title}
                </p>
              </div>

              <button
                type="button"
                aria-label={t.walkthrough.nextChapter}
                onClick={() => {
                  const nextIdx =
                    (activeChapterIdx + 1) % t.walkthrough.chapters.length;
                  handleSelectChapter(
                    nextIdx,
                    t.walkthrough.chapters[nextIdx].screen,
                    true
                  );
                }}
                className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: tokens.surfaceContainer,
                  color: tokens.textPrimary
                }}
              >
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start flex flex-col items-center">
                <div ref={stickyPhoneRef}>
                  <PhoneMockup
                    tokens={tokens}
                    lang={lang}
                    tScreens={t.screens}
                    tPhone={t.phone}
                    activeScreen={walkthroughScreen}
                    onScreenChange={(nextScreen) => {
                      setWalkthroughScreen(nextScreen);
                      const matchIdx = t.walkthrough.chapters.findIndex(
                        (c) =>
                          c.screen === nextScreen ||
                          (c.subScreens && c.subScreens.includes(nextScreen))
                      );
                      if (matchIdx !== -1) setActiveChapterIdx(matchIdx);
                    }}
                    onToggleTheme={handleThemeChange}
                    onToggleLang={handleLangChange}
                    failedImages={failedImages}
                    onImageError={handleImageError}
                    isHero={false}
                    instanceId="walkthrough"
                  />
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-1.5 max-w-[350px]">
                  {t.walkthrough.chapters.map((ch, idx) => {
                    const isChapterActive = activeChapterIdx === idx;
                    return (
                      <button
                        key={ch.num}
                        type="button"
                        onClick={() => handleSelectChapter(idx, ch.screen, true)}
                        className="px-3 min-h-[44px] rounded-full text-[11.5px] font-semibold transition-colors tabular-nums"
                        style={{
                          backgroundColor: isChapterActive ? tokens.emerald : tokens.surface,
                          color: isChapterActive ? '#FFFFFF' : tokens.textSecondary,
                          border: `1px solid ${isChapterActive ? tokens.emerald : tokens.borderStrong}`
                        }}
                      >
                        {ch.num} · {t.screens[ch.screen]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-7 relative lg:pl-7">
                <div
                  aria-hidden="true"
                  className="hidden lg:block absolute left-0 top-6 bottom-6 w-[3px] rounded-full overflow-hidden"
                  style={{ backgroundColor: tokens.border }}
                >
                  <div
                    ref={progressRailRef}
                    className="w-full h-full origin-top rounded-full"
                    style={{ backgroundColor: tokens.emerald }}
                  />
                </div>

                <div className="space-y-5 sm:space-y-6">
                  {t.walkthrough.chapters.map((chapter, idx) => {
                    const isActive = activeChapterIdx === idx;
                    return (
                      <div
                        key={chapter.num}
                        ref={(el) => {
                          chapterRefs.current[idx] = el;
                        }}
                        data-chapter-idx={idx}
                        className="scroll-mt-36 lg:scroll-mt-28 lg:min-h-[44vh] flex flex-col justify-center"
                      >
                        <DoubleBezelCard
                          tokens={tokens}
                          active={isActive}
                          innerClassName="p-5 sm:p-8"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectChapter(idx, chapter.screen, false)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-bold tabular-nums transition-colors"
                                style={{
                                  backgroundColor: isActive ? tokens.emerald : tokens.emeraldBg,
                                  color: isActive ? '#FFFFFF' : tokens.emeraldText
                                }}
                              >
                                {chapter.num}
                              </span>

                              <span
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{
                                  backgroundColor: tokens.surfaceLow,
                                  color: isActive ? tokens.textPrimary : tokens.textSecondary
                                }}
                              >
                                {t.screens[chapter.screen]}
                              </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold tracking-tight mt-4">
                              {chapter.title}
                            </h3>

                            <p
                              className="text-[14px] sm:text-[14.5px] leading-relaxed mt-2"
                              style={{ color: tokens.textSecondary }}
                            >
                              {chapter.desc}
                            </p>

                            <ul className="mt-4 space-y-2.5">
                              {chapter.highlights.map((item) => (
                                <li
                                  key={item}
                                  className="flex items-start gap-2.5 text-[13px] sm:text-[13.5px]"
                                  style={{ color: tokens.textPrimary }}
                                >
                                  <span
                                    className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundColor: tokens.emeraldBg,
                                      color: tokens.emeraldText
                                    }}
                                  >
                                    <IconCheck className="w-2.5 h-2.5" />
                                  </span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </button>

                          {chapter.subScreens && (
                            <div
                              className="mt-5 pt-4 flex flex-wrap items-center gap-2"
                              style={{ borderTop: `1px solid ${tokens.border}` }}
                            >
                              <span
                                className="text-[12px] font-semibold mr-1"
                                style={{ color: tokens.textSecondary }}
                              >
                                {t.walkthrough.subScreenLabel}
                              </span>
                              {chapter.subScreens.map((subKey) => {
                                const subActive = walkthroughScreen === subKey;
                                return (
                                  <button
                                    key={subKey}
                                    type="button"
                                    onClick={() => handleSelectChapter(idx, subKey, false)}
                                    className="px-3.5 min-h-[44px] rounded-full text-[12px] font-semibold transition-colors"
                                    style={{
                                      backgroundColor: subActive
                                        ? tokens.emerald
                                        : tokens.surfaceLow,
                                      color: subActive ? '#FFFFFF' : tokens.textPrimary,
                                      border: `1px solid ${subActive ? tokens.emerald : tokens.borderStrong}`
                                    }}
                                  >
                                    {t.screens[subKey]}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </DoubleBezelCard>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20 lg:py-24">
          <div className="max-w-2xl mb-10">
            <p
              className="text-[12px] font-bold uppercase tracking-widest"
              style={{ color: tokens.emeraldText }}
            >
              {t.parity.eyebrow}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
              {t.parity.title}
            </h2>
            <p
              className="text-[14.5px] sm:text-[15px] mt-3 leading-relaxed"
              style={{ color: tokens.textSecondary }}
            >
              {t.parity.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ParityPreviewCard
              mode="light"
              isActive={themeMode === 'light'}
              title={t.parity.lightTitle}
              desc={t.parity.lightDesc}
              buttonLabel={t.parity.applyLight}
              activeBadge={t.parity.activeBadge}
              balanceLabel={t.phone.totalBalance}
              onSelect={() => handleThemeChange('light')}
              failedImages={failedImages}
              onImageError={handleImageError}
            />
            <ParityPreviewCard
              mode="dark"
              isActive={themeMode === 'dark'}
              title={t.parity.darkTitle}
              desc={t.parity.darkDesc}
              buttonLabel={t.parity.applyDark}
              activeBadge={t.parity.activeBadge}
              balanceLabel={t.phone.totalBalance}
              onSelect={() => handleThemeChange('dark')}
              failedImages={failedImages}
              onImageError={handleImageError}
            />
          </div>
        </section>

        <section
          id="tentang"
          className="py-16 sm:py-20 lg:py-28 px-4 sm:px-8 transition-colors duration-300"
          style={{
            backgroundColor: tokens.sectionAlt,
            borderTop: `1px solid ${tokens.hairline}`,
            borderBottom: `1px solid ${tokens.hairline}`
          }}
        >
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="gsap-reveal lg:col-span-6 space-y-4">
              <p
                className="text-[12px] font-bold uppercase tracking-widest"
                style={{ color: tokens.emeraldText }}
              >
                {t.about.eyebrow}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {t.about.title}
              </h2>
              <p
                className="text-[14.5px] sm:text-[15px] leading-relaxed tabular-nums"
                style={{ color: tokens.textSecondary }}
              >
                {t.about.p1}
              </p>
              <p
                className="text-[14.5px] sm:text-[15px] leading-relaxed"
                style={{ color: tokens.textSecondary }}
              >
                {t.about.p2}
              </p>
            </div>

            <div className="gsap-reveal lg:col-span-6">
              <DoubleBezelCard tokens={tokens} innerClassName="p-5 sm:p-7">
                <div
                  className="flex items-center justify-between gap-3 pb-4 mb-5"
                  style={{ borderBottom: `1px solid ${tokens.border}` }}
                >
                  <div className="flex items-center gap-2.5">
                    <IconShield className="w-5 h-5 text-emerald-500 shrink-0" />
                    <h3 className="text-[16px] sm:text-[17px] font-bold tabular-nums">
                      {t.about.releaseCardTitle}
                    </h3>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums shrink-0"
                    style={{
                      backgroundColor: tokens.emeraldBg,
                      color: tokens.emeraldText
                    }}
                  >
                    {t.about.releaseCardBadge}
                  </span>
                </div>

                <ul className="space-y-3.5">
                  {t.about.releaseNotes.map((note) => (
                    <li
                      key={note}
                      className="flex items-start gap-3 text-[13.5px] sm:text-[14px] leading-relaxed"
                      style={{ color: tokens.textSecondary }}
                    >
                      <span
                        className="mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: tokens.emeraldBg,
                          color: tokens.emeraldText
                        }}
                      >
                        <IconCheck className="w-2.5 h-2.5" />
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </DoubleBezelCard>
            </div>
          </div>
        </section>

        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-20 lg:py-28">
          <div className="text-center mb-10 sm:mb-12">
            <p
              className="text-[12px] font-bold uppercase tracking-widest"
              style={{ color: tokens.emeraldText }}
            >
              {t.faq.eyebrow}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
              {t.faq.title}
            </h2>
          </div>

          <div className="space-y-3.5">
            {t.faq.items.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              const panelId = `faq-panel-${idx}`;
              const btnId = `faq-btn-${idx}`;
              return (
                <div key={item.q} className="gsap-reveal">
                  <DoubleBezelCard tokens={tokens} innerClassName="overflow-hidden">
                    <button
                      id={btnId}
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="w-full px-5 sm:px-6 py-4 min-h-[56px] text-left flex items-center justify-between gap-4"
                    >
                      <span className="text-[14.5px] sm:text-[16px] font-semibold">
                        {item.q}
                      </span>
                      <IconChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={btnId}
                        className="px-5 sm:px-6 pb-5 text-[13.5px] sm:text-[14px] leading-relaxed tabular-nums"
                        style={{ color: tokens.textSecondary }}
                      >
                        {item.a}
                      </div>
                    )}
                  </DoubleBezelCard>
                </div>
              );
            })}
          </div>
        </section>

        <section id="contact" className="px-4 sm:px-8 pb-16 sm:pb-20 lg:pb-24">
          <div className="gsap-reveal max-w-4xl mx-auto">
            <DoubleBezelCard tokens={tokens} innerClassName="p-6 sm:p-11 text-center">
              <p
                className="text-[12px] font-bold uppercase tracking-widest"
                style={{ color: tokens.emeraldText }}
              >
                {t.contact.eyebrow}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
                {t.contact.title}
              </h2>
              <p
                className="text-[14px] sm:text-[15.5px] leading-relaxed max-w-xl mx-auto mt-3 tabular-nums"
                style={{ color: tokens.textSecondary }}
              >
                {t.contact.subtitle}
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={SAFE_LINKS.apkDownload}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 min-h-[48px] py-3 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 text-white transition-colors hover:bg-[#047857]"
                  style={{ backgroundColor: tokens.emerald }}
                >
                  <IconDownload className="w-4 h-4 shrink-0" />
                  <span className="tabular-nums">{t.contact.apkBtn}</span>
                </a>

                <a
                  href={SAFE_LINKS.githubRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 min-h-[48px] py-3 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{
                    backgroundColor: tokens.surfaceContainer,
                    color: tokens.textPrimary
                  }}
                >
                  <IconGithub className="w-4 h-4 shrink-0" />
                  <span>{t.contact.githubBtn}</span>
                </a>

                <a
                  href={SAFE_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 min-h-[48px] py-3 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{
                    backgroundColor: tokens.surfaceContainer,
                    color: tokens.textPrimary
                  }}
                >
                  <IconInstagram className="w-4 h-4 shrink-0" />
                  <span>{t.contact.igBtn}</span>
                </a>
              </div>
            </DoubleBezelCard>
          </div>
        </section>
      </main>

      <footer
        className="py-10 px-4 sm:px-8"
        style={{
          backgroundColor: tokens.bg,
          borderTop: `1px solid ${tokens.border}`
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BrandIcon
              dark={themeMode === 'dark'}
              size={26}
              failedImages={failedImages}
              onImageError={handleImageError}
            />
            <span className="text-[13.5px] font-semibold tabular-nums">
              {t.footer.credit}
            </span>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-6 text-[13px] font-semibold"
            style={{ color: tokens.textSecondary }}
          >
            <a
              href={SAFE_LINKS.apkDownload}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center hover:opacity-80 transition-opacity tabular-nums"
            >
              {t.footer.releases}
            </a>
            <a
              href={SAFE_LINKS.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center hover:opacity-80 transition-opacity"
            >
              GitHub
            </a>
            <a
              href={SAFE_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center hover:opacity-80 transition-opacity"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}